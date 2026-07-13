# Template Slots

## `data-section="key-takeaway"`

- `text.global.reportTitle`：报告主标题。
- `text.global.reportDate`：报告时间范围和生成日期。
- `text.takeaway.title`：核心摘要模块标题。
- `text.takeaway.summary`：全局业务总结。
- `kpi.mainRevenue.name`、`kpi.mainRevenue.value`、`kpi.mainRevenue.trend`：季度总营收 KPI。
- `kpi.activeUsers.name`、`kpi.activeUsers.value`、`kpi.activeUsers.trend`：月均活跃用户 KPI。
- `kpi.conversionRate.name`、`kpi.conversionRate.value`、`kpi.conversionRate.trend`：核心转化率 KPI。
- `kpi.npsScore.name`、`kpi.npsScore.value`、`kpi.npsScore.trend`：客户净推荐值 KPI。

## `data-section="core-finding-1"`

- `text.finding1.title`：发现一标题。
- `text.finding1.analysis`：趋势与构成分析说明。
- 图表：`chart-trend-line`，`line`，月度营收趋势。
- 图表：`chart-mix-stackbar`，`stacked-bar`，产品线营收构成。
- 图表：`chart-user-area`，`area`，平台活跃用户趋势。

## `data-section="core-finding-2"`

- `text.finding2.title`：发现二标题。
- `text.finding2.analysis`：客户分层与地域贡献说明。
- 图表：`chart-segment-donut`，`donut`，客户类型分布。
- 图表：`chart-region-bar-h`，`bar-horizontal`，大区业绩贡献排行。
- 图表：`chart-scatter-ltv`，`scatter`，使用频次与 LTV 相关分析。

## `data-section="core-finding-3"`

- `text.finding3.title`：发现三标题。
- `text.finding3.analysis`：销售效率与团队效能说明。
- 图表：`chart-funnel-sales`，`funnel`，关键销售节点转化漏斗。
- 图表：`chart-radar-perf`，`radar`，核心战区综合能力评估。
- 图表：`chart-profit-waterfall`，`waterfall`，本季净利润拆解过程。

## 数据注入说明

- 文本替换：查找 `data-slot` 或 `data-editable="true"`。
- KPI 替换：查找 `data-chart-type="kpi"` 下的 `name`、`value`、`trend` 槽位。
- 图表替换：当前 HTML 使用 ECharts `setOption` 内联样例数据；如接入 Excel/CSV 解析，建议只替换对应图表的 `series`、`xAxis.data`、`yAxis.data` 或 `dataset`。
- 模块隐藏：未提供模块数据时，可隐藏对应 `[data-section]`。
