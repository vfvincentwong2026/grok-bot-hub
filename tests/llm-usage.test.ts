import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../workers/src/index";
import {
  buildLlmUsageRecord,
  estimateCost,
  extractUsage,
  type LlmUsageRecord,
} from "../workers/src/llm-usage";

afterEach(() => {
  vi.restoreAllMocks();
});

function createEnv() {
  const values = new Map<string, string>();
  const metadata = new Map<string, Omit<LlmUsageRecord, "version">>();
  const env = {
    USAGE_READ_TOKEN: "usage-read-secret",
    LEADERBOARD_KV: {
      put: vi.fn(async (key: string, value: string) => { values.set(key, value); }),
      list: vi.fn(async ({ prefix, cursor: _cursor }: { prefix: string; cursor?: string }) => ({
        keys: [...metadata.entries()]
          .filter(([key]) => key.startsWith(prefix))
          .map(([name, data]) => ({ name, metadata: data })),
        list_complete: true,
        cursor: "",
      })),
    },
  };
  return { env, values, metadata };
}

function record(overrides: Partial<LlmUsageRecord> = {}): LlmUsageRecord {
  return {
    version: 1,
    tool: "analyze_hook",
    source: "mcp",
    status: "ok",
    model: "grok-test",
    input_tokens: 200,
    cached_input_tokens: 0,
    output_tokens: 100,
    reasoning_tokens: null,
    total_tokens: 300,
    estimated_cost_micro_usd: 1000,
    pricing_version: "test-v1",
    pricing_missing: false,
    latency_ms: 20,
    is_example: false,
    receipt_id: crypto.randomUUID(),
    occurred_at: "2026-10-31T11:30:00.000Z",
    ...overrides,
  };
}

function seed(_env: ReturnType<typeof createEnv>["env"], value: LlmUsageRecord) {
  const metadata = Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== "version"),
  ) as Omit<LlmUsageRecord, "version">;
  return { key: `usage:llm:${value.occurred_at.slice(0, 10)}:${value.receipt_id}`, metadata };
}

function usageRequest(env: ReturnType<typeof createEnv>["env"], query: string, method = "GET", token = "usage-read-secret") {
  return worker.fetch(new Request(`http://localhost/v1/admin/usage/summary${query}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  }), env as any);
}

describe("LLM usage extraction and pricing", () => {
  it("extracts Responses API and compatibility token fields without inventing zeros", () => {
    expect(extractUsage({ usage: {
      input_tokens: 1000,
      input_tokens_details: { cached_tokens: 100 },
      output_tokens: 500,
      output_tokens_details: { reasoning_tokens: 50 },
      total_tokens: 1500,
    } })).toEqual({
      input_tokens: 1000,
      cached_input_tokens: 100,
      output_tokens: 500,
      reasoning_tokens: 50,
      total_tokens: 1500,
    });
    expect(extractUsage({ usage: { prompt_tokens: 20, completion_tokens: 10 } })).toEqual({
      input_tokens: 20,
      cached_input_tokens: null,
      output_tokens: 10,
      reasoning_tokens: null,
      total_tokens: null,
    });
  });

  it("calculates micro-USD with cached tokens and marks missing pricing honestly", () => {
    const usage = extractUsage({ usage: {
      input_tokens: 1000,
      input_tokens_details: { cached_tokens: 100 },
      output_tokens: 500,
    } });
    const pricing = {
      "grok-test": {
        input_usd_per_mtok: 2,
        cached_input_usd_per_mtok: 1,
        output_usd_per_mtok: 10,
      },
    };
    expect(estimateCost(usage, "grok-test", pricing)).toEqual({ estimatedCostMicroUsd: 6900, pricingMissing: false });
    expect(estimateCost(usage, "unknown", pricing)).toEqual({ estimatedCostMicroUsd: null, pricingMissing: true });
    expect(estimateCost(usage, "grok-test", null)).toEqual({ estimatedCostMicroUsd: null, pricingMissing: true });
  });

  it("does not throw or invent costs when LLM_PRICING_JSON is invalid", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = buildLlmUsageRecord({
      LEADERBOARD_KV: {} as any,
      LLM_PRICING_JSON: "{invalid",
      LLM_PRICING_VERSION: "invalid-test",
    }, { model: "grok-test", usage: { input_tokens: 10, output_tokens: 5 } }, {
      source: "mcp",
      status: "ok",
      latencyMs: 10,
      isExample: false,
      receiptId: "receipt-test",
      defaultModel: "grok-test",
    });
    expect(result.estimated_cost_micro_usd).toBeNull();
    expect(result.pricing_missing).toBe(true);

    const malformed = buildLlmUsageRecord({
      LEADERBOARD_KV: {} as any,
      LLM_PRICING_JSON: '{"grok-test":{"input_usd_per_mtok":"2","cached_input_usd_per_mtok":null,"output_usd_per_mtok":10}}',
    }, { model: "grok-test", usage: { input_tokens: 10, output_tokens: 5 } }, {
      source: "mcp",
      status: "ok",
      latencyMs: 10,
      isExample: false,
      receiptId: "receipt-test",
      defaultModel: "grok-test",
    });
    expect(malformed.estimated_cost_micro_usd).toBeNull();
    expect(malformed.pricing_missing).toBe(true);
  });
});

describe("GET /v1/admin/usage/summary", () => {
  it("requires configuration, a valid token, GET, and a valid date range", async () => {
    const { env } = createEnv();
    const unconfigured = { ...env, USAGE_READ_TOKEN: undefined };
    expect((await usageRequest(unconfigured, "")).status).toBe(503);
    expect((await usageRequest(env, "", "GET", "wrong")).status).toBe(401);
    expect((await usageRequest(env, "", "POST")).status).toBe(405);
    expect((await usageRequest(env, "?from=2026-10-01&to=2026-11-01")).status).toBe(400);
    expect((await usageRequest(env, "?from=not-a-date")).status).toBe(400);
    expect((await usageRequest(env, "?from=2026-10-01&to=2026-10-31&since=2026-10-01T00:00:00Z&until=2026-10-02T00:00:00Z")).status).toBe(400);
    expect(env.LEADERBOARD_KV.put).not.toHaveBeenCalled();
  });

  it("aggregates records, costs, sources, and example calls from metadata", async () => {
    const { env, metadata } = createEnv();
    const first = seed(env, record());
    const second = seed(env, record({
      source: "web_demo",
      is_example: true,
      estimated_cost_micro_usd: null,
      pricing_missing: true,
      pricing_version: "unconfigured",
      occurred_at: "2026-10-31T11:45:00.000Z",
    }));
    metadata.set(first.key, first.metadata);
    metadata.set(second.key, second.metadata);

    const response = await usageRequest(env, "?from=2026-10-31&to=2026-10-31");
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(data.totals).toEqual({
      calls: 2,
      ok: 2,
      parse_failed: 0,
      real_calls: 1,
      example_calls: 1,
      input_tokens: 400,
      output_tokens: 200,
      estimated_cost_usd: "0.001000",
      calls_without_pricing: 1,
    });
    expect(data.pricing_version).toEqual(["test-v1", "unconfigured"]);
    expect(data.by_day).toHaveLength(1);
    expect(data.by_model).toHaveLength(1);
    expect(env.LEADERBOARD_KV.put).not.toHaveBeenCalled();

    const mcpOnly = await (await usageRequest(env, "?from=2026-10-31&to=2026-10-31&source=mcp")).json();
    expect(mcpOnly.totals.calls).toBe(1);
    expect(mcpOnly.totals.real_calls).toBe(1);
    expect(mcpOnly.totals.example_calls).toBe(0);
  });

  it("filters exact UTC+8 time windows and exports privacy-safe CSV", async () => {
    const { env, metadata } = createEnv();
    const included = seed(env, record({ occurred_at: "2026-10-31T11:30:00.000Z" }));
    const excluded = seed(env, record({ occurred_at: "2026-10-31T10:00:00.000Z" }));
    const boundary = seed(env, record({ occurred_at: "2026-10-31T12:00:00.000Z" }));
    metadata.set(included.key, included.metadata);
    metadata.set(excluded.key, excluded.metadata);
    metadata.set(boundary.key, boundary.metadata);
    const query = "?since=2026-10-31T19%3A00%3A00%2B08%3A00&until=2026-10-31T20%3A00%3A00%2B08%3A00";

    const response = await usageRequest(env, query);
    const data = await response.json();
    expect(data.totals.calls).toBe(1);
    expect(data.since).toBe("2026-10-31T19:00:00+08:00");

    const csv = await usageRequest(env, `${query}&format=csv`);
    const text = await csv.text();
    expect(csv.headers.get("content-type")).toContain("text/csv");
    expect(text).toContain("occurred_at,receipt_id,source,status,model,input_tokens,output_tokens,estimated_cost_usd,pricing_version");
    expect(text).toContain("0.001000");
    expect(text).not.toContain("script_text");
    expect(env.LEADERBOARD_KV.put).not.toHaveBeenCalled();
  });
});
