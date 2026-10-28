# GrokBotHub 印尼个人 Stripe 运营方案

更新日期：2026-10-28  
负责人：Grok（市场与运营）+ Kimi（产品与技术）+ Owner（账户与合规）

## 1. 结论与边界

以印尼个人身份申请 Stripe，不使用虚假海外地址、不购买或租用他人账户。Stripe 印尼目前为邀请制，个人账户需要 KTP，NPWP 可选，并需要 IDR 银行账户。当前只支持 IDR 与印尼银行 Virtual Account，不支持跨境交易，因此第一阶段只面向印尼客户，以一次性 30 天数字 API 通行证验证付费需求，不依赖自动续费。

官方依据：
- [印尼账户申请要求](https://support.stripe.com/questions/requirements-to-open-a-stripe-account-in-indonesia)
- [印尼账户支付方式与币种限制](https://support.stripe.com/questions/supported-payment-methods-currencies-and-businesses-for-stripe-accounts-in-indonesia)

本方案不承诺收入。第一阶段目标是获得真实付费验证，而不是虚构订单、客户或增长数据。

## 2. 产品与价格

目标用户：印尼短剧编剧、小型内容团队、短剧制作与发行团队。

核心价值：用 AI 分析短剧开场 3 秒的冲突、身份反转和受众适配，减少人工初筛时间。

| 套餐 | 一次性价格 | 有效期 | 分析额度 | 交付 |
|---|---:|---:|---:|---|
| Free | Rp0 | 公开试玩 | 每 IP 每小时 3 次，全局每天 20 次 | 浏览器试玩 |
| Creator | Rp449,000 | 30 天 | 1,000 次 | API 密钥 + JSON 分析 |
| Studio | Rp1,499,000 | 30 天 | 5,000 次 | Creator 全部能力 + 集成支持 |

规则：
- 一次性 Checkout，不自动扣款、不自动续费。
- 每个订单签发一个新 API 密钥，密钥有效期 30 天。
- 额度在 30 天内累计使用，不结转；超额返回 HTTP 429，不产生超额费用。
- 上游 AI 调用失败时自动退回预留额度。
- Stripe 配置未完成时只显示申请入口，不显示伪造的支付成功或购买按钮。

## 3. 角色分工

### Owner

1. 在 Stripe 官方页面登记 Indonesia / Individual 邀请申请。
2. 准备 KTP、NPWP（可选）、印尼地址、支持电话、IDR 银行账户与分行信息。
3. 确保姓名、KTP、银行账户姓名一致。
4. 获批后创建两个一次性 IDR Price，并提供 Secret Key 与两个 Price ID 的安全配置。
5. 处理真实客户支持、退款和税务事项；不得在公开 Issue 发布完整银行卡、身份证或 API 密钥。

### Kimi：产品与技术

1. 将 Stripe Checkout 改为一次性 `payment` 模式与 IDR 价格。
2. 将密钥记录改为 30 天有效期，并按单密钥执行总额度控制。
3. 保留 Durable Objects 原子计数与失败退额。
4. 补齐服务条款、隐私政策、退款规则和支持入口。
5. 完成自动化测试、浏览器验收、Cloudflare 部署、GitHub CI。
6. 获得真实 Stripe 配置后先做测试支付，再开启生产购买按钮。

### Grok：市场与运营

1. 访谈至少 10 个印尼短剧创作者或团队，记录当前剧本初筛成本、每周脚本量、最常用语言和付费障碍。
2. 用真实 Demo 做获客，不使用虚假客户 Logo、虚构评分或收入截图。
3. 制作 3 个印尼语短内容：身份反转、婚礼冲突、隐藏继承人，各展示一次真实分析过程。
4. 建立访客 → 试玩 → 购买 → 首次 API 调用 → 30 天复购的漏斗记录。
5. 每周输出用户异议、付费转化、额度使用和产品改进建议。

## 4. Stripe 申请资料

Business type：`Individual`

Website：`https://grok-bot-hub.vfvincentwong-881.workers.dev/pricing`

产品描述：

> GrokBotHub is a software-as-a-service tool that provides AI-assisted short-drama script analysis. Customers purchase a 30-day quota of text analysis through an API. We sell digital software services only, with no physical goods, financial services, or user-to-user payments.

Statement descriptor 建议：`GROKBOTHUB`

## 5. 上线节奏

### D0–D1：可审核、可购买的产品

- 网站使用 IDR 和 30 天通行证。
- 条款、隐私、退款页面可访问。
- 未配置支付时明确显示申请入口。
- Owner 提交 Stripe 邀请申请。

### 获批后 D1：测试支付

- 配置 `STRIPE_SECRET_KEY`。
- 配置 `STRIPE_PRICE_CREATOR_IDR` 与 `STRIPE_PRICE_STUDIO_IDR`。
- 创建一笔测试 Checkout，核验支付状态与 Price ID。
- 验证密钥只显示一次、KV 只存哈希、30 天到期、额度扣减和失败退额。

### 首周：真实市场验证

- 完成 10 次目标客户访谈。
- 发布 3 条真实演示内容。
- 争取首个真实付费订单，但不设收入保证。
- 每天检查支付失败、密钥交付、API 错误与用户反馈。

### 第 30 天：继续或调整

- 复盘试玩率、购买率、激活率、额度使用率与退款原因。
- 若 Creator 额度经常不足，引导升级 Studio。
- 若试玩高但购买低，优先修正定价、信任与目标用户，不盲目增加模型成本。
- 若有稳定复购，再评估年付、自动续费或国际收款主体。

## 6. 核心指标

- Demo 完成率 = 完成分析人数 / 开始试玩人数。
- 购买转化率 = 真实付费订单数 / 完成 Demo 人数。
- 激活率 = 完成首次付费 API 调用人数 / 付费客户数。
- 额度使用率 = 已用分析次数 / 已购分析次数。
- 30 天复购率 = 再次购买人数 / 到期客户数。
- 单笔贡献 = 实收金额 − 支付手续费 − xAI 成本 − 退款；没有真实账单前不得填写估算为事实。

## 7. 验收清单

- [ ] Stripe Individual 邀请申请已提交。
- [ ] 网站只显示 IDR 与 30 天通行证。
- [ ] 条款、隐私、退款页面已上线。
- [ ] 测试支付成功并正确签发密钥。
- [ ] 密钥哈希、到期时间、额度限制均验证。
- [ ] 无效密钥、过期密钥、超额请求返回正确错误。
- [ ] AI 失败退额通过测试。
- [ ] 所有测试、Lint、TypeScript、GitHub CI 通过。
- [ ] 真实客户支持流程已明确。
