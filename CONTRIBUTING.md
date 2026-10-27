# Contributing to grok-bot-hub

感谢你愿意贡献！请遵循以下流程。

## 开发环境

- Node.js **v18+**
- `npm install`
- `cp .env.example .env` 并填入本地凭据
- `npm run dev` 启动本地 Workers

## 分支与提交

- 从 `main` 切出功能分支：`feat/<short-name>`、`fix/<short-name>`、`docs/<short-name>`
- 提交信息遵循 **Conventional Commits**：
  - `feat: add drama-hook bot blueprint`
  - `fix: correct A2A auth header parsing`
  - `docs: update deployment steps`

## Pull Request 要求

- [ ] `npm run lint` 通过
- [ ] `npm run test` 通过
- [ ] 新增行为附带测试或说明
- [ ] 涉及协议变更时同步更新 `a2a/schema.json`
- [ ] 涉及 X 交互逻辑时确认符合 `workers/src/policy.ts` 中的合规约束

## 新增 Bot Blueprint

1. 在 `bots/` 下新建目录，参考现有 blueprint 结构
2. 在 `a2a/schema.json` 的 `skills` 中注册能力描述
3. 在 README 的 Agent Blueprints 表格中补一行

## 报告问题

请使用 GitHub Issues，并选择 **Bug report** 或 **Feature request** 模板。
安全漏洞请勿公开提交，见 [SECURITY.md](./SECURITY.md)。

## 行为准则

参与本项目即表示同意遵守 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。
