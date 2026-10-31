# Free MCP access

GrokBotHub exposes a standard MCP Streamable HTTP endpoint for short-drama hook analysis. No email registration or API key is required for the free tier.

## Endpoint and free policy

- Endpoint: `POST /mcp`
- Tool: `analyze_hook`
- Per-IP limit: 3 calls per hour, shared with the browser demo
- Global limit: 20 calls per day across browser demo and MCP
- AI failures and invalid model output release reserved quota on a best-effort basis
- KV throttling is best-effort and is not an atomic distributed rate limiter
- Exceeding the limit returns an MCP tool error with a link to `/pricing`

The free tier is intended for evaluation, not production workload. Do not rotate IP addresses or otherwise circumvent these limits.

## Client configuration

For an MCP client that supports remote Streamable HTTP servers, use the following configuration after replacing the host with the deployment you want to use:

```json
{
  "mcpServers": {
    "grok-bot-hub": {
      "url": "http://localhost:8787/mcp"
    }
  }
}
```

The server supports protocol versions `2025-06-18` and `2025-03-26`, JSON responses, `initialize`, `ping`, `tools/list`, `tools/call`, and MCP notifications. It is stateless and does not issue `Mcp-Session-Id`. Server-initiated SSE streams are not offered; `GET` and `DELETE` return 405.

## Initialize

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": { "name": "example-client", "version": "1.0.0" }
    }
  }'
```

## Discover and call the tool

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "analyze_hook",
      "arguments": {
        "script_text": "Kamu bilang aku hanya seorang pelayan, tetapi aku adalah pewaris yang sebenarnya.",
        "platform": "tiktok",
        "target_audience": "ID_GenZ",
        "output_language": "id"
      }
    }
  }'
```

A successful result includes both `structuredContent` and a serialized text content block. Fields include `hook_score`, four `dimensions`, `strengths`, `suggestions`, exactly three `rewritten_hooks`, `audience_fit`, `receipt_id`, `attribution`, and resolved options. `receipt_id` is currently a response identifier, not a signed receipt.

Tool execution failures use `isError: true`. Unknown methods and unknown tools use JSON-RPC errors. AI output requires human review before publishing.

## Privacy

Submitted script text is sent to xAI for analysis and is not intentionally persisted in the application's KV database. Free MCP uses the same truncated IP-hash counters as the browser demo. First-party events may contain a SHA-256 script hash, never the script text, and expire after 90 days.

This document confirms protocol-level implementation and local tests only. Compatibility with individual MCP client products must be verified separately before it is claimed.
