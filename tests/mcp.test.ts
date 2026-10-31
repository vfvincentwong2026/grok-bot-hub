import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INDONESIAN_EXAMPLE } from "../workers/src/analysis-options";
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
    INTERNAL_PATROL_TOKEN: undefined as string | undefined,
  };
  return { env, store };
}

function mcp(
  env: ReturnType<typeof createEnv>["env"],
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
  return worker.fetch(new Request("http://localhost/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Accept: "application/json, text/event-stream",
      "CF-Connecting-IP": "203.0.113.10",
      ...headers,
    },
    body: JSON.stringify(body),
  }), env as any);
}

function callAnalyzeHook(
  env: ReturnType<typeof createEnv>["env"],
  scriptText = validScript,
  headers: Record<string, string> = {},
) {
  return mcp(env, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "analyze_hook", arguments: { script_text: scriptText, platform: "tiktok" } },
  }, { "MCP-Protocol-Version": "2025-06-18", ...headers });
}

const validScript = "The maid reveals she is the true heir at the billionaire's wedding.";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify({
    output_text: JSON.stringify({
      hook_score: 88,
      dimensions: { conflict: 90, identity_reveal: 95, curiosity_gap: 84, emotion: 86 },
      strengths: ["Immediate identity reversal"],
      suggestions: ["Reveal the stakes one line earlier"],
      rewritten_hooks: ["Hook satu", "Hook dua", "Hook tiga"],
      audience_fit: "Strong fit",
    }),
    usage: { input_tokens: 100, output_tokens: 23, total_tokens: 123 },
  }), { status: 200, headers: { "content-type": "application/json" } })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MCP Streamable HTTP", () => {
  it("initializes and advertises only the implemented tool capability", async () => {
    const { env } = createEnv();
    const response = await mcp(env, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } },
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      jsonrpc: "2.0",
      id: 1,
      result: expect.objectContaining({
        protocolVersion: "2025-06-18",
        capabilities: { tools: { listChanged: false } },
        serverInfo: expect.objectContaining({ name: "grok-bot-hub" }),
      }),
    });
  });

  it("lists analyze_hook with a constrained input schema", async () => {
    const { env } = createEnv();
    const response = await mcp(env, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result.tools).toHaveLength(1);
    expect(data.result.tools[0]).toEqual(expect.objectContaining({
      name: "analyze_hook",
      inputSchema: expect.objectContaining({
        required: ["script_text"],
        additionalProperties: false,
      }),
    }));
  });

  it("accepts initialized notifications and declines unsupported streams", async () => {
    const { env } = createEnv();
    const notification = await mcp(env, { jsonrpc: "2.0", method: "notifications/initialized" });
    const stream = await worker.fetch(new Request("http://localhost/mcp"), env as any);

    expect(notification.status).toBe(202);
    expect(await notification.text()).toBe("");
    expect(stream.status).toBe(405);
    expect(stream.headers.get("Allow")).toBe("POST");
  });

  it("returns structured analysis and text content for analyze_hook", async () => {
    const { env } = createEnv();
    const response = await callAnalyzeHook(env);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result.isError).toBe(false);
    expect(data.result.structuredContent).toEqual(expect.objectContaining({
      hook_score: 88,
      dimensions: { conflict: 90, identity_reveal: 95, curiosity_gap: 84, emotion: 86 },
      rewritten_hooks: ["Hook satu", "Hook dua", "Hook tiga"],
      receipt_id: expect.any(String),
      attribution: "AI-generated with Grok. Review before publishing.",
    }));
    expect(JSON.parse(data.result.content[0].text)).toEqual(data.result.structuredContent);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("records one MCP usage entry without sensitive text", async () => {
    const { env, store } = createEnv();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const response = await callAnalyzeHook(env);
    const data = await response.json();
    const usageEntries = [...store.entries()].filter(([key]) => key.startsWith("usage:llm:"));

    expect(response.status).toBe(200);
    expect(usageEntries).toHaveLength(1);
    const record = JSON.parse(usageEntries[0]![1]);
    expect(record).toEqual(expect.objectContaining({
      source: "mcp",
      tool: "analyze_hook",
      status: "ok",
      receipt_id: data.result.structuredContent.receipt_id,
      input_tokens: 100,
      output_tokens: 23,
      total_tokens: 123,
      is_example: false,
    }));
    const observableOutput = JSON.stringify([record, logSpy.mock.calls]);
    expect(observableOutput).not.toContain(validScript);
    expect(observableOutput).not.toContain("test-xai-key");
    logSpy.mockRestore();
  });

  it("marks only authenticated internal patrols without logging the token", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const correct = createEnv();
    correct.env.INTERNAL_PATROL_TOKEN = "test-patrol-token";
    const response = await callAnalyzeHook(correct.env, validScript, { "X-GBH-Internal-Patrol": "test-patrol-token" });
    const responseData = await response.json();

    const wrong = createEnv();
    wrong.env.INTERNAL_PATROL_TOKEN = "test-patrol-token";
    await callAnalyzeHook(wrong.env, validScript, { "X-GBH-Internal-Patrol": "wrong-patrol-token" });
    const unconfigured = createEnv();
    await callAnalyzeHook(unconfigured.env, validScript, { "X-GBH-Internal-Patrol": "test-patrol-token" });

    const source = (store: Map<string, string>) => {
      const entry = [...store.entries()].find(([key]) => key.startsWith("usage:llm:"));
      return JSON.parse(entry![1]).source;
    };
    expect(source(correct.store)).toBe("internal_patrol");
    expect(source(wrong.store)).toBe("mcp");
    expect(source(unconfigured.store)).toBe("mcp");
    const observable = JSON.stringify([
      ...correct.store.values(),
      ...wrong.store.values(),
      ...unconfigured.store.values(),
      logSpy.mock.calls,
      responseData,
    ]);
    expect(observable).not.toContain("test-patrol-token");
    logSpy.mockRestore();
  });

  it("records parse failures while preserving the existing MCP error", async () => {
    const { env, store } = createEnv();
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      output_text: "not valid analysis JSON",
      usage: { input_tokens: 100, output_tokens: 23, total_tokens: 123 },
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const response = await callAnalyzeHook(env);
    const data = await response.json();
    const records = [...store.entries()]
      .filter(([key]) => key.startsWith("usage:llm:"))
      .map(([, value]) => JSON.parse(value));

    expect(data.result.isError).toBe(true);
    expect(data.result.structuredContent.error).toBe("demo_ai_unavailable");
    expect(records).toHaveLength(1);
    expect(records[0].status).toBe("parse_failed");
    expect([...store.entries()].filter(([key]) => key.startsWith("demo:")).map(([, value]) => value)).toEqual(["0", "0"]);
  });

  it("returns analysis when only the usage ledger write fails", async () => {
    const { env, store } = createEnv();
    env.LEADERBOARD_KV.put.mockImplementation(async (key: string, value: string) => {
      if (key.startsWith("usage:llm:")) throw new Error("usage KV unavailable");
      store.set(key, value);
    });

    const response = await callAnalyzeHook(env);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result.isError).toBe(false);
    expect(data.result.structuredContent.hook_score).toBe(88);
  });

  it("records first MCP activation once per IP without storing script text", async () => {
    const { env, store } = createEnv();
    await callAnalyzeHook(env);
    await callAnalyzeHook(env);
    const events = [...store.values()]
      .filter((value) => value.includes('"event"'))
      .map((value) => JSON.parse(value));
    const activations = events.filter((event) => event.event === "first_real_call");

    expect(activations).toHaveLength(1);
    expect(activations[0].script_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(events)).not.toContain(validScript);
  });

  it("does not count the built-in example as MCP activation", async () => {
    const { env, store } = createEnv();
    const response = await callAnalyzeHook(env, INDONESIAN_EXAMPLE);
    const events = [...store.values()].filter((value) => value.includes('"event"')).map((value) => JSON.parse(value));
    const usageRecords = [...store.entries()]
      .filter(([key]) => key.startsWith("usage:llm:"))
      .map(([, value]) => JSON.parse(value));

    expect(response.status).toBe(200);
    expect(events.some((event) => event.event === "first_real_call")).toBe(false);
    expect(usageRecords).toHaveLength(1);
    expect(usageRecords[0].is_example).toBe(true);
  });

  it("shares the three-per-hour demo quota and returns an upgrade path", async () => {
    const { env } = createEnv();
    for (let call = 0; call < 3; call += 1) {
      expect((await callAnalyzeHook(env)).status).toBe(200);
    }
    const response = await callAnalyzeHook(env);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result.isError).toBe(true);
    expect(data.result.structuredContent).toEqual(expect.objectContaining({
      error: "demo_rate_limited",
      upgrade: expect.objectContaining({ plans_url: "http://localhost/pricing" }),
    }));
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("releases shared quota when AI fails", async () => {
    const { env, store } = createEnv();
    vi.mocked(fetch).mockRejectedValueOnce(new Error("AI unavailable"));
    const response = await callAnalyzeHook(env);
    const data = await response.json();
    const counters = [...store.entries()].filter(([key]) => key.startsWith("demo:"));

    expect(data.result.isError).toBe(true);
    expect(data.result.structuredContent.error).toBe("demo_ai_unavailable");
    expect(counters.map(([, value]) => value)).toEqual(["0", "0"]);
  });

  it("reports unknown tools as JSON-RPC errors without calling AI", async () => {
    const { env } = createEnv();
    const response = await mcp(env, {
      jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "unknown", arguments: {} },
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe(-32602);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns invalid tool input as an execution error without calling AI", async () => {
    const { env } = createEnv();
    const response = await callAnalyzeHook(env, "short");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result.isError).toBe(true);
    expect(data.result.structuredContent.error).toBe("script_text_must_be_10_to_1200_characters");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects unsupported protocol headers and cross-origin browser calls", async () => {
    const { env } = createEnv();
    const unsupported = await mcp(env, { jsonrpc: "2.0", id: 1, method: "ping" }, {
      "MCP-Protocol-Version": "1900-01-01",
    });
    const crossOrigin = await mcp(env, { jsonrpc: "2.0", id: 1, method: "ping" }, {
      Origin: "https://attacker.example",
    });

    expect(unsupported.status).toBe(400);
    expect(crossOrigin.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });
});
