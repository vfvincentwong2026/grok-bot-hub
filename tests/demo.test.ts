import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../workers/src/index";

function createEnv() {
  const store = new Map<string, string>();
  const env = {
    LEADERBOARD_KV: {
      get: vi.fn(async (key: string, type?: string) => {
        const value = store.get(key) ?? null;
        return type === "json" && value !== null ? JSON.parse(value) : value;
      }),
      put: vi.fn(async (key: string, value: string, _options?: { expirationTtl: number }) => {
        store.set(key, value);
      }),
    },
    XAI_API_KEY: "test-xai-key",
    XAI_BASE_URL: "https://api.x.ai/v1",
    GROK_DEFAULT_MODEL: "grok-test",
    A2A_SHARED_SECRET: "test-secret",
  };

  return { env, store };
}

function invokeDemo(env: ReturnType<typeof createEnv>["env"], scriptText: string) {
  return worker.fetch(
    new Request("http://localhost/v1/demo/invoke", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Origin: "http://localhost",
        "CF-Connecting-IP": "203.0.113.10",
      },
      body: JSON.stringify({ script_text: scriptText }),
    }),
    env as any,
  );
}

const validScript = "The maid reveals she is the true heir at the billionaire's wedding.";

describe("POST /v1/demo/invoke", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () =>
        new Response(
          JSON.stringify({
            output: [
              {
                type: "message",
                content: [
                  {
                    type: "output_text",
                    text: JSON.stringify({
                      hook_score: 88,
                      strengths: ["Immediate identity reversal"],
                      suggestions: ["Reveal the stakes one line earlier"],
                      audience_fit: "Strong fit for viewers who enjoy heir-reveal drama.",
                    }),
                  },
                ],
              },
            ],
            usage: { total_tokens: 123 },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a structured analysis for a valid public request", async () => {
    const { env } = createEnv();
    const response = await invokeDemo(env, validScript);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(
      expect.objectContaining({
        ok: true,
        bot: "bot:drama-hook-analyzer",
        analysis: expect.objectContaining({ hook_score: 88 }),
      }),
    );
    expect(fetch).toHaveBeenCalledOnce();
    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    expect(JSON.parse(String(options?.body))).toEqual(
      expect.objectContaining({ model: "grok-test", max_output_tokens: 500 }),
    );
  });

  it("rejects short input without calling AI", async () => {
    const { env } = createEnv();
    const response = await invokeDemo(env, "too short");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "script_text_must_be_10_to_1200_characters",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rate limits the fourth request from the same IP", async () => {
    const { env } = createEnv();

    for (let call = 0; call < 3; call += 1) {
      const response = await invokeDemo(env, validScript);
      expect(response.status).toBe(200);
    }
    const limited = await invokeDemo(env, validScript);

    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ ok: false, error: "demo_rate_limited" });
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
