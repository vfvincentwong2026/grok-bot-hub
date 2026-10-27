# Security Policy

## 支持的版本

| Version | Supported |
| --- | --- |
| 0.1.x | ✅ |

## 报告漏洞

**请勿通过公开 GitHub Issue 报告安全漏洞。**

请使用 GitHub Security Advisories：
https://github.com/vfvincentwong2026/grok-bot-hub/security/advisories

或直接联系维护者。请在报告中包含：

- 漏洞类型与影响范围
- 复现步骤
- 潜在修复建议（如有）
- 你的联系方式（可选）

## 安全设计说明

- 所有生产密钥通过 `wrangler secret put` 注入，不进入代码库
- A2A 调用使用 `A2A_SHARED_SECRET` 做 Bearer 鉴权
- 不在日志中输出 `XAI_API_KEY` 或用户原始 prompt
- 涉及 X 平台的自动化逻辑必须经过 `workers/src/policy.ts` 的合规检查
- MCP / A2A 工具执行遵循“用户显式同意”原则，不自动执行未经确认的写操作[reference:4]

## 依赖安全

- CI 中运行 `npm audit`
- 不引入未经审计的远程脚本或二进制
