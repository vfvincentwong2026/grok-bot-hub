# A2A Protocol v1

## 请求

```json
{
  "protocol": "A2A-v1",
  "method": "invoke",
  "target_bot": "bot:drama-hook-analyzer",
  "payload": { "...": "bot-specific" },
  "context": { "request_id": "uuid", "caller": "agent:foo" }
}
响应
json
{
  "ok": true,
  "protocol": "A2A-v1",
  "bot": "bot:drama-hook-analyzer",
  "result": {},
  "usage": { "latency_ms": 412, "tokens": 386 }
}
错误码
code	HTTP	含义
unauthorized	401	A2A_SHARED_SECRET 不匹配
invalid_a2a_request	400	protocol / target_bot 缺失
bot_not_found	404	registry 中无此 bot
x_policy_violation	403	触发 X 合规守卫
invalid_json	400	请求体非 JSON
发现
GET /v1/bots 返回 registry 中所有 bot 的 agentCard 摘要，字段对齐 a2a/schema.json 的 $defs.agentCard。

text

### `docs/x-compliance.md`

```markdown
# X Compliance Notes

本项目不抓取 X，不使用浏览器自动化，只通过官方 API 与用户主动输入工作。

## 硬性约束（由 `workers/src/policy.ts` 强制执行）

- 自动回复 / DM 必须 `user_initiated === true`
- 禁止 `cross_account` 相同内容
- 发布类动作必须 `bot_disclosed === true`
- 命中 bulk 关键词直接拒绝

## 运营侧要求

- bot 账号在 bio 中披露自动化身份
- 不进行批量关注 / 取关 / 点赞
- 不对同一用户重复发送相同文案
- 保留人工接管通道

## 参考

- X Automation Rules: https://help.x.com/en/rules-and-policies/x-automation
- X Developer Agreement & Policy
