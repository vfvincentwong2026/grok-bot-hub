import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hashApiKey } from "../workers/src/api-keys";
import worker from "../workers/src/index";

async function createEnv() {
  const store = new Map<string, string>();
  const counters = new Map<string, number>();
  const apiKey = "gbh_test_customer_key";
  const keyHash = await hashApiKey(apiKey);
  store.set(`apikey:${keyHash}`, JSON.stringify({ plan: "creator", status: "active" }));

  const env = {
    LEADERBOARD_KV: {
      get: vi.fn(async (key: string, type?: string) => {
        const value = store.get(key) ?? null;
        return type === "json" && value !== null ? JSON.parse(value) : value;
      }),
      put: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
    },
    USAGE_COUNTER: {
      idFromName: (name: string) => name,
      get: (name: string) => ({
        fetch: async (_url: string, init: RequestInit) => {
          const { operation, limit } = JSON.parse(String(init.body));
          const current = counters.get(name) ?? 0;
          if (operation === "consume" && current >= limit) {
            return Response.json({ allowed: false, used: current, remaining: 0 });
          }
          const used = operation === "consume" ? current + 1 : Math.max(0, current - 1);
          counters.set(name, used);
          return Response.json({ allowed: true, used, remaining: Math.max(0, limit - used) });
        },
      }),
    },
    XAI_API_KEY: "test-xai-key",
    XAI_BASE_URL: "https://api.x.ai/v1",
    GROK_DEFAULT_MODEL: "grok-test",
  };

  return { env, store, counters, apiKey, keyHash };
}

function invoke(env: any, apiKey: string) {
  return worker.fetch(
    new Request("http://localhost/v1/app/invoke", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ script_text: "The maid reveals she is the true heir at the wedding." }),
    }),
    env,
  );
}

describe("POST /v1/app/invoke", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ output_text: '{"hook_score":85}', usage: { total_tokens: 100 } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("authenticates the key, calls AI, and returns atomic quota usage", async () => {
    const { env, apiKey } = await createEnv();
    const response = await invoke(env, apiKey);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analysis).toEqual({ hook_score: 85 });
    expect(data.usage).toEqual(expect.objectContaining({ used: 1, remaining: 999, limit: 1000 }));
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("rejects an unknown API key without calling AI", async () => {
    const { env } = await createEnv();
    const response = await invoke(env, "gbh_unknown");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "invalid_api_key" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 429 at the monthly limit without calling AI", async () => {
    const { env, apiKey, keyHash, counters } = await createEnv();
    const period = new Date().toISOString().slice(0, 7);
    counters.set(`${keyHash}:${period}`, 1000);
    const response = await invoke(env, apiKey);

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "monthly_quota_exceeded" }),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refunds reserved quota when the AI call fails", async () => {
    const { env, apiKey, keyHash, counters } = await createEnv();
    vi.mocked(fetch).mockRejectedValue(new Error("AI unavailable"));
    const response = await invoke(env, apiKey);
    const period = new Date().toISOString().slice(0, 7);

    expect(response.status).toBe(502);
    expect(counters.get(`${keyHash}:${period}`)).toBe(0);
  });
});
