export type LlmUsageSource = "mcp" | "web_demo" | "paid_api";
export type LlmUsageStatus = "ok" | "parse_failed" | "upstream_error";

export interface LlmUsageEnv {
  LEADERBOARD_KV: KVNamespace;
  LLM_PRICING_JSON?: string;
  LLM_PRICING_VERSION?: string;
  USAGE_READ_TOKEN?: string;
}

export interface LlmTokenUsage {
  input_tokens: number | null;
  cached_input_tokens: number | null;
  output_tokens: number | null;
  reasoning_tokens: number | null;
  total_tokens: number | null;
}

interface ModelPricing {
  input_usd_per_mtok: number | null;
  cached_input_usd_per_mtok: number | null;
  output_usd_per_mtok: number | null;
}

type PricingConfig = Record<string, ModelPricing>;

export interface LlmUsageRecord {
  version: 1;
  tool: "analyze_hook";
  source: LlmUsageSource;
  status: LlmUsageStatus;
  model: string;
  input_tokens: number | null;
  cached_input_tokens: number | null;
  output_tokens: number | null;
  reasoning_tokens: number | null;
  total_tokens: number | null;
  estimated_cost_micro_usd: number | null;
  pricing_version: string;
  pricing_missing: boolean;
  latency_ms: number;
  is_example: boolean;
  receipt_id: string;
  occurred_at: string;
}

const RETENTION_SECONDS = 400 * 24 * 60 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

function tokenCount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function extractUsage(aiResp: any): LlmTokenUsage {
  const usage = aiResp?.usage;
  return {
    input_tokens: tokenCount(usage?.input_tokens ?? usage?.prompt_tokens),
    cached_input_tokens: tokenCount(usage?.input_tokens_details?.cached_tokens),
    output_tokens: tokenCount(usage?.output_tokens ?? usage?.completion_tokens),
    reasoning_tokens: tokenCount(usage?.output_tokens_details?.reasoning_tokens),
    total_tokens: tokenCount(usage?.total_tokens),
  };
}

export function estimateCost(
  usage: LlmTokenUsage,
  model: string,
  pricing: PricingConfig | null,
): { estimatedCostMicroUsd: number | null; pricingMissing: boolean } {
  const modelPricing = pricing?.[model];
  if (
    !modelPricing
    || usage.input_tokens === null
    || usage.output_tokens === null
    || modelPricing.input_usd_per_mtok === null
    || modelPricing.output_usd_per_mtok === null
  ) {
    return { estimatedCostMicroUsd: null, pricingMissing: true };
  }

  const cachedTokens = Math.min(usage.cached_input_tokens ?? 0, usage.input_tokens);
  const cachedPrice = modelPricing.cached_input_usd_per_mtok ?? modelPricing.input_usd_per_mtok;
  const estimatedCostMicroUsd = Math.round(
    (usage.input_tokens - cachedTokens) * modelPricing.input_usd_per_mtok
    + cachedTokens * cachedPrice
    + usage.output_tokens * modelPricing.output_usd_per_mtok,
  );
  return { estimatedCostMicroUsd, pricingMissing: false };
}

function parsePricing(raw: string | undefined): PricingConfig | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid pricing");
    const entries = Object.values(parsed) as unknown[];
    const valid = entries.every((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
      const prices = entry as Record<string, unknown>;
      return ["input_usd_per_mtok", "cached_input_usd_per_mtok", "output_usd_per_mtok"].every((key) => {
        const value = prices[key];
        return value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0);
      });
    });
    if (!valid) throw new Error("invalid pricing");
    return parsed as PricingConfig;
  } catch {
    console.warn(JSON.stringify({ event: "llm_pricing_invalid" }));
    return null;
  }
}

export function buildLlmUsageRecord(
  env: LlmUsageEnv,
  aiResp: any,
  input: {
    source: LlmUsageSource;
    status: LlmUsageStatus;
    latencyMs: number;
    isExample: boolean;
    receiptId: string;
    defaultModel: string;
    occurredAt?: string;
  },
): LlmUsageRecord {
  const usage = extractUsage(aiResp);
  const model = typeof aiResp?.model === "string" && aiResp.model ? aiResp.model : input.defaultModel;
  const estimate = estimateCost(usage, model, parsePricing(env.LLM_PRICING_JSON));
  return {
    version: 1,
    tool: "analyze_hook",
    source: input.source,
    status: input.status,
    model,
    ...usage,
    estimated_cost_micro_usd: estimate.estimatedCostMicroUsd,
    pricing_version: env.LLM_PRICING_VERSION ?? "unconfigured",
    pricing_missing: estimate.pricingMissing,
    latency_ms: input.latencyMs,
    is_example: input.isExample,
    receipt_id: input.receiptId,
    occurred_at: input.occurredAt ?? new Date().toISOString(),
  };
}

export async function recordLlmUsage(env: LlmUsageEnv, record: LlmUsageRecord): Promise<void> {
  try {
    const metadata = Object.fromEntries(
      Object.entries(record).filter(([key]) => key !== "version"),
    ) as Omit<LlmUsageRecord, "version">;
    const key = `usage:llm:${record.occurred_at.slice(0, 10)}:${record.receipt_id}`;
    await env.LEADERBOARD_KV.put(key, JSON.stringify(record), {
      expirationTtl: RETENTION_SECONDS,
      metadata,
    });
    console.log(JSON.stringify({ event: "llm_usage", ...record }));
  } catch {
    console.warn(JSON.stringify({ event: "llm_usage_write_failed" }));
  }
}

interface UsageSummaryEnv extends LlmUsageEnv {
  USAGE_READ_TOKEN?: string;
}

interface WindowFilter {
  startMs: number;
  endMs: number;
  from: string;
  to: string;
  since?: string;
  until?: string;
}

function parseDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return null;
  return timestamp;
}

function parseIsoTimestamp(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function dayString(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function parseWindow(params: URLSearchParams): WindowFilter | null {
  const from = params.get("from");
  const to = params.get("to");
  const since = params.get("since");
  const until = params.get("until");
  if ((since || until) && (from || to)) return null;

  if (since || until) {
    if (!since || !until) return null;
    const startMs = parseIsoTimestamp(since);
    const endMs = parseIsoTimestamp(until);
    if (startMs === null || endMs === null || endMs < startMs || endMs - startMs > 31 * DAY_MS) return null;
    return { startMs, endMs, from: dayString(startMs), to: dayString(endMs), since, until };
  }

  const today = dayString(Date.now());
  const fromDay = parseDay(from ?? today);
  const toDay = parseDay(to ?? today);
  if (fromDay === null || toDay === null || toDay < fromDay || toDay - fromDay > 30 * DAY_MS) return null;
  return { startMs: fromDay, endMs: toDay + DAY_MS, from: from ?? today, to: to ?? today };
}

async function tokensMatch(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [providedDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const left = new Uint8Array(providedDigest);
  const right = new Uint8Array(expectedDigest);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index]! ^ right[index]!;
  return difference === 0;
}

function microUsd(value: number): string {
  return (value / 1_000_000).toFixed(6);
}

function csvValue(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function listUsageRecords(env: UsageSummaryEnv, window: WindowFilter): Promise<LlmUsageRecord[]> {
  const records: LlmUsageRecord[] = [];
  for (let day = Date.parse(`${window.from}T00:00:00.000Z`); day <= Date.parse(`${window.to}T00:00:00.000Z`); day += DAY_MS) {
    let cursor: string | undefined;
    do {
      const page = await env.LEADERBOARD_KV.list({ prefix: `usage:llm:${dayString(day)}:`, ...(cursor ? { cursor } : {}) });
      for (const key of page.keys) {
        const record = key.metadata as Omit<LlmUsageRecord, "version"> | undefined;
        if (!record || typeof record.occurred_at !== "string") continue;
        const occurredMs = Date.parse(record.occurred_at);
        if (Number.isFinite(occurredMs) && occurredMs >= window.startMs && occurredMs < window.endMs) {
          records.push({ version: 1, ...record });
        }
      }
      if (page.list_complete) break;
      cursor = page.cursor;
    } while (cursor);
  }
  return records;
}

export async function handleUsageSummary(request: Request, env: UsageSummaryEnv): Promise<Response> {
  if (request.method !== "GET") return usageJson({ ok: false, error: "method_not_allowed" }, 405, { Allow: "GET" });
  if (!env.USAGE_READ_TOKEN) return usageJson({ ok: false, error: "usage_report_not_configured" }, 503);
  const authorization = request.headers.get("Authorization") ?? "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!provided || !(await tokensMatch(provided, env.USAGE_READ_TOKEN))) {
    return usageJson({ ok: false, error: "unauthorized" }, 401);
  }

  const url = new URL(request.url);
  const window = parseWindow(url.searchParams);
  const source = url.searchParams.get("source") ?? "all";
  const format = url.searchParams.get("format") ?? "json";
  if (!window || !["all", "mcp", "web_demo", "paid_api"].includes(source) || !["json", "csv"].includes(format)) {
    return usageJson({ ok: false, error: "invalid_usage_query" }, 400);
  }

  const records = (await listUsageRecords(env, window)).filter((record) => source === "all" || record.source === source);
  if (format === "csv") {
    const header = "occurred_at,receipt_id,source,status,model,input_tokens,output_tokens,estimated_cost_usd,pricing_version";
    const rows = records.map((record) => [
      record.occurred_at,
      record.receipt_id,
      record.source,
      record.status,
      record.model,
      record.input_tokens,
      record.output_tokens,
      record.estimated_cost_micro_usd === null ? null : microUsd(record.estimated_cost_micro_usd),
      record.pricing_version,
    ].map(csvValue).join(","));
    return new Response(`${[header, ...rows].join("\n")}\n`, {
      headers: { "content-type": "text/csv; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const byDay = new Map<string, { calls: number; input_tokens: number; output_tokens: number; cost: number }>();
  const byModel = new Map<string, { calls: number; cost: number }>();
  let cost = 0;
  let callsWithoutPricing = 0;
  let ok = 0;
  let parseFailed = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let realCalls = 0;
  let exampleCalls = 0;
  const pricingVersions = new Set<string>();

  for (const record of records) {
    if (record.status === "ok") ok += 1;
    if (record.status === "parse_failed") parseFailed += 1;
    if (record.is_example) exampleCalls += 1;
    else realCalls += 1;
    inputTokens += record.input_tokens ?? 0;
    outputTokens += record.output_tokens ?? 0;
    pricingVersions.add(record.pricing_version);
    if (record.estimated_cost_micro_usd === null) callsWithoutPricing += 1;
    else cost += record.estimated_cost_micro_usd;

    const date = record.occurred_at.slice(0, 10);
    const day = byDay.get(date) ?? { calls: 0, input_tokens: 0, output_tokens: 0, cost: 0 };
    day.calls += 1;
    day.input_tokens += record.input_tokens ?? 0;
    day.output_tokens += record.output_tokens ?? 0;
    day.cost += record.estimated_cost_micro_usd ?? 0;
    byDay.set(date, day);

    const model = byModel.get(record.model) ?? { calls: 0, cost: 0 };
    model.calls += 1;
    model.cost += record.estimated_cost_micro_usd ?? 0;
    byModel.set(record.model, model);
  }

  return usageJson({
    ok: true,
    from: window.from,
    to: window.to,
    ...(window.since ? { since: window.since, until: window.until } : {}),
    source,
    currency: "USD",
    pricing_version: [...pricingVersions].sort(),
    totals: {
      calls: records.length,
      ok,
      parse_failed: parseFailed,
      real_calls: realCalls,
      example_calls: exampleCalls,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: microUsd(cost),
      calls_without_pricing: callsWithoutPricing,
    },
    by_day: [...byDay.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([date, day]) => ({
      date,
      calls: day.calls,
      input_tokens: day.input_tokens,
      output_tokens: day.output_tokens,
      estimated_cost_usd: microUsd(day.cost),
    })),
    by_model: [...byModel.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([model, summary]) => ({
      model,
      calls: summary.calls,
      estimated_cost_usd: microUsd(summary.cost),
    })),
  });
}

function usageJson(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...extraHeaders },
  });
}
