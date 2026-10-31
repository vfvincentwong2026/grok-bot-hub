# GrokBotHub 每日经营数据交付格式

本文固化 KIMI 向「GrokBotHub 运营」Bot 交付数据的口径。客户联系方式、API key、密钥、用户脚本、未脱敏的流水号不得写入仓库；经营汇总数字按本文规则写入 `ops/daily-metrics/`。

## 时间、位置与提交规则

- 统计窗口：前一天 19:00（含）到当天 19:00（不含），时区固定为 UTC+8。
- 交付位置：仓库 `vfvincentwong2026/grok-bot-hub` 的独立分支 `ops/daily-metrics`，目录 `ops/daily-metrics/`，文件名 `YYYY-MM-DD.json`，日期为统计窗口结束日（UTC+8）。该分支不合并进 `main`，不触发部署。
- 交付截止：每天 19:30（UTC+8）前 push，以 git 提交时间为准。提交信息格式为 `metrics: YYYY-MM-DD r<revision>`。
- 运营 Bot 从该分支读取，总控核对，不再经 Vincent 转手。
- 迟交或漏交：次日补交原统计日期的数据，`revision` 加 1，并设 `late=true`；不得改写成次日窗口。
- 更正：在同一文件上追加新提交，`revision` 加 1，并在 `corrections` 说明改动字段、原因和核对依据。禁止 force-push 或改写历史。
- 本 `docs/daily-metrics-handoff` 分支只改格式文档，不提交任何日报文件。

> **公开仓库提醒：** 当前仓库为 PUBLIC。日报 JSON 一旦 push，收入、成本、线索数等汇总数字任何人都能看到。第一份含真实数字的日报 push 前，必须取得 Vincent 对公开披露的明确确认，或改用私有仓库／其他位置；确认前不得 push 真实数据。

## 数据状态与统一指标单元

每个业务数字都使用独立指标单元：

```json
{
  "value": null,
  "unit": "IDR | USD | IDR/USD | count",
  "status": "verified | no_data | unverified",
  "source": "核对来源",
  "source_ref": null,
  "verified_at": null,
  "note": null
}
```

- `verified`：已核对，可以引用；必须有 `verified_at`。
- `no_data`：没有取得可核对数据；`value` 和 `verified_at` 必须为 `null`，不得估填。
- `unverified`：来源不完整或尚未核对，运营 Bot 不得当作事实引用；本文规定的成本缺价场景必须为 `value=null`。
- 每个数字都有自己的 `status`、`source`、`source_ref` 和 `verified_at`，不得与相邻数字共用。
- 确认为 0 时填 `0`，并在 `source` 说明如何确认。`no_data` 与 0 不得混用。
- 意向、咨询、口头承诺、待付款、测试支付均不得计入订单或收入。

## 指标口径与账本映射

| key | 口径与来源 |
| --- | --- |
| `revenue_received_idr` | 窗口内实际到账且能核对流水的 IDR；来源为正式模式支付流水、银行或电子钱包流水。 |
| `refunds_idr` | 窗口内实际退出的 IDR；来源同上。 |
| `model_cost.usd` | 来自 `/v1/admin/usage/summary` 的精确 `since`/`until`、`source=all` 查询，并定期与 xAI 账单核对；另带 `cost_status` 和 `unpriced_calls`。 |
| `model_cost.fx` | Bank Indonesia JISDOR，USD/IDR 参考汇率；另带 `rate_date`。 |
| `model_cost.idr` | 只有 USD 成本完整且汇率已核对时，才按 `round(usd.value × fx.value)` 计算，取整到 1 IDR。 |
| `other_cost_idr` | `total` 及 `cloudflare`、`payment_fees`、`domain`、`refunds`、`other` 都是独立指标单元，以实际账单或发票为准。 |
| `leads` | 首次主动咨询 Creator / Studio 的独立联系人；同一联系人只算一次，排除广告、垃圾信息和内部测试；台账仅使用脱敏编号。 |
| `orders` | 已付款、已到账且已经或即将交付 API key 的订单；需到账流水与交付记录对应。 |
| `real_business_calls.paid_api_calls` | 付费 API 未接入账本，接口返回 `no_data`，本项写 `no_data/null`。 |
| `real_business_calls.free_external_calls` | 取 `source=all` 查询的 `totals.calls`，该字段已排除示例和巡检。 |
| `real_business_calls.excluded_internal_calls` | 取同一查询的 `excluded.internal_patrol_calls + excluded.example_calls`，并在 `note` 分别写出两个数。 |

真实业务调用 = `paid_api_calls + free_external_calls`，只有两项都是 `verified` 才能相加；免费调用不得计为订单或收入。接口返回 `status=no_data` 时，对应指标写 `no_data/null`，不得写 0。`source_ref` 记录实际查询的 `since`、`until`、`source` 参数，不写 `USAGE_READ_TOKEN`。窗口按 `[window_start, window_end)` 过滤，避免 19:00 边界重复计数。

### 未定价调用不得当成零成本

- 只有 `totals.cost_status=complete` 时，才能把 `totals.estimated_cost_usd` 作为 `model_cost.usd.value`，并在核对后标为 `verified`。
- `totals.unpriced_calls > 0` 且 `cost_status=partial` 时，`usd.status=unverified`、`usd.value=null`，`note` 必须写明 `priced_subtotal_usd` 和 `unpriced_calls`；已定价小计不得冒充完整成本。
- `cost_status=no_data` 时，`usd.status=no_data`、`usd.value=null`。
- `grok-4.7` 单价在 Vincent 确认前保持 null，因此目前模型成本一律为 `no_data`。

### Bank Indonesia JISDOR 汇率

- 来源：印尼央行（Bank Indonesia）每个工作日公布的 JISDOR 参考汇率，15:15 WIB 公布，即 16:15（UTC+8）。
- 页面：https://www.bi.go.id/en/statistik/informasi-kurs/jisdor/default.aspx
- `fx.value` 使用 IDR/USD 并保留两位小数；`rate_date` 为汇率所属日期；`source` 固定为 `Bank Indonesia JISDOR`；`source_ref` 使用上述页面；核定时填写 `verified_at`。汇率值、日期、来源三项都是必填信息。
- 取统计日当天公布的 JISDOR。周末、印尼公众假日等无公布时，使用最近一个已公布工作日的值，并在 `note` 写明“非当日汇率，取自 YYYY-MM-DD”。
- 只有 `usd.status=verified`、USD 的 `cost_status=complete` 且 `fx.status=verified` 时，`model_cost.idr` 才能标为 `verified`；否则 `idr` 必须为 `no_data/null`。

任务 3 未上线前，`model_cost` 和 `real_business_calls` 必须为 `no_data`，各项数值为 `null`。

## JSON 模板

以下仅演示字段结构，所有业务指标均为 `no_data`，不代表任何真实经营数据。

```json
{
  "schema": "gbh-daily-metrics/v1",
  "date": "2026-11-02",
  "window_start": "2026-11-01T19:00:00+08:00",
  "window_end": "2026-11-02T19:00:00+08:00",
  "revision": 1,
  "late": false,
  "prepared_by": "KIMI",
  "prepared_at": "2026-11-02T19:20:00+08:00",
  "code": {
    "main_commit": null,
    "cloudflare_version": null,
    "deployed_in_window": null,
    "rollback_target": null
  },
  "metrics": {
    "revenue_received_idr": {
      "value": null,
      "unit": "IDR",
      "status": "no_data",
      "source": "待核对实际到账流水",
      "source_ref": null,
      "verified_at": null,
      "note": null
    },
    "refunds_idr": {
      "value": null,
      "unit": "IDR",
      "status": "no_data",
      "source": "待核对实际退款流水",
      "source_ref": null,
      "verified_at": null,
      "note": null
    },
    "model_cost": {
      "usd": {
        "value": null,
        "unit": "USD",
        "status": "no_data",
        "cost_status": "no_data",
        "unpriced_calls": null,
        "source": "/v1/admin/usage/summary",
        "source_ref": "since=...&until=...&source=all",
        "verified_at": null,
        "note": "grok-4.7 单价未确认"
      },
      "fx": {
        "value": null,
        "unit": "IDR/USD",
        "rate_date": null,
        "status": "no_data",
        "source": "Bank Indonesia JISDOR",
        "source_ref": "https://www.bi.go.id/en/statistik/informasi-kurs/jisdor/default.aspx",
        "verified_at": null,
        "note": "待核对统计日或最近公布日汇率"
      },
      "idr": {
        "value": null,
        "unit": "IDR",
        "status": "no_data",
        "source": "usd × fx",
        "source_ref": null,
        "verified_at": null,
        "note": "usd 无数据"
      }
    },
    "other_cost_idr": {
      "total": {
        "value": null,
        "unit": "IDR",
        "status": "no_data",
        "source": "待核对实际扣费账单",
        "source_ref": null,
        "verified_at": null,
        "note": null
      },
      "breakdown": {
        "cloudflare": {
          "value": null,
          "unit": "IDR",
          "status": "no_data",
          "source": "待核对 Cloudflare Billing",
          "source_ref": null,
          "verified_at": null,
          "note": null
        },
        "payment_fees": {
          "value": null,
          "unit": "IDR",
          "status": "no_data",
          "source": "待核对支付手续费明细",
          "source_ref": null,
          "verified_at": null,
          "note": null
        },
        "domain": {
          "value": null,
          "unit": "IDR",
          "status": "no_data",
          "source": "待核对域名账单",
          "source_ref": null,
          "verified_at": null,
          "note": null
        },
        "refunds": {
          "value": null,
          "unit": "IDR",
          "status": "no_data",
          "source": "待核对退款流水",
          "source_ref": null,
          "verified_at": null,
          "note": null
        },
        "other": {
          "value": null,
          "unit": "IDR",
          "status": "no_data",
          "source": "待核对其他实际扣费",
          "source_ref": null,
          "verified_at": null,
          "note": null
        }
      }
    },
    "leads": {
      "value": null,
      "unit": "count",
      "status": "no_data",
      "source": "待核对 WhatsApp 与销售邮箱",
      "source_ref": null,
      "verified_at": null,
      "note": null,
      "ids": []
    },
    "orders": {
      "value": null,
      "unit": "count",
      "status": "no_data",
      "source": "待核对到账流水与交付记录",
      "source_ref": null,
      "verified_at": null,
      "note": null,
      "ids": []
    },
    "real_business_calls": {
      "paid_api_calls": {
        "value": null,
        "unit": "count",
        "status": "no_data",
        "source": "/v1/admin/usage/summary?source=paid_api",
        "source_ref": "since=...&until=...&source=paid_api",
        "verified_at": null,
        "note": "paid_api_not_instrumented"
      },
      "free_external_calls": {
        "value": null,
        "unit": "count",
        "status": "no_data",
        "source": "/v1/admin/usage/summary totals.calls",
        "source_ref": "since=...&until=...&source=all",
        "verified_at": null,
        "note": "已排除示例和巡检"
      },
      "excluded_internal_calls": {
        "value": null,
        "unit": "count",
        "status": "no_data",
        "source": "/v1/admin/usage/summary excluded",
        "source_ref": "since=...&until=...&source=all",
        "verified_at": null,
        "note": "internal_patrol_calls + example_calls"
      }
    }
  },
  "pending_intents": {
    "count": {
      "value": null,
      "unit": "count",
      "status": "no_data",
      "source": "待核对咨询台账",
      "source_ref": null,
      "verified_at": null,
      "note": "仅供参考，不计入订单或收入"
    }
  },
  "data_issues": [],
  "corrections": []
}
```

## 部署登记与隐私

若窗口内发生部署，`code` 必须登记 git commit、新 Cloudflare Version ID、部署前生效的回滚目标、UTC+8 部署时间、四项检查结果、Vincent 的批准原文与时间，以及至少 15 分钟的观察结论。没有可靠证据的字段写 `null` 并在 `data_issues` 说明，不得用事后补跑冒充部署当时的结果。

交付中不得包含完整手机号、邮箱、明文 API key、用户脚本、模型输出、IP 或任何密钥。流水号和订单号只保留核对所需的脱敏引用。
