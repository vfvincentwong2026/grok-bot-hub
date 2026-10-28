import { recordMetric } from "./leaderboard";
import { getBot } from "./registry";

interface DemoEnv {
  LEADERBOARD_KV: KVNamespace;
  XAI_API_KEY: string;
  XAI_BASE_URL: string;
  GROK_DEFAULT_MODEL: string;
}

const DEMO_BOT_ID = "bot:drama-hook-analyzer";
const HOURLY_IP_LIMIT = 3;
const DAILY_GLOBAL_LIMIT = 20;

export async function handleDemoInvoke(request: Request, env: DemoEnv): Promise<Response> {
  const origin = request.headers.get("Origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json({ ok: false, error: "cross_origin_demo_forbidden" }, 403);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const scriptText = typeof body?.script_text === "string" ? body.script_text.trim() : "";
  if (scriptText.length < 10 || scriptText.length > 1200) {
    return json({ ok: false, error: "script_text_must_be_10_to_1200_characters" }, 400);
  }

  if (!(await withinDemoLimits(request, env))) {
    return json({ ok: false, error: "demo_rate_limited" }, 429);
  }

  const bot = getBot(DEMO_BOT_ID)!;
  const started = Date.now();

  try {
    const { system, user } = bot.buildPrompt({
      script_text: scriptText,
      target_audience: "US_GenZ",
      output_language: "EN",
      platform: "reels",
    });
    const response = await fetch(`${env.XAI_BASE_URL}/responses`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.GROK_DEFAULT_MODEL,
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_output_tokens: 500,
      }),
    });
    if (!response.ok) throw new Error(`xAI request failed with status ${response.status}`);

    const aiResp = (await response.json()) as any;
    const latency_ms = Date.now() - started;
    const tokens = typeof aiResp?.usage?.total_tokens === "number" ? aiResp.usage.total_tokens : undefined;
    await recordMetric(env, bot.id, { latency_ms, tokens, ok: true });

    const text = extractOutputText(aiResp);
    let analysis: unknown = text;
    try {
      analysis = JSON.parse(text);
    } catch {
      // Keep the plain-text response when the model does not return valid JSON.
    }

    return json({ ok: true, bot: bot.id, analysis, usage: { latency_ms } });
  } catch {
    const latency_ms = Date.now() - started;
    await recordMetric(env, bot.id, { latency_ms, ok: false });
    return json({ ok: false, error: "demo_ai_unavailable" }, 502);
  }
}

async function withinDemoLimits(request: Request, env: DemoEnv): Promise<boolean> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  const ipHash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 16);
  const day = new Date().toISOString().slice(0, 10);

  // KV provides best-effort throttling, not atomic Durable Object counters.
  if (!(await increment(env, `demo:ip:${ipHash}`, HOURLY_IP_LIMIT, 3600))) return false;
  return increment(env, `demo:global:${day}`, DAILY_GLOBAL_LIMIT, 86400);
}

async function increment(env: DemoEnv, key: string, limit: number, ttl: number): Promise<boolean> {
  const current = Number((await env.LEADERBOARD_KV.get(key)) ?? "0");
  if (current >= limit) return false;
  await env.LEADERBOARD_KV.put(key, String(current + 1), { expirationTtl: ttl });
  return true;
}

function extractOutputText(response: any): string {
  if (typeof response?.output_text === "string") return response.output_text;
  const output = Array.isArray(response?.output) ? response.output : [];
  const texts: string[] = [];
  for (const item of output) {
    if (item?.type !== "message" || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (part?.type === "output_text" && typeof part.text === "string") texts.push(part.text);
    }
  }
  return texts.join("\n");
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
