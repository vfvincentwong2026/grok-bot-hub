import { AnalysisOptionsError, INDONESIAN_EXAMPLE, resolveAnalysisOptions } from "./analysis-options";
import { extractOutputText, parseHookAnalysis } from "./analysis-result";
import { AI_ATTRIBUTION } from "./attribution";
import { hashScriptText, recordFirstPartyEvent } from "./events";
import { recordMetric } from "./leaderboard";
import { buildLlmUsageRecord, recordLlmUsage, type LlmUsageEnv, type LlmUsageSource } from "./llm-usage";
import { getBot } from "./registry";

interface DemoEnv extends LlmUsageEnv {
  XAI_API_KEY: string;
  XAI_BASE_URL: string;
  GROK_DEFAULT_MODEL: string;
}

const DEMO_BOT_ID = "bot:drama-hook-analyzer";
const HOURLY_IP_LIMIT = 3;
const DAILY_GLOBAL_LIMIT = 20;

export async function handleDemoInvoke(request: Request, env: DemoEnv, source: LlmUsageSource = "web_demo"): Promise<Response> {
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

  let options;
  try {
    options = resolveAnalysisOptions({ ...body, script_text: scriptText });
  } catch (error) {
    if (error instanceof AnalysisOptionsError) {
      return json({ ok: false, error: "invalid_analysis_options", field: error.field }, 400);
    }
    throw error;
  }

  const reservation = await reserveDemoLimits(request, env);
  if (!reservation) return json({ ok: false, error: "demo_rate_limited" }, 429);

  const bot = getBot(DEMO_BOT_ID)!;
  const started = Date.now();

  try {
    const { system, user } = bot.buildPrompt({ script_text: scriptText, ...options });
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
        max_output_tokens: 900,
      }),
    });
    if (!response.ok) throw new Error(`xAI request failed with status ${response.status}`);

    const aiResp = (await response.json()) as any;
    const latency_ms = Date.now() - started;
    const tokens = typeof aiResp?.usage?.total_tokens === "number" ? aiResp.usage.total_tokens : undefined;
    const receiptId = crypto.randomUUID();
    const usageRecord = buildLlmUsageRecord(env, aiResp, {
      source,
      status: "ok",
      latencyMs: latency_ms,
      isExample: scriptText === INDONESIAN_EXAMPLE,
      receiptId,
      defaultModel: env.GROK_DEFAULT_MODEL,
    });
    let analysis;
    try {
      analysis = parseHookAnalysis(extractOutputText(aiResp), receiptId);
    } catch (error) {
      await Promise.allSettled([recordLlmUsage(env, { ...usageRecord, status: "parse_failed" })]);
      throw error;
    }
    const scriptHash = await hashScriptText(scriptText);
    await Promise.allSettled([
      recordMetric(env, bot.id, { latency_ms, tokens, ok: true }),
      recordFirstPartyEvent(env, "demo_done", { duration_ms: latency_ms, script_hash: scriptHash }),
      recordLlmUsage(env, usageRecord),
    ]);

    return json({ ok: true, bot: bot.id, analysis, receipt_id: receiptId, attribution: AI_ATTRIBUTION, options, usage: { latency_ms } });
  } catch {
    const latency_ms = Date.now() - started;
    await Promise.allSettled([
      ...reservation.map((entry) => decrement(env, entry)),
      recordMetric(env, bot.id, { latency_ms, ok: false }),
    ]);
    return json({ ok: false, error: "demo_ai_unavailable" }, 502);
  }
}

interface DemoReservation {
  key: string;
  ttl: number;
}

async function reserveDemoLimits(request: Request, env: DemoEnv): Promise<DemoReservation[] | null> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  const ipHash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 16);
  const day = new Date().toISOString().slice(0, 10);
  const ipReservation = { key: `demo:ip:${ipHash}`, ttl: 3600 };
  const globalReservation = { key: `demo:global:${day}`, ttl: 86400 };

  // KV provides best-effort throttling, not atomic Durable Object counters.
  if (!(await increment(env, ipReservation.key, HOURLY_IP_LIMIT, ipReservation.ttl))) return null;
  if (!(await increment(env, globalReservation.key, DAILY_GLOBAL_LIMIT, globalReservation.ttl))) {
    await decrement(env, ipReservation);
    return null;
  }
  return [ipReservation, globalReservation];
}

async function increment(env: DemoEnv, key: string, limit: number, ttl: number): Promise<boolean> {
  const current = Number((await env.LEADERBOARD_KV.get(key)) ?? "0");
  if (current >= limit) return false;
  await env.LEADERBOARD_KV.put(key, String(current + 1), { expirationTtl: ttl });
  return true;
}

async function decrement(env: DemoEnv, reservation: DemoReservation): Promise<void> {
  const current = Number((await env.LEADERBOARD_KV.get(reservation.key)) ?? "0");
  await env.LEADERBOARD_KV.put(reservation.key, String(Math.max(0, current - 1)), {
    expirationTtl: reservation.ttl,
  });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
