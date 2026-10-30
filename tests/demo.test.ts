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

function invokeDemo(
  env: ReturnType<typeof createEnv>["env"],
  scriptText: string,
  payload: Record<string, unknown> = {},
) {
  return worker.fetch(
    new Request("http://localhost/v1/demo/invoke", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Origin: "http://localhost",
        "CF-Connecting-IP": "203.0.113.10",
      },
      body: JSON.stringify({ script_text: scriptText, ...payload }),
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
        attribution: "AI-generated with Grok. Review before publishing.",
      }),
    );
    expect(fetch).toHaveBeenCalledOnce();
    const [, options] = vi.mocked(fetch).mock.calls[0]!;
    expect(JSON.parse(String(options?.body))).toEqual(
      expect.objectContaining({ model: "grok-test", max_output_tokens: 500 }),
    );
  });

  it("auto-detects Indonesian and sends ID defaults to the model", async () => {
    const { env } = createEnv();
    const script = "Kamu bilang aku hanya seorang pelayan, tetapi aku adalah pewaris yang sebenarnya.";
    const response = await invokeDemo(env, script, { platform: "tiktok" });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.options).toEqual({
      input_language: "id",
      target_audience: "ID_GenZ",
      output_language: "id",
      platform: "tiktok",
    });
    const [, request] = vi.mocked(fetch).mock.calls[0]!;
    const aiBody = JSON.parse(String(request?.body));
    expect(JSON.parse(aiBody.input[1].content)).toEqual(expect.objectContaining(data.options));
  });

  it("rejects invalid option enums without calling AI", async () => {
    const { env } = createEnv();
    const response = await invokeDemo(env, validScript, { output_language: "EN" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "invalid_analysis_options",
      field: "output_language",
    });
    expect(fetch).not.toHaveBeenCalled();
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

  it("releases reserved demo capacity when AI fails", async () => {
    const { env, store } = createEnv();
    vi.mocked(fetch).mockRejectedValueOnce(new Error("AI unavailable"));
    const response = await invokeDemo(env, validScript);

    expect(response.status).toBe(502);
    const demoCounters = [...store.entries()].filter(([key]) => key.startsWith("demo:"));
    expect(demoCounters).toHaveLength(2);
    expect(demoCounters.map(([, value]) => value)).toEqual(["0", "0"]);
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
