import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hashApiKey } from "../workers/src/api-keys";
import worker from "../workers/src/index";

async function createEnv(expiresAt = new Date(Date.now() + 30 * 86400000).toISOString()) {
  const store = new Map<string, string>();
  const counters = new Map<string, number>();
  const apiKey = "gbh_test_customer_key";
  const keyHash = await hashApiKey(apiKey);
  store.set(`apikey:${keyHash}`, JSON.stringify({ plan: "creator", status: "active", expires_at: expiresAt }));

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

  return { env, store, counters, apiKey, keyHash, expiresAt };
}

function invoke(env: any, apiKey: string, payload: Record<string, unknown> = {}) {
  return worker.fetch(
    new Request("http://localhost/v1/app/invoke", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        script_text: "The maid reveals she is the true heir at the wedding.",
        ...payload,
      }),
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

  it("authenticates the key, calls AI, and returns pass quota usage", async () => {
    const { env, apiKey, expiresAt } = await createEnv();
    const response = await invoke(env, apiKey);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analysis).toEqual({ hook_score: 85 });
    expect(data.attribution).toBe("AI-generated with Grok. Review before publishing.");
    expect(data.usage).toEqual(
      expect.objectContaining({ used: 1, remaining: 999, limit: 1000, expires_at: expiresAt }),
    );
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("passes explicit localization options to the model", async () => {
    const { env, apiKey } = await createEnv();
    const response = await invoke(env, apiKey, {
      input_language: "en",
      target_audience: "ID_Millennial",
      output_language: "id",
      platform: "youtube_shorts",
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.options).toEqual({
      input_language: "en",
      target_audience: "ID_Millennial",
      output_language: "id",
      platform: "youtube_shorts",
    });
    const [, request] = vi.mocked(fetch).mock.calls[0]!;
    const aiBody = JSON.parse(String(request?.body));
    expect(JSON.parse(aiBody.input[1].content)).toEqual(expect.objectContaining(data.options));
  });

  it("rejects an unknown API key without calling AI", async () => {
    const { env } = await createEnv();
    const response = await invoke(env, "gbh_unknown");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "invalid_api_key" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects an expired 30-day key without calling AI", async () => {
    const { env, apiKey } = await createEnv(new Date(Date.now() - 1000).toISOString());
    const response = await invoke(env, apiKey);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "api_key_expired" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 429 at the pass limit without calling AI", async () => {
    const { env, apiKey, keyHash, counters } = await createEnv();
    counters.set(keyHash, 1000);
    const response = await invoke(env, apiKey);

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "pass_quota_exceeded" }),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refunds reserved quota when the AI call fails", async () => {
    const { env, apiKey, keyHash, counters } = await createEnv();
    vi.mocked(fetch).mockRejectedValue(new Error("AI unavailable"));
    const response = await invoke(env, apiKey);

    expect(response.status).toBe(502);
    expect(counters.get(keyHash)).toBe(0);
  });
});
