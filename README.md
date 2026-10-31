# GrokBotHub

A Cloudflare Workers service that provides short-drama hook analysis with Grok, multilingual discovery, limited public demos, and one-time Indonesian 30-day API passes.

> **Status:** Active development. The current product name is retained while rebranding is pending Owner approval. This project is not affiliated with xAI, X Corp., or Cloudflare.

## Implemented capabilities

- Indonesian-first, trilingual landing page (`id` / `en` / `zh`) with a prefilled Indonesian example and remembered demo selections.
- Short-drama opening analysis through the xAI Responses API with overall and four dimension scores, strengths, suggestions, and exactly three rewritten hooks.
- Side-by-side original/rewrite comparison, one-click copy, AI attribution, and a result ID. Result IDs are not signed receipts yet.
- Input language auto-detection for Indonesian, English, and Chinese; Indonesian defaults to `ID_GenZ` + TikTok.
- Selectable audience, platform, and output language (`id` / `en` / `zh`).
- First-party analytics in KV with a 90-day TTL: no third-party trackers and no script text in event records.
- Standard MCP Streamable HTTP at `/mcp` with `initialize`, `ping`, `tools/list`, and the `analyze_hook` tool.
- Free MCP access without registration or an API key, sharing the web demo limits: 3 calls per IP each hour and 20 calls globally per day.
- An honest `/install` page with MCP configuration and API examples; Grok Bot plugins remain marked as coming soon.
- Localized bot and Agent Card discovery in English, Indonesian, and Chinese.
- Shared public demo and free MCP limits with best-effort reservation release when AI fails or returns an invalid result.
- Paid API keys stored as SHA-256 hashes, 30-day expiration, per-key quotas, and failed-call quota refunds.
- One-time IDR Checkout passes: Creator Rp449,000 / 1,000 analyses and Studio Rp1,499,000 / 5,000 analyses. No automatic renewal.
- Honest empty states when no leaderboard snapshot or verified outcome data exists.
- Terms, privacy, and refund pages.

The legacy custom `A2A-v1` invocation route remains available for compatibility and returns `Deprecation: true`. It is not represented as the official A2A protocol. Grok Bot plugin packages, signed outcome receipts, and verified-result rankings are not implemented yet. See the [free MCP guide](./docs/mcp.md) for configuration and limits.

## Live service

- Website: https://grok-bot-hub.vfvincentwong-881.workers.dev/
- Pricing: https://grok-bot-hub.vfvincentwong-881.workers.dev/pricing
- Health: https://grok-bot-hub.vfvincentwong-881.workers.dev/health

Stripe is not configured in production yet. Until it is configured and tested, the pricing page shows request links rather than pretending that checkout is available.

## Quick start

### Prerequisites

- Node.js 20+
- A Cloudflare account for deployment
- An xAI API key for real analysis

```bash
git clone https://github.com/vfvincentwong2026/grok-bot-hub.git
cd grok-bot-hub
npm ci
cp .dev.vars.example .dev.vars
```

Fill `.dev.vars` locally. Never commit real credentials. In production, use `wrangler secret put` for secrets.

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run test
npm audit --audit-level=high
```

Production deployment and any Worker rename require Owner approval:

```bash
npm run deploy
```

## API

### Public demo

```bash
curl -X POST http://localhost:8787/v1/demo/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "script_text": "Kamu bilang aku hanya seorang pelayan, tetapi aku adalah pewaris yang sebenarnya.",
    "platform": "tiktok"
  }'
```

With `input_language` omitted or set to `auto`, Indonesian input defaults to `ID_GenZ`, Indonesian output, and TikTok. Other input languages default to Reels. Explicit options override the defaults:

- `input_language`: `auto`, `id`, `en`, `zh`
- `target_audience`: `ID_GenZ`, `ID_Millennial`, `US_GenZ`, `CN_GenZ`
- `output_language`: `id`, `en`, `zh`
- `platform`: `tiktok`, `reels`, `youtube_shorts`, `dramabox`, `shortmax`, `reelshort`

### Free MCP

Configure a remote MCP client with `http://localhost:8787/mcp`, or call it directly:

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

The `analyze_hook` tool accepts the same script and localization options as the public demo. No registration or API key is required. Free calls share the demo quota, and non-example calls record first activation once per hashed IP. See [docs/mcp.md](./docs/mcp.md) for initialization, tool-call examples, errors, and privacy details.

### Paid analysis

```bash
curl -X POST http://localhost:8787/v1/app/invoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "script_text": "The maid reveals she is the true heir at the wedding.",
    "target_audience": "ID_Millennial",
    "output_language": "id",
    "platform": "reels"
  }'
```

Successful AI responses include `dimensions`, three `rewritten_hooks`, `receipt_id`, and `attribution`. Failed AI calls and invalid model output return an error and refund reserved paid quota. The current result ID identifies a response but is not a signed receipt.

### Discovery and operations

| Method | Endpoint | Current behavior |
| --- | --- | --- |
| `GET` | `/health` | Service health |
| `GET` | `/install` | Working MCP/API configuration and honest Grok Bot plugin status |
| `POST` | `/mcp` | MCP Streamable HTTP and free `analyze_hook` calls |
| `GET` | `/v1/bots?lang=id` | Localized public bot list |
| `GET` | `/.well-known/agent-card.json?lang=zh` | Localized discovery cards |
| `GET` | `/v1/leaderboard` | Existing snapshot or an honest empty array |
| `POST` | `/v1/events` | Allowed browser events only; raw script and unsupported fields are rejected |
| `POST` | `/v1/demo/invoke` | Rate-limited public analysis |
| `POST` | `/v1/app/invoke` | Paid hook analysis |
| `POST` | `/v1/billing/checkout` | Stripe Checkout when configured; otherwise 503 |
| `GET` | `/v1/billing/complete` | Checkout completion and key display |
| `POST` | `/v1/a2a/invoke` | Deprecated custom compatibility route |

Automated DM and reply actions are rejected even if a caller self-reports user initiation. The DM Funnel blueprint is not publicly registered. Viral Radar analyzes only samples supplied by the caller; it does not scrape platforms or claim live trend access.

## Repository map

```text
workers/src/          Worker routes, demo, paid analysis, billing, policy, and UI
bots/drama-hook/      Hook-analysis prompt and localized blueprint
bots/viral-radar/     Sample-only analysis blueprint
a2a/schema.json       Legacy custom compatibility schema
tests/                Vitest unit and route tests
docs/                 Operations and technical notes
wrangler.toml         Cloudflare Worker configuration
```

## Contributing and security

Use a feature branch and open a pull request. Every pull request must pass `npm ci`, dependency audit, lint, TypeScript, tests, and GitHub CI. Do not commit credentials, fabricated customer data, rankings, or revenue claims.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`SECURITY.md`](./SECURITY.md). Distributed under the [MIT License](./LICENSE).
