# Architecture

## Current components

1. **Cloudflare Worker (`workers/src`)**: HTTP routes, authentication, input validation, xAI Responses API calls, demo throttling, paid quota handling, billing, and HTML pages.
2. **Bot blueprints (`bots/`)**: localized discovery metadata and prompt builders. Only Drama Hook and sample-only Viral Radar are publicly registered.
3. **Cloudflare KV**: API-key hashes and records, metrics, shared demo/MCP counters, first-party analytics events, and optional leaderboard snapshots.
4. **UsageCounter Durable Object**: atomic paid-quota consumption and refunds.
5. **Stripe Checkout (optional)**: one-time IDR 30-day passes when explicitly configured.

## Public demo flow

`POST /v1/demo/invoke` → same-origin check → script/options validation → best-effort KV reservation → localized `buildPrompt()` → xAI Responses API → result schema validation → metrics + `demo_done` event + attribution + result ID.

The result contains four dimension scores and exactly three rewritten hooks. AI failures or invalid model output release the reserved demo counters. KV throttling is best-effort, not an atomic distributed rate limiter.

## Free MCP flow

`POST /mcp` → Origin and protocol validation → JSON-RPC method routing → `tools/call` with `analyze_hook` → the same public demo handler and KV quota → MCP `structuredContent` plus text content. Supported methods are `initialize`, `ping`, `tools/list`, `tools/call`, and notifications. The server is stateless, returns JSON responses, and does not offer server-initiated SSE streams.

Free MCP calls require no API key and share the browser limits: 3 calls per IP each hour and 20 global calls per day. Non-example calls record first activation once per hashed IP. Quota exhaustion returns `isError: true` with a pricing link. See [the MCP guide](./mcp.md).

## Model usage ledger

After xAI returns a JSON response for a browser demo or MCP `analyze_hook` call, the Worker writes one privacy-safe usage record to `LEADERBOARD_KV` under `usage:llm:<UTC-date>:<receipt-id>`. Records include the source, model, token breakdown, status, latency, receipt ID, timestamp, `is_example`, pricing version, and estimated cost in integer micro-USD. Invalid model output is recorded as `parse_failed`; a ledger write failure does not change the user response. Records and KV metadata expire after 400 days. Internal patrols are identified only by a valid `X-GBH-Internal-Patrol` header matched against the separate `INTERNAL_PATROL_TOKEN` secret; the header value is never recorded.

`GET /v1/admin/usage/summary` provides read-only JSON or CSV aggregation by UTC date range or an exact ISO 8601 `since`/`until` window, optionally filtered by source. It requires the separate `USAGE_READ_TOKEN` secret, returns `503` until that secret is configured, and never returns scripts, model output, IP addresses, or API keys. JSON totals exclude example and internal-patrol calls by default and report them under `excluded`. Model prices come from `LLM_PRICING_JSON`; missing or invalid prices produce a null cost with `pricing_missing=true`, never an invented estimate. When any included call is unpriced, `cost_status` is `partial` or `no_data` and `estimated_cost_usd` is null rather than a misleading zero. Empty windows return `no_data`; paid API queries return `paid_api_not_instrumented` because that flow is not yet included in this ledger.

## Paid flow

`POST /v1/app/invoke` → hash API key → active plan + expiry check → script/options validation → atomic quota reservation → localized `buildPrompt()` → xAI Responses API → result schema validation → metrics + first real-call event + attribution + result ID.

AI failures or invalid model output refund the reserved paid quota through the Durable Object. Result IDs are response identifiers, not signed receipts.

## First-party analytics

Browser events are limited to `landing_view`, `demo_start`, `rewrite_copy`, `install_click`, and `upgrade_view`. The server records `demo_done`, `first_real_call`, `checkout_start`, and `paid`; clients cannot submit those server-authoritative events. `first_real_call` is recorded once per paid key or free MCP IP hash and excludes the built-in Indonesian example. Records expire after 90 days and may contain duration, plan, install method, or a full SHA-256 script hash, never the script text. There are no third-party trackers.

## Legacy compatibility flow

`POST /v1/a2a/invoke` → shared-secret authentication → custom `A2A-v1` validation → policy guard → registry → xAI Responses API → metrics + attribution + `Deprecation: true`.

This custom route is not the official A2A protocol. Cloudflare AI Gateway is not currently used. The scheduled handler is a safe heartbeat only; it does not fabricate or publish leaderboard snapshots.
