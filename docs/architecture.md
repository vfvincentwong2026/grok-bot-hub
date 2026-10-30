# Architecture

## Current components

1. **Cloudflare Worker (`workers/src`)**: HTTP routes, authentication, input validation, xAI Responses API calls, demo throttling, paid quota handling, billing, and HTML pages.
2. **Bot blueprints (`bots/`)**: localized discovery metadata and prompt builders. Only Drama Hook and sample-only Viral Radar are publicly registered.
3. **Cloudflare KV**: API-key hashes and records, metrics, demo counters, and optional leaderboard snapshots.
4. **UsageCounter Durable Object**: atomic paid-quota consumption and refunds.
5. **Stripe Checkout (optional)**: one-time IDR 30-day passes when explicitly configured.

## Public demo flow

`POST /v1/demo/invoke` → same-origin check → script/options validation → best-effort KV reservation → localized `buildPrompt()` → xAI Responses API → metrics + attribution.

AI failures release the reserved demo counters. KV throttling is best-effort, not an atomic distributed rate limiter.

## Paid flow

`POST /v1/app/invoke` → hash API key → active plan + expiry check → script/options validation → atomic quota reservation → localized `buildPrompt()` → xAI Responses API → metrics + attribution.

AI failures refund the reserved paid quota through the Durable Object.

## Legacy compatibility flow

`POST /v1/a2a/invoke` → shared-secret authentication → custom `A2A-v1` validation → policy guard → registry → xAI Responses API → metrics + attribution + `Deprecation: true`.

This custom route is not the official A2A protocol. MCP and Cloudflare AI Gateway are not currently used. The scheduled handler is a safe heartbeat only; it does not fabricate or publish leaderboard snapshots.
