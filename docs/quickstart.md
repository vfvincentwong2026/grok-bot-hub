# Quick Start

## Prerequisites

- Node.js 20+
- Wrangler CLI
- xAI API key for real analysis
- Cloudflare account for deployment

## 1. Clone and install

```bash
git clone https://github.com/vfvincentwong2026/grok-bot-hub.git
cd grok-bot-hub
npm ci
cp .dev.vars.example .dev.vars
```

Fill `.dev.vars` locally. Never commit real secrets.

## 2. Configure a local or new KV namespace

For an existing deployment, keep the binding already in `wrangler.toml`. For a new deployment only:

```bash
npx wrangler kv namespace create LEADERBOARD_KV
```

Copy the returned namespace ID into `wrangler.toml`.

## 3. Configure production secrets when approved

```bash
npx wrangler secret put XAI_API_KEY
npx wrangler secret put A2A_SHARED_SECRET
```

Stripe remains disabled until its secret and both IDR Price IDs are configured and tested.

## 4. Run locally

```bash
npm run dev -- --test-scheduled
```

```bash
curl http://localhost:8787/health
curl "http://localhost:8787/?lang=id"
curl "http://localhost:8787/install?lang=zh"
curl "http://localhost:8787/v1/bots?lang=id"
curl http://localhost:8787/v1/leaderboard
```

The optional local scheduled request triggers a heartbeat only; it does not create a ranking snapshot:

```bash
curl http://localhost:8787/cdn-cgi/local/scheduled
```

## 5. Verify before a pull request

```bash
npm audit --audit-level=high
npm run lint
npx tsc --noEmit
npm run test
```

## 6. Deploy only with Owner approval

```bash
npm run deploy
```

Worker renames, real payment activation, Marketplace submission, and production deployment require Vincent's written approval.
