# Template Slots

说明：用户提供的槽位说明包含 7 个核心模块；实际 HTML 源文件包含 10 个滚动报告区块。入库版保留实际结构，并补充 `report-header`。

## `data-section="report-header"`

- `text.header.01`：报告密级标签。
- `text.header.02`：报告主标题。
- `text.header.03`：报告摘要说明。

## `data-section="executive-summary"`

- `text.summary.01`：模块标签。
- `text.summary.02`：结论先行标题。
- `text.summary.03`：核心指标区标题。
- `text.summary.04` 到 `text.summary.12`：3 个 KPI 卡片的名称、数值和同比。
- `text.summary.13`：管理层洞察标题。
- `text.summary.14` 到 `text.summary.16`：管理层洞察 bullet。

## `data-section="market-dynamics"`

- `text.market.01`：模块标签。
- `text.market.02`：结论先行标题。
- `text.market.03`：`chart-new-equip` 标题。
- `text.market.04`：`chart-used-equip` 标题。
- `text.market.05`：渠道归因标题。
- `text.market.06` 到 `text.market.08`：渠道归因 bullet。

## `data-section="competitive-landscape"`

- `text.competition.01`：模块标签。
- `text.competition.02`：结论先行标题。
- `text.competition.03`：`chart-scatter` 标题。
- `text.competition.04`：竞争评述标题。
- `text.competition.05` 到 `text.competition.07`：竞争评述 bullet。

## `data-section="funnel-conversion"`

- `text.funnel.01`：模块标签。
- `text.funnel.02`：结论先行标题。
- `text.funnel.03`：`chart-funnel` 标题。
- `text.funnel.04`：关键断点诊断标题。
- `text.funnel.05` 到 `text.funnel.12`：诊断矩阵表头和三行说明。

## `data-section="segmentation-analysis"`

- `text.segment.01`：模块标签。
- `text.segment.02`：结论先行标题。
- `text.segment.03`：业务线健康度评估标题。
- 图表：`chart-revenue-pie`。

## `data-section="growth-trend"`

- `text.trend.01`：模块标签。
- `text.trend.02`：结论先行标题。
- 图表：`chart-trend-combo`。

## `data-section="user-demographics"`

- `text.demographics.01`：模块标签。
- `text.demographics.02`：结论先行标题。
- `text.demographics.03` 到 `text.demographics.04`：用户画像洞察 bullet。
- 图表：`chart-demographics`。

## `data-section="cost-structure"`

- `text.cost.01`：模块标签。
- `text.cost.02`：结论先行标题。
- 图表：`chart-cost-stack`。

## `data-section="cohort-retention"`

- `text.cohort.01`：模块标签。
- `text.cohort.02`：结论先行标题。

## `data-section="strategic-solutions"`

- `text.strategy.01`：模块标签。
- `text.strategy.02`：结论先行标题。
- `text.strategy.03` 到 `text.strategy.06`：行动路线图表头。
- `text.strategy.07` 到 `text.strategy.18`：三条战略动作的支柱、举措、KPI 和状态。

## 数据注入说明

- 文本替换：查找 `data-slot` 或 `data-editable="true"`。
- 图表替换：优先修改模板底部的 `const chartData = {...}`。
- 图表容器：`chart-new-equip`、`chart-used-equip`、`chart-scatter`、`chart-funnel`、`chart-revenue-pie`、`chart-trend-combo`、`chart-demographics`、`chart-cost-stack`。
