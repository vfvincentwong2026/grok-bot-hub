# Grok Bot 24 小时试运营指令

更新日期：2026-10-29

复制以下整段给 Grok Bot：

> 请在 2026 年 10 月 30 日后开始对 GrokBotHub 进行 24 小时试运营：直接读取 https://github.com/vfvincentwong2026/grok-bot-hub 的 `main` 分支，先拉取最新代码并核对提交哈希，再阅读 `docs/indonesia-stripe-operations-plan.md`、README 和部署配置；依次运行 `npm ci`、`npm run lint`、`npx tsc --noEmit`、`npm run test`，全部通过且获得 Vincent 书面部署批准后才执行 `npm run deploy`，不得绕过失败检查强行上线。部署后验证 `/health`、`/v1/bots`、`/v1/leaderboard`、`/pricing`、`/terms`、`/privacy`、`/refunds`，用内置浏览器完成一次公开试玩，并确认 Stripe 未配置时 Checkout 返回 `503 billing_not_configured`、无效 `gbh_` 密钥返回 401；不得伪造支付成功、订单、客户或收入，不得开启真实扣款，不得把 XAI、Cloudflare、Stripe 等密钥写进代码、Issue、日志或报告，也不得擅自修改 Rp449,000 / Rp1,499,000 的 30 天一次性通行证方案。连续观察 24 小时，每 2 小时记录可访问性、响应状态、错误、延迟、试玩与 API 调用情况；若出现持续 5xx、密钥交付异常或核心流程损坏，立即停止推广、保留证据并回滚到上一可用 Cloudflare Version，不要反复盲目部署。期间可开展真实用户访谈和演示内容测试，但不得未经 Owner 同意购买广告、承诺收益或处理真实退款；24 小时结束后提交一份报告，列明代码提交与 Cloudflare Version、测试证据、运行异常、真实用户反馈、转化数据、发现的问题和下一步建议，所有数字必须来自实际日志或测试，不得估算冒充事实。
