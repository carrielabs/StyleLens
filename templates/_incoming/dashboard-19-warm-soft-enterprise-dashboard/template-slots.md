# Template Slots

## `data-section="key-takeaway"`

- `text.report_title`：报告主标题。
- `text.takeaway_desc`：管理层核心摘要正文。
- `text.kpi_1_title`、`text.kpi_1_value`、`text.kpi_1_trend`：总营收表现 KPI。
- `text.kpi_2_title`、`text.kpi_2_value`、`text.kpi_2_trend`：活跃客户规模 KPI。
- `text.kpi_3_title`、`text.kpi_3_value`、`text.kpi_3_trend`：核心转化率 KPI。
- `text.kpi_4_title`、`text.kpi_4_value`、`text.kpi_4_trend`：平均获客成本 KPI。

## `data-section="core-finding-1"`

- `text.finding_1_title`：发现一标题。
- `text.finding_1_desc`：发现一说明。
- `text.chart_title_trend`：趋势面积图标题。
- `text.chart_title_mix`：环形图标题。
- 图表：`chart-trend-area`，`area`，主营业务增长趋势。
- 图表：`chart-mix-donut`，`donut`，获客渠道营收占比。

## `data-section="core-finding-2"`

- `text.finding_2_title`：发现二标题。
- `text.finding_2_desc`：发现二说明。
- `text.chart_title_rank`：横向条形图标题。
- `text.chart_title_funnel`：漏斗图标题。
- 图表：`chart-rank-bar`，`horizontal-bar`，经营大区达标排名。
- 图表：`chart-funnel`，`funnel`，用户生命周期转化漏斗。

## `data-section="core-finding-3"`

- `text.finding_3_title`：发现三标题。
- `text.finding_3_desc`：发现三说明。
- `text.chart_title_radar`：雷达图标题。
- `text.chart_title_scatter`：散点图标题。
- `text.chart_title_stack`：堆叠柱状图标题。
- 图表：`chart-radar`，`radar`，产品线健康度诊断。
- 图表：`chart-scatter`，`scatter`，客单价与购买频次分布。
- 图表：`chart-stack-bar`，`stacked-bar`，产品系列营收结构。

## 数据注入说明

- 文本替换：查找 `data-slot` 或 `data-editable="true"`。
- KPI 替换：查找 `chart-kpi-1` 到 `chart-kpi-4` 下的标题、数值、趋势槽位。
- 图表替换：当前 HTML 使用 ECharts `setOption` 内联样例数据；接入 Excel/CSV 时只替换对应图表的 `series`、`xAxis.data`、`yAxis.data` 或 `dataset`。
- 模块隐藏：未提供模块数据时，可隐藏对应 `[data-section]`。
