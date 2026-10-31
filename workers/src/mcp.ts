import { INDONESIAN_EXAMPLE, INPUT_LANGUAGES, OUTPUT_LANGUAGES, PLATFORMS, TARGET_AUDIENCES } from "./analysis-options";
import { handleDemoInvoke } from "./demo";
import { hashScriptText, recordFirstRealCall } from "./events";
import type { LlmUsageEnv } from "./llm-usage";

interface McpEnv extends LlmUsageEnv {
  XAI_API_KEY: string;
  XAI_BASE_URL: string;
  GROK_DEFAULT_MODEL: string;
}

type JsonRpcId = string | number;

const LATEST_PROTOCOL_VERSION = "2025-06-18";
const SUPPORTED_PROTOCOL_VERSIONS = new Set([LATEST_PROTOCOL_VERSION, "2025-03-26"]);

const ANALYZE_HOOK_TOOL = {
  name: "analyze_hook",
  title: "Analyze a short-drama opening hook",
  description: "Score a user-supplied short-drama opening and return four dimensions, suggestions, and three rewritten hooks. Free MCP calls share the public demo quota: 3 calls per IP each hour and 20 calls globally per day. Review AI output before publishing.",
  inputSchema: {
    type: "object",
    properties: {
      script_text: {
        type: "string",
        minLength: 10,
        maxLength: 1200,
        description: "The opening script to analyze. Do not submit confidential or sensitive personal information.",
      },
      input_language: { type: "string", enum: INPUT_LANGUAGES, default: "auto" },
      target_audience: { type: "string", enum: TARGET_AUDIENCES },
      output_language: { type: "string", enum: OUTPUT_LANGUAGES },
      platform: { type: "string", enum: PLATFORMS },
    },
    required: ["script_text"],
    additionalProperties: false,
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
} as const;

export async function handleMcp(request: Request, env: McpEnv): Promise<Response> {
  const origin = request.headers.get("Origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) return transportError("cross_origin_mcp_forbidden", 403);
    } catch {
      return transportError("invalid_origin", 403);
    }
  }

  if (request.method === "GET" || request.method === "DELETE") {
    return transportError("server_to_client_stream_not_supported", 405, { Allow: "POST" });
  }
  if (request.method !== "POST") return transportError("method_not_allowed", 405, { Allow: "POST" });

  const headerVersion = request.headers.get("MCP-Protocol-Version");
  if (headerVersion && !SUPPORTED_PROTOCOL_VERSIONS.has(headerVersion)) {
    return rpcError(null, -32600, "Unsupported MCP protocol version", 400, {
      supported: [...SUPPORTED_PROTOCOL_VERSIONS],
      requested: headerVersion,
    });
  }

  let message: any;
  try {
    message = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error", 400);
  }

  if (!message || Array.isArray(message) || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return rpcError(message?.id ?? null, -32600, "Invalid JSON-RPC request", 400);
  }

  if (!("id" in message)) {
    if (message.method.startsWith("notifications/")) {
      return new Response(null, { status: 202, headers: { "cache-control": "no-store" } });
    }
    return rpcError(null, -32600, "Invalid JSON-RPC notification", 400);
  }

  const id = message.id;
  if ((typeof id !== "string" && typeof id !== "number") || typeof message.params !== "object" && message.params !== undefined) {
    return rpcError(null, -32600, "Invalid JSON-RPC request", 400);
  }

  switch (message.method) {
    case "initialize": {
      const requested = message.params?.protocolVersion;
      const protocolVersion = typeof requested === "string" && SUPPORTED_PROTOCOL_VERSIONS.has(requested)
        ? requested
        : LATEST_PROTOCOL_VERSION;
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "grok-bot-hub", title: "GrokBotHub Hook Analysis", version: "0.1.0" },
        instructions: "Use analyze_hook only with user-supplied script text. Free calls share the public demo quota: 3 calls per IP each hour and 20 calls globally per day. AI output requires human review; receipt_id is a response identifier, not a signed receipt.",
      });
    }
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: [ANALYZE_HOOK_TOOL] });
    case "tools/call":
      return callTool(request, env, id, message.params);
    default:
      return rpcError(id, -32601, `Method not found: ${message.method}`, 404);
  }
}

async function callTool(request: Request, env: McpEnv, id: JsonRpcId, params: any): Promise<Response> {
  if (params?.name !== "analyze_hook") {
    return rpcError(id, -32602, `Unknown tool: ${String(params?.name ?? "")}`, 400);
  }
  if (!params.arguments || typeof params.arguments !== "object" || Array.isArray(params.arguments)) {
    return rpcError(id, -32602, "analyze_hook requires an arguments object", 400);
  }

  const headers = new Headers({ "content-type": "application/json" });
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) headers.set("CF-Connecting-IP", ip);
  const patrol = request.headers.get("X-GBH-Internal-Patrol");
  if (patrol) headers.set("X-GBH-Internal-Patrol", patrol);

  const analysisResponse = await handleDemoInvoke(new Request(new URL("/v1/demo/invoke", request.url), {
    method: "POST",
    headers,
    body: JSON.stringify(params.arguments),
  }), env, "mcp");
  const data = await analysisResponse.json() as any;

  if (!analysisResponse.ok || !data?.ok) {
    const error = {
      ok: false,
      error: data?.error ?? "mcp_tool_failed",
      ...(data?.field ? { field: data.field } : {}),
      upgrade: {
        message: "Free quota exhausted or analysis unavailable. Review the paid 30-day passes or retry later.",
        plans_url: new URL("/pricing", request.url).toString(),
      },
    };
    return rpcResult(id, toolResult(error, true));
  }

  const scriptText = typeof params.arguments.script_text === "string" ? params.arguments.script_text.trim() : "";
  if (scriptText && scriptText !== INDONESIAN_EXAMPLE) {
    const identityHash = `mcp:${await hashScriptText(ip ?? "unknown")}`;
    await Promise.allSettled([recordFirstRealCall(env, identityHash, await hashScriptText(scriptText))]);
  }

  const result = {
    ...data.analysis,
    attribution: data.attribution,
    options: data.options,
    usage: data.usage,
  };
  return rpcResult(id, toolResult(result, false));
}

function toolResult(value: Record<string, unknown>, isError: boolean) {
  return {
    content: [{ type: "text", text: JSON.stringify(value) }],
    structuredContent: value,
    isError,
  };
}

function rpcResult(id: JsonRpcId, result: unknown): Response {
  return json({ jsonrpc: "2.0", id, result });
}

function rpcError(id: JsonRpcId | null, code: number, message: string, status: number, data?: unknown): Response {
  return json({ jsonrpc: "2.0", id, error: { code, message, ...(data ? { data } : {}) } }, status);
}

function transportError(error: string, status: number, headers: Record<string, string> = {}): Response {
  return json({ ok: false, error }, status, headers);
}

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...extraHeaders },
  });
}
