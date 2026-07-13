# Template Slots

## `data-section="key_takeaway"`

- `text.report_title`：报告主标题。
- `text.key_takeaway_summary`：关键结论摘要，建议 50 - 100 字。
- `kpi.revenue.label`、`kpi.revenue.value`、`kpi.revenue.trend`：年度总营收 KPI。
- `kpi.profit.label`、`kpi.profit.value`、`kpi.profit.trend`：净利润 KPI。
- `kpi.efficiency.label`、`kpi.efficiency.value`、`kpi.efficiency.trend`：运营费用率 KPI。
- 图表：`chart-kpi-revenue`、`chart-kpi-profit`、`chart-kpi-efficiency`，类型为 `kpi_card`。

## `data-section="core_finding_1"`

- `text.finding_1_title`：核心发现 1 标题。
- `text.finding_1_analysis`：运营效率与成本结构分析，建议 100 - 150 字。
- 图表：`chart-finding-1-trend`，类型为 `mixed_chart`，展示季度营收与毛利率趋势。
- 图表：`chart-finding-1-waterfall`，类型为 `waterfall_chart`，展示年度净利润变动因素。

## `data-section="core_finding_2"`

- `text.finding_2_title`：核心发现 2 标题。
- `text.finding_2_analysis`：市场份额与增长来源分析，建议 100 - 150 字。
- `donut.center.val`、`donut.center.lbl`：环形图中心汇总数字与说明。
- 图表：`chart-finding-2-donut`，类型为 `donut_chart`，展示产品线营收贡献。
- 图表：`chart-finding-2-rank`，类型为 `bar_chart_vertical`，展示区域市场份额排名。
- 图表：`chart-finding-2-growth`，类型为 `area_chart`，展示产品营收增长趋势。

## `data-section="core_finding_3"`

- `text.finding_3_title`：核心发现 3 标题。
- `text.finding_3_analysis`：能力评估、风险预警与未来展望，建议 100 - 150 字。
- 图表：`chart-finding-3-radar`，类型为 `radar_chart`，展示多维能力评估。
- 图表：`chart-finding-3-scatter`，类型为 `scatter_chart`，展示区域投入产出效率。

## 数据注入说明

- 文本替换：优先查找 `data-key`，没有 `data-key` 时查找 `data-slot`。
- KPI 替换：查找 `chart-kpi-*` 卡片内部的 `data-slot`。
- 图表替换：查找底部 `new Chart(...)` 配置，替换 `labels`、`datasets` 和 `data`。
- 模块隐藏：无数据时可隐藏对应 `[data-section]` 或 `.chart-module`。
