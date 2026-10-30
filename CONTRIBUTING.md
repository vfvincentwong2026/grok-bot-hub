# Contributing to grok-bot-hub

感谢你愿意贡献！请遵循以下流程。

## 开发环境

- Node.js **20+**
- `npm ci`
- `cp .dev.vars.example .dev.vars` 并填入本地凭据
- `npm run dev` 启动本地 Workers

真实凭据只能放在未跟踪的 `.dev.vars` 或通过 `wrangler secret put` 配置，不得写入代码、测试、文档或提交历史。

## 分支与提交

- 从最新 `main` 切出功能分支：`feat/<short-name>`、`fix/<short-name>`、`docs/<short-name>`
- 提交信息遵循 **Conventional Commits**：
  - `feat: add drama-hook bot blueprint`
  - `fix: correct A2A auth header parsing`
  - `docs: update deployment steps`

## Pull Request 要求

- [ ] `npm ci` 与 `npm audit --audit-level=high` 通过
- [ ] `npm run lint` 通过
- [ ] `npx tsc --noEmit` 通过
- [ ] `npm run test` 与 GitHub CI 通过
- [ ] 新增行为附带测试或说明
- [ ] README 只描述已经实现的能力
- [ ] 不涉及真实密钥、虚假客户、订单、排名或收入数据
- [ ] 涉及 X 交互逻辑时确认符合 `workers/src/policy.ts` 中的合规约束

生产部署、Worker 改名、真实收款和 Marketplace 提交必须获得 Vincent 的书面批准。

## 新增 Bot Blueprint

1. 在 `bots/` 下新建目录，参考现有 blueprint 结构。
2. 提供英、印尼、中三语描述，并在 `workers/src/registry.ts` 注册。
3. 添加输入校验、路由测试和合规测试。
4. 不宣称尚未实现的 MCP、官方 A2A、实时平台数据或自动发布能力。

## 报告问题

请使用 GitHub Issues，并选择 **Bug report** 或 **Feature request** 模板。
安全漏洞请勿公开提交，见 [SECURITY.md](./SECURITY.md)。

## 行为准则

参与本项目即表示同意遵守 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。
