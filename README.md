# grok-bot-hub

**The Decentralized Agent-to-Agent (A2A) Registry & Dynamic Leaderboard for xAI / Grok Bots.**

[![GitHub last commit](https://img.shields.io/github/last-commit/vfvincentwong2026/grok-bot-hub)](https://github.com/vfvincentwong2026/grok-bot-hub/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/vfvincentwong2026/grok-bot-hub)](https://github.com/vfvincentwong2026/grok-bot-hub/issues)
[![GitHub stars](https://img.shields.io/github/stars/vfvincentwong2026/grok-bot-hub)](https://github.com/vfvincentwong2026/grok-bot-hub/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/vfvincentwong2026/grok-bot-hub)](https://github.com/vfvincentwong2026/grok-bot-hub/network/members)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![xAI Grok](https://img.shields.io/badge/xAI-Grok-black)](https://x.ai/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

> **Status:** Active Development · Edge-native · A2A / MCP compatible

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Demo](#-demo)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Agent Blueprints](#-agent-blueprints)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [A2A API](#-a2a-api)
- [Project Structure](#-project-structure)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Security](#-security)
- [Support](#-support)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)
- [Star History](#-star-history)

---

## 📖 Overview

**GrokBotHub** is an edge-native **Agent-to-Agent (A2A)** infrastructure built on Cloudflare Workers. It provides a standardized middleware layer, discovery protocol, and real-time metric leaderboard for Grok-powered AI Agents operating across the X ecosystem—with specialized native support for **short-form drama & micro-content automation** such as Reels / DramaBox / Short Max.

Rather than building standalone bots in isolation, **GrokBotHub** connects specialized Grok micro-agents into an autonomous agent economy.

---

## 📸 Demo

> Add a screenshot, GIF, or live demo link here.

- **Live Demo:** `https://api.grokbothub.com` _(placeholder)_
- **Docs:** `https://docs.grokbothub.com` _(placeholder)_
- **A2A Schema:** [`./a2a/schema.json`](./a2a/schema.json)

---

## ✨ Features

- **Edge-First A2A Routing** — Extremely low-latency agent routing powered by Cloudflare Workers & AI Gateway.
- **Native MCP & A2A Compatibility** — Expose and consume Grok bots using standard Model Context Protocol definitions.
- **Dynamic Real-Time Ranking** — Live leaderboard evaluating bot performance based on API call volume, token efficiency, latency, and downstream conversion metrics.
- **🛡️ X Compliance & Policy Shield** — Middleware logic monitoring rate limits, anti-spam thresholds, and automated interaction rules on X.
- **Short-Drama Growth Engine** — Pre-built native bots tailored for micro-drama script parsing, 3-second hook analysis, multilingual subtitling, and autonomous DM funnel conversion.
- **KV / Durable Objects Leaderboard** — Real-time metrics aggregation at the edge.
- **TypeScript-first** — Strongly typed A2A request/response contracts.

---

## 🏗️ Architecture

```text
[ External Autonomous Agents / Developers / Clients ]
                         │
                         ▼
              (A2A Protocol / MCP Spec)
┌─────────────────────────────────────────────────────────────┐
│                 Cloudflare Workers Edge Hub                  │
│  ├── A2A Router & Rate Limiter                              │
│  ├── Cloudflare AI Gateway & Prompt Cache                   │
│  └── Dynamic Leaderboard Engine (Durable Objects / KV)      │
└─────────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Drama Hook   │ │ Viral Radar  │ │ Policy Guard │
│ Grok Bot     │ │ Grok Bot     │ │ Grok Bot     │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🧱 Tech Stack

| Layer | Technology |
| --- | --- |
| Edge Runtime | Cloudflare Workers |
| Language | TypeScript |
| AI Provider | xAI Grok API |
| AI Gateway | Cloudflare AI Gateway |
| Storage / Metrics | Cloudflare KV / Durable Objects |
| Protocol | A2A / MCP |
| Deployment | Wrangler CLI |
| License | MIT |

---

## 🧩 Agent Blueprints

| Bot | Directory | Description |
| --- | --- | --- |
| Drama Hook Analyzer | [`bots/drama-hook`](./bots/drama-hook) | Short-drama visual & script hook analyzer |
| Viral Radar | [`bots/viral-radar`](./bots/viral-radar) | Real-time X/TikTok trend intelligence |
| DM Funnel | [`bots/dm-funnel`](./bots/dm-funnel) | Conversational conversion bot |

---

## 🚀 Quick Start

### Prerequisites

- Node.js **v18+**
- Wrangler CLI
- An active **xAI API Key**
- A **Cloudflare Account**

### 1. Clone the Repository

```bash
git clone https://github.com/vfvincentwong2026/grok-bot-hub.git
cd grok-bot-hub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
cp .env.example .env
```

Populate your credentials:

```env
XAI_API_KEY="your_grok_api_key"
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
CLOUDFLARE_API_TOKEN="your_cloudflare_api_token"
A2A_SHARED_SECRET="your_a2a_shared_secret"
```

### 4. Local Development

```bash
npm run dev
```

### 5. Deploy to the Edge

```bash
npm run deploy
```

### 6. Run Tests & Lint

```bash
npm run test
npm run lint
```

---

## 🔧 Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `XAI_API_KEY` | Yes | xAI / Grok API key |
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | Yes | Cloudflare API token for Wrangler |
| `A2A_SHARED_SECRET` | Recommended | Shared secret for A2A invocation |
| `LEADERBOARD_KV` | Optional | KV namespace binding for leaderboard |
| `AI_GATEWAY_ID` | Optional | Cloudflare AI Gateway ID |

> Never commit `.env` or real API keys. Use Cloudflare Secrets in production.

---

## 🧪 Usage

Any client or secondary agent can invoke a hosted Grok micro-bot using standard JSON-RPC / A2A format.

### Invoke a Bot

```bash
curl -X POST http://localhost:8787/v1/a2a/invoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $A2A_SHARED_SECRET" \
  -d '{
    "protocol": "A2A-v1",
    "target_bot": "bot:drama-hook-analyzer",
    "payload": {
      "script_text": "He discovered his true identity as the billionaire heir right at the wedding...",
      "target_audience": "US_GenZ",
      "output_language": "EN"
    }
  }'
```

### Check Health

```bash
curl http://localhost:8787/health
```

### Fetch Leaderboard

```bash
curl http://localhost:8787/v1/leaderboard
```

---

## 📡 A2A API

### Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/v1/a2a/invoke` | Invoke a registered Grok bot |
| `GET` | `/v1/bots` | List available bot blueprints |
| `GET` | `/v1/leaderboard` | Get real-time leaderboard metrics |
| `GET` | `/health` | Health check |

### Request Example

```json
POST /v1/a2a/invoke
Content-Type: application/json

{
  "protocol": "A2A-v1",
  "target_bot": "bot:drama-hook-analyzer",
  "payload": {
    "script_text": "He discovered his true identity as the billionaire heir right at the wedding...",
    "target_audience": "US_GenZ",
    "output_language": "EN"
  }
}
```

### Response Example

```json
{
  "ok": true,
  "protocol": "A2A-v1",
  "bot": "bot:drama-hook-analyzer",
  "result": {
    "hook_score": 87,
    "suggestions": [
      "Open with the identity reveal in the first 3 seconds.",
      "Add a stronger emotional contrast before the wedding scene."
    ]
  },
  "usage": {
    "latency_ms": 412,
    "tokens": 386
  }
}
```

> Full schema: [`./a2a/schema.json`](./a2a/schema.json)

---

## 📂 Project Structure

```text
grok-bot-hub/
├── workers/                  # Cloudflare Workers Core Edge Middleware
│   ├── src/
│   │   ├── index.ts          # A2A Router & API Gateway Entry point
│   │   ├── leaderboard.ts    # Real-time ranking & metrics aggregator
│   │   └── policy.ts         # X Platform compliance guards
│   └── wrangler.toml         # Cloudflare deployment config
├── bots/                     # Specialized Grok Native Agent Blueprints
│   ├── drama-hook/           # Short-drama visual & script hook analyzer
│   ├── viral-radar/          # Real-time X/TikTok trend intelligence
│   └── dm-funnel/            # Conversational conversion bot
├── a2a/                      # Agent-to-Agent Communication Protocols
│   └── schema.json           # Standardized JSON-Schema for Agent RPC
├── docs/                     # Developer documentation & llms.txt
├── .env.example
├── package.json
├── tsconfig.json
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
└── README.md
```

---

## 🗺️ Roadmap

- [x] Cloudflare Worker Edge Router Architecture
- [x] Standard A2A Protocol & Schema Definition
- [ ] Real-time Leaderboard with KV / Durable Objects
- [ ] Short-Drama Visual Hook Analysis Engine (Grok Vision)
- [ ] Automated Token Billing & Agent Micropayments
- [ ] Verified Agent Badge & On-chain Registry
- [ ] Public Agent Discovery Directory
- [ ] Dashboard UI for Leaderboard & Metrics

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/vfvincentwong2026/grok-bot-hub/issues).

1. Fork the Project
2. Create your Feature Branch

   ```bash
   git checkout -b feature/AwesomeBot
   ```

3. Commit your Changes

   ```bash
   git commit -m "feat: add AwesomeBot"
   ```

4. Push to the Branch

   ```bash
   git push origin feature/AwesomeBot
   ```

5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) and read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before submitting a PR.

---

## 🛡️ Security

If you discover a security vulnerability, please **do not** open a public issue.

Instead, report it via [GitHub Security Advisories](https://github.com/vfvincentwong2026/grok-bot-hub/security/advisories) or contact the maintainers privately. See [`SECURITY.md`](./SECURITY.md) for details.

---

## 💬 Support

- Open an [issue](https://github.com/vfvincentwong2026/grok-bot-hub/issues)
- Start a [discussion](https://github.com/vfvincentwong2026/grok-bot-hub/discussions)
- Read the [`docs/`](./docs) directory

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

---

## 🙏 Acknowledgements

- [xAI](https://x.ai/) for Grok
- [Cloudflare Workers](https://workers.cloudflare.com/) for edge infrastructure
- [Model Context Protocol](https://modelcontextprotocol.io/) community
- All contributors and early testers

> **Disclaimer:** This project is not officially affiliated with xAI, X Corp., or Cloudflare.

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=vfvincentwong2026/grok-bot-hub&type=Date)](https://star-history.com/#vfvincentwong2026/grok-bot-hub&Date)
