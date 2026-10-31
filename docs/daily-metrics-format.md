# GrokBotHub 每日经营数据交付格式

本文固化 KIMI 向「GrokBotHub 运营」Bot 交付数据的口径。真实经营数字、流水、客户联系方式、API key 和密钥不得写入仓库。

## 时间与渠道

- 统计窗口：前一天 19:00（含）到当天 19:00（不含），时区固定为 UTC+8。
- 交付截止：每天 19:30（UTC+8），给运营 Bot 留出 20:00 出日报的时间。
- 交付渠道：Vincent 指定前，交给 Vincent 转交。
- 迟交或漏交：次日补交原统计日期的数据，`revision` 加 1，并设 `late=true`；不得改写成次日窗口。
- 更正：重新交付原统计日期的完整数据，`revision` 加 1，并在 `corrections` 说明改动字段、原因和核对依据；不得直接覆盖历史。

## 数据状态

每个指标必须包含 `status` 和 `source`：

- `verified`：已核对，可以引用；必须有 `verified_at`。
- `no_data`：没有取得可核对数据；数值必须为 `null`，不得估填。
- `unverified`：有数值但尚未核对；运营 Bot 不得当作事实引用。

确认为 0 时填 `0`，并在 `source` 说明如何确认。`no_data` 与 0 不得混用。意向、咨询、口头承诺、待付款、测试支付均不得计入订单或收入。

## 指标口径

| key | 口径与来源 |
| --- | --- |
| `revenue_received_idr` | 窗口内实际到账且能核对流水的 IDR；来源为正式模式支付流水、银行或电子钱包流水。 |
| `refunds_idr` | 窗口内实际退出的 IDR；来源同上。 |
| `model_cost` | 同时交付 USD 原值与 IDR 折算值，记录汇率、汇率来源和取数日期；用量来自 `/v1/admin/usage/summary` 的精确 `since`/`until` 查询，并定期与 xAI 账单核对。 |
| `other_cost_idr` | 实际扣费，细分 Cloudflare、支付手续费、域名、退款和其他；以来源账单或发票为准。 |
| `leads` | 首次主动咨询 Creator / Studio 的独立联系人；同一联系人只算一次，排除广告、垃圾信息和内部测试；台账仅使用脱敏编号。 |
| `orders` | 已付款、已到账且已经或即将交付 API key 的订单；需到账流水与交付记录对应。 |
| `real_business_calls` | 分别报告 `paid_api_calls`、`free_external_calls`、`excluded_internal_calls`；前两项之和才是真实业务调用，免费调用不得计为订单或收入。 |

任务 3 未上线前，`model_cost` 和 `real_business_calls` 必须为 `no_data`，各项数值为 `null`。付费 API 未接入用量记账前，`paid_api_calls` 同样为 `null`。USD→IDR 汇率来源未由 Vincent 指定前，`value_idr`、`fx_rate` 和 `fx_source` 为 `null`，不得自行换算。

## JSON 模板

以下仅演示字段结构，不代表任何真实经营数据。

```json
{
  "schema": "gbh-daily-metrics/v1",
  "date": "2026-11-01",
  "window_start": "2026-10-31T19:00:00+08:00",
  "window_end": "2026-11-01T19:00:00+08:00",
  "revision": 1,
  "late": false,
  "prepared_by": "KIMI",
  "prepared_at": "2026-11-01T19:20:00+08:00",
  "code": {
    "main_commit": null,
    "cloudflare_version": null,
    "deployed_in_window": null,
    "rollback_target": null
  },
  "metrics": {
    "revenue_received_idr": {
      "value": null,
      "status": "no_data",
      "source": "待核对实际到账流水",
      "source_ref": null,
      "verified_at": null
    },
    "refunds_idr": {
      "value": null,
      "status": "no_data",
      "source": "待核对实际退款流水",
      "source_ref": null,
      "verified_at": null
    },
    "model_cost": {
      "value_usd": null,
      "value_idr": null,
      "fx_rate": null,
      "fx_source": null,
      "status": "no_data",
      "source": "任务 3 用量汇总接口尚未上线",
      "source_ref": null,
      "note": "无数据"
    },
    "other_cost_idr": {
      "value": null,
      "status": "no_data",
      "breakdown": {
        "cloudflare": null,
        "payment_fees": null,
        "domain": null,
        "refunds": null,
        "other": null
      },
      "source": "待核对实际扣费账单",
      "source_ref": null,
      "verified_at": null
    },
    "leads": {
      "value": null,
      "status": "no_data",
      "ids": [],
      "source": "待核对 WhatsApp 与销售邮箱",
      "verified_at": null
    },
    "orders": {
      "value": null,
      "status": "no_data",
      "ids": [],
      "source": "待核对到账流水与交付记录",
      "verified_at": null
    },
    "real_business_calls": {
      "paid_api_calls": null,
      "free_external_calls": null,
      "excluded_internal_calls": null,
      "status": "no_data",
      "source": "任务 3 用量汇总接口尚未上线",
      "source_ref": null
    }
  },
  "pending_intents": {
    "count": null,
    "note": "仅供参考，不计入订单或收入"
  },
  "data_issues": [],
  "corrections": []
}
```

## 用量查询与部署登记

任务 3 上线后，`model_cost.source_ref` 与调用数据的 `source_ref` 必须记录实际查询的 `since`、`until` 和 `source` 过滤条件，但不得记录 `USAGE_READ_TOKEN`。窗口按 `[window_start, window_end)` 过滤，避免 19:00 边界重复计数。

若窗口内发生部署，`code` 必须登记 git commit、新 Cloudflare Version ID、部署前生效的回滚目标、UTC+8 部署时间、四项检查结果、Vincent 的批准原文与时间，以及至少 15 分钟的观察结论。没有可靠证据的字段写 `null` 并在 `data_issues` 说明，不得用事后补跑冒充部署当时的结果。

## 隐私

交付中不得包含完整手机号、邮箱、明文 API key、用户脚本、模型输出、IP 或任何密钥。流水号和订单号只保留核对所需的脱敏引用。
