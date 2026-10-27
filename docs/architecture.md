# Architecture

## 三层结构

1. **Edge Hub（`workers/src`）**：A2A 路由、鉴权、X 合规守卫、AI Gateway 调用。
2. **Bot Blueprints（`bots/`）**：每个 bot 暴露一个 `BotBlueprint`，声明 skills 与 prompt 构建逻辑。
3. **Protocol（`a2a/`）**：`schema.json` 定义请求/响应与 agent card 契约。

## 调用链
client → POST /v1/a2a/invoke
→ auth (Bearer A2A_SHARED_SECRET)
→ checkXPolicy()
→ registry.getBot(target_bot)
→ bot.buildPrompt(payload)
→ env.AI.run(xai/${model}, { gateway })
→ recordMetric() → LEADERBOARD_KV

text

## 为什么用 AI Gateway

- 统一 xAI 出口、缓存与可观测性
- 便于后续切换 provider 或加限流
- 避免在 Worker 内直连时泄露密钥到日志
