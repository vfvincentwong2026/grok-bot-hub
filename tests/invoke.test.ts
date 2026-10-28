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
      put: vi.fn(async (key: string, value: string) => {
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

function invoke(
  env: ReturnType<typeof createEnv>["env"],
  body: Record<string, unknown>,
  authorized = true,
) {
  return worker.fetch(
    new Request("http://localhost/v1/a2a/invoke", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(authorized ? { Authorization: "Bearer test-secret" } : {}),
      },
      body: JSON.stringify(body),
    }),
    env as any,
  );
}

const validRequest = {
  protocol: "A2A-v1",
  target_bot: "bot:drama-hook-analyzer",
  payload: { script_text: "heir reveal at wedding" },
};

describe("POST /v1/a2a/invoke", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ output_text: '{"hook_score":87}' }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 for bad authorization", async () => {
    const { env } = createEnv();
    const response = await invoke(env, validRequest, false);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "unauthorized" });
  });

  it("returns 404 for an unknown bot", async () => {
    const { env } = createEnv();
    const response = await invoke(env, { ...validRequest, target_bot: "bot:unknown" });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: "bot_not_found" });
  });

  it("returns 403 for a policy violation without calling AI", async () => {
    const { env } = createEnv();
    const response = await invoke(env, {
      ...validRequest,
      payload: { action: "dm", user_initiated: false },
    });

    expect(response.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("routes the bot prompt to the xAI Responses API and returns 200", async () => {
    const { env } = createEnv();
    const response = await invoke(env, validRequest);

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledOnce();
    const [url, options] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe("https://api.x.ai/v1/responses");
    expect(options?.method).toBe("POST");
    expect(options?.headers).toEqual({
      "content-type": "application/json",
      Authorization: "Bearer test-xai-key",
    });
    expect(JSON.parse(String(options?.body))).toEqual({
      model: "grok-test",
      input: [
        { role: "system", content: expect.stringContaining("Drama Hook Analyzer") },
        { role: "user", content: expect.any(String) },
      ],
    });
  });

  it("writes bot metrics to KV after invocation", async () => {
    const { env, store } = createEnv();
    const response = await invoke(env, validRequest);
    const raw = store.get("metrics:bot:drama-hook-analyzer");

    expect(response.status).toBe(200);
    expect(raw).toBeDefined();
    expect(JSON.parse(raw!)).toEqual(
      expect.objectContaining({
        bot: "bot:drama-hook-analyzer",
        calls: 1,
        failures: 0,
        total_tokens: 0,
      }),
    );
  });

  it("records failures when AI throws", async () => {
    const { env, store } = createEnv();
    vi.mocked(fetch).mockRejectedValue(new Error("AI unavailable"));

    const response = await invoke(env, validRequest);
    const raw = store.get("metrics:bot:drama-hook-analyzer");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: "ai_invocation_failed" });
    expect(raw).toBeDefined();
    expect(JSON.parse(raw!).failures).toBe(1);
  });
});
