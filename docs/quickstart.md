# Quick Start

## Prereq

- Node.js 18+
- Wrangler CLI
- xAI API key
- Cloudflare 账号

## 步骤

### 1. 克隆仓库并安装依赖

```bash
git clone https://github.com/vfvincentwong2026/grok-bot-hub.git
cd grok-bot-hub
npm install
```

### 2. 创建 KV namespace

```bash
wrangler kv namespace create LEADERBOARD_KV
```

将命令返回的 namespace ID 填入 `wrangler.toml` 的 `kv_namespaces.id`。

### 3. 设置 xAI API key

```bash
wrangler secret put XAI_API_KEY
```

### 4. 设置 A2A 共享密钥

```bash
wrangler secret put A2A_SHARED_SECRET
```

### 5. 启动本地开发服务

```bash
npm run dev -- --test-scheduled
```

### 6. 检查端点

```bash
curl http://localhost:8787/health
curl http://localhost:8787/v1/bots
curl http://localhost:8787/v1/leaderboard
```

### 7. 触发本地定时快照

```bash
curl http://localhost:8787/cdn-cgi/local/scheduled
```

### 8. 部署

```bash
npm run deploy
```
