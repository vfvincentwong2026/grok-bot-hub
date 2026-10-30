import { AnalysisOptionsError, INDONESIAN_EXAMPLE, resolveAnalysisOptions } from "./analysis-options";
import { extractOutputText, parseHookAnalysis } from "./analysis-result";
import { AI_ATTRIBUTION } from "./attribution";
import { hashApiKey } from "./api-keys";
import { hashScriptText, recordFirstRealCall } from "./events";
import { recordMetric } from "./leaderboard";
import { getPaidPlan } from "./plans";
import { getBot } from "./registry";

interface PaidEnv {
  LEADERBOARD_KV: KVNamespace;
  USAGE_COUNTER: DurableObjectNamespace;
  XAI_API_KEY: string;
  XAI_BASE_URL: string;
  GROK_DEFAULT_MODEL: string;
}

interface ApiKeyRecord {
  plan: string;
  status: string;
  expires_at: string;
}

const PAID_BOT_ID = "bot:drama-hook-analyzer";

export async function handlePaidInvoke(request: Request, env: PaidEnv): Promise<Response> {
  const apiKey = request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
  if (!apiKey.startsWith("gbh_")) return json({ ok: false, error: "invalid_api_key" }, 401);

  const keyHash = await hashApiKey(apiKey);
  const keyRecord = (await env.LEADERBOARD_KV.get(`apikey:${keyHash}`, "json")) as ApiKeyRecord | null;
  const plan = keyRecord?.status === "active" ? getPaidPlan(keyRecord.plan) : undefined;
  if (!plan || plan.id === "free" || !plan.analysisLimit || !keyRecord?.expires_at) {
    return json({ ok: false, error: "invalid_api_key" }, 401);
  }
  const expiresAt = Date.parse(keyRecord.expires_at);
  if (!Number.isFinite(expiresAt)) return json({ ok: false, error: "invalid_api_key" }, 401);
  if (expiresAt <= Date.now()) return json({ ok: false, error: "api_key_expired" }, 401);

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

  const quota = await updateQuota(env, keyHash, "consume", plan.analysisLimit);
  if (!quota.allowed) {
    return json({
      ok: false,
      error: "pass_quota_exceeded",
      usage: { used: quota.used, remaining: 0, limit: plan.analysisLimit, expires_at: keyRecord.expires_at },
    }, 429);
  }

  const bot = getBot(PAID_BOT_ID)!;
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
    const receiptId = crypto.randomUUID();
    const analysis = parseHookAnalysis(extractOutputText(aiResp), receiptId);
    const latency_ms = Date.now() - started;
    const tokens = typeof aiResp?.usage?.total_tokens === "number" ? aiResp.usage.total_tokens : undefined;
    const scriptHash = await hashScriptText(scriptText);
    await Promise.allSettled([
      recordMetric(env, bot.id, { latency_ms, tokens, ok: true }),
      ...(scriptText !== INDONESIAN_EXAMPLE ? [recordFirstRealCall(env, keyHash, scriptHash)] : []),
    ]);
    return json({
      ok: true,
      bot: bot.id,
      analysis,
      receipt_id: receiptId,
      attribution: AI_ATTRIBUTION,
      options,
      usage: {
        latency_ms,
        used: quota.used,
        remaining: quota.remaining,
        limit: plan.analysisLimit,
        expires_at: keyRecord.expires_at,
      },
    });
  } catch {
    const latency_ms = Date.now() - started;
    await Promise.allSettled([
      updateQuota(env, keyHash, "refund", plan.analysisLimit),
      recordMetric(env, bot.id, { latency_ms, ok: false }),
    ]);
    return json({ ok: false, error: "paid_ai_unavailable" }, 502);
  }
}

async function updateQuota(
  env: PaidEnv,
  counterName: string,
  operation: "consume" | "refund",
  limit: number,
): Promise<{ allowed: boolean; used: number; remaining: number }> {
  const id = env.USAGE_COUNTER.idFromName(counterName);
  const counter = env.USAGE_COUNTER.get(id);
  const response = await counter.fetch("https://usage.counter/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operation, limit }),
  });
  if (!response.ok) throw new Error("Usage counter unavailable");
  return (await response.json()) as { allowed: boolean; used: number; remaining: number };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
