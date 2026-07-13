# 数字化交易大屏：内容插槽与数据对接规范

## 1. 实际可编辑文本槽位

| data-section | data-slot / data-key | 说明 |
| :--- | :--- | :--- |
| key-takeaway | `text.brand_title` | 顶部品牌标题 |
| key-takeaway | `text.brand_sub` | 顶部副标题 |
| key-takeaway | `text.insight_1_title` | 洞察 1 标题 |
| key-takeaway | `text.insight_1_desc` | 洞察 1 描述 |
| key-takeaway | `text.insight_2_title` | 洞察 2 标题 |
| key-takeaway | `text.insight_2_desc` | 洞察 2 描述 |
| key-takeaway | `text.insight_3_title` | 洞察 3 标题 |
| key-takeaway | `text.insight_3_desc` | 洞察 3 描述 |
| core-finding-1 | `text.finding_1_title` | 流量热力模块标题 |
| core-finding-1 | `text.finding_1_desc` | 流量热力模块描述 |
| core-finding-2 | `text.finding_2_title` | 时间趋势模块标题 |
| core-finding-2 | `text.finding_2_desc` | 时间趋势模块描述 |
| core-finding-3 | `text.finding_3_title` | 渠道绩效模块标题 |
| core-finding-3 | `text.finding_3_desc` | 渠道绩效模块描述 |

## 2. 实际图表模块映射

| 图表 ID | data-section | data-chart-type | 说明 |
| :--- | :--- | :--- | :--- |
| `chart-net-revenue-kpi` | key-takeaway | `kpi` | 总交易净额 |
| `chart-transaction-volume-kpi` | key-takeaway | `kpi` | 事务处理总量 |
| `chart-promo-revenue-kpi` | key-takeaway | `kpi` | 广告投放总收益 |
| `chart-edge-availability-kpi` | key-takeaway | `kpi` | 全球节点可用性 |
| `chart-traffic-heatmap` | core-finding-1 | `heatmap` | 流量热力点阵 |
| `chart-channel-nested-ring` | core-finding-1 | `ring` | 多维嵌套圆环 |
| `chart-time-range-wave` | core-finding-2 | `column` | 时间区间波形柱 |
| `chart-annual-trend-area` | core-finding-2 | `area` | 年度趋势面积折线 |
| `chart-channel-capsule-comparison` | core-finding-3 | `capsule-bar` | 渠道胶囊对比 |
| `chart-edge-latency-status` | core-finding-3 | `latency` | 边缘节点延迟状态 |

## 3. 与 Gemini 槽位说明的差异

- 原始槽位说明写有 12 个核心图表卡片区，但 HTML 实际只有 10 个图表/数据模块。
- 原始说明包含 `funnel`、`radar`、`waterfall`、`ranking`、`stacked-column` 等图表类型，HTML 未交付对应容器。
- 原始 HTML 没有 `data-section`、`data-slot`、`data-key`、`data-chart-type` 标记；入库版已按实际 DOM 补齐。
- 原始 HTML 未接入二维矩阵 JSON 注入逻辑；当前只提供稳定 ID 和槽位，后续注入程序可按这些 ID 定位。
