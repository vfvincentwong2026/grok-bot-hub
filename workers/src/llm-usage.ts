export type LlmUsageSource = "mcp" | "web_demo" | "paid_api" | "internal_patrol";
export type LlmUsageStatus = "ok" | "parse_failed" | "upstream_error";

export interface LlmUsageEnv {
  LEADERBOARD_KV: KVNamespace;
  LLM_PRICING_JSON?: string;
  LLM_PRICING_VERSION?: string;
  USAGE_READ_TOKEN?: string;
  INTERNAL_PATROL_TOKEN?: string;
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

export async function isInternalPatrol(request: Request, env: LlmUsageEnv): Promise<boolean> {
  const expected = env.INTERNAL_PATROL_TOKEN;
  const provided = request.headers.get("X-GBH-Internal-Patrol");
  if (!expected || !provided) return false;
  return tokensMatch(provided, expected);
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

type CostStatus = "complete" | "partial" | "no_data";

interface Aggregate {
  calls: number;
  ok: number;
  parseFailed: number;
  upstreamError: number;
  inputTokens: number;
  outputTokens: number;
  pricedMicroUsd: number;
  pricedCalls: number;
  unpricedCalls: number;
}

function emptyAggregate(): Aggregate {
  return {
    calls: 0,
    ok: 0,
    parseFailed: 0,
    upstreamError: 0,
    inputTokens: 0,
    outputTokens: 0,
    pricedMicroUsd: 0,
    pricedCalls: 0,
    unpricedCalls: 0,
  };
}

function addToAggregate(aggregate: Aggregate, record: LlmUsageRecord): void {
  aggregate.calls += 1;
  if (record.status === "ok") aggregate.ok += 1;
  if (record.status === "parse_failed") aggregate.parseFailed += 1;
  if (record.status === "upstream_error") aggregate.upstreamError += 1;
  aggregate.inputTokens += record.input_tokens ?? 0;
  aggregate.outputTokens += record.output_tokens ?? 0;
  if (record.status === "upstream_error") return;
  if (record.estimated_cost_micro_usd === null) aggregate.unpricedCalls += 1;
  else {
    aggregate.pricedCalls += 1;
    aggregate.pricedMicroUsd += record.estimated_cost_micro_usd;
  }
}

function costStatus(aggregate: Aggregate): CostStatus {
  if (aggregate.pricedCalls === 0) return "no_data";
  return aggregate.unpricedCalls === 0 ? "complete" : "partial";
}

function estimatedCost(aggregate: Aggregate): string | null {
  return costStatus(aggregate) === "complete" ? microUsd(aggregate.pricedMicroUsd) : null;
}

function nullTotals() {
  return {
    calls: null,
    ok: null,
    parse_failed: null,
    upstream_error: null,
    input_tokens: null,
    output_tokens: null,
    estimated_cost_usd: null,
    priced_subtotal_usd: null,
    cost_status: "no_data",
    priced_calls: null,
    unpriced_calls: null,
  };
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
  if (!window || !["all", "mcp", "web_demo", "paid_api", "internal_patrol"].includes(source) || !["json", "csv"].includes(format)) {
    return usageJson({ ok: false, error: "invalid_usage_query" }, 400);
  }

  const records = (await listUsageRecords(env, window)).filter((record) => source === "all" || record.source === source);
  if (format === "csv") {
    const header = "occurred_at,receipt_id,source,status,model,input_tokens,output_tokens,estimated_cost_usd,cost_status,is_example,pricing_version";
    const rows = records.map((record) => [
      record.occurred_at,
      record.receipt_id,
      record.source,
      record.status,
      record.model,
      record.input_tokens,
      record.output_tokens,
      record.estimated_cost_micro_usd === null ? null : microUsd(record.estimated_cost_micro_usd),
      record.estimated_cost_micro_usd === null ? "unpriced" : "priced",
      record.is_example,
      record.pricing_version,
    ].map(csvValue).join(","));
    return new Response(`${[header, ...rows].join("\n")}\n`, {
      headers: { "content-type": "text/csv; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const excluded = {
    example_calls: records.filter((record) => record.is_example).length,
    internal_patrol_calls: source === "all" ? records.filter((record) => record.source === "internal_patrol").length : 0,
  };
  const included = records.filter((record) => (
    !record.is_example && (source === "internal_patrol" || record.source !== "internal_patrol")
  ));
  const pricingVersions = new Set(records.map((record) => record.pricing_version));
  const noData = source === "paid_api" || included.length === 0;
  const noDataReason = source === "paid_api" ? "paid_api_not_instrumented" : noData ? "no_records_in_window" : null;
  const totals = emptyAggregate();
  const bySource: Record<string, number> = source === "all" ? { mcp: 0, web_demo: 0 } : {};
  const byDay = new Map<string, Aggregate>();
  const byModel = new Map<string, Aggregate>();

  for (const record of included) {
    addToAggregate(totals, record);
    bySource[record.source] = (bySource[record.source] ?? 0) + 1;
    const date = record.occurred_at.slice(0, 10);
    const day = byDay.get(date) ?? emptyAggregate();
    addToAggregate(day, record);
    byDay.set(date, day);
    const model = byModel.get(record.model) ?? emptyAggregate();
    addToAggregate(model, record);
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
    status: noData ? "no_data" : "ok",
    no_data_reason: noDataReason,
    totals: noData ? nullTotals() : {
      calls: totals.calls,
      ok: totals.ok,
      parse_failed: totals.parseFailed,
      upstream_error: totals.upstreamError,
      input_tokens: totals.inputTokens,
      output_tokens: totals.outputTokens,
      estimated_cost_usd: estimatedCost(totals),
      priced_subtotal_usd: totals.pricedCalls > 0 ? microUsd(totals.pricedMicroUsd) : null,
      cost_status: costStatus(totals),
      priced_calls: totals.pricedCalls,
      unpriced_calls: totals.unpricedCalls,
    },
    by_source: noData ? {} : bySource,
    excluded,
    by_day: noData ? [] : [...byDay.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([date, day]) => ({
      date,
      calls: day.calls,
      input_tokens: day.inputTokens,
      output_tokens: day.outputTokens,
      estimated_cost_usd: estimatedCost(day),
      cost_status: costStatus(day),
      unpriced_calls: day.unpricedCalls,
    })),
    by_model: noData ? [] : [...byModel.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([model, summary]) => ({
      model,
      calls: summary.calls,
      estimated_cost_usd: estimatedCost(summary),
      cost_status: costStatus(summary),
      unpriced_calls: summary.unpricedCalls,
    })),
  });
}

function usageJson(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...extraHeaders },
  });
}
