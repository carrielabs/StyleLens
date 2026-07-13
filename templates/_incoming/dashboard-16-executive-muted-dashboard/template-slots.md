# Template Slots

## 结构概览

模板包含 4 个核心内容区：

- `data-section="key-takeaway"`：核心结论摘要区。
- `data-section="core-finding-1"`：宏观趋势与核心指标。
- `data-section="core-finding-2"`：维度分解。
- `data-section="core-finding-3"`：深度洞察与分布。

## 文本槽位

- `text.dashboard.title`：全局标题。
- `text.dashboard.subtitle`：更新时间、区域或报告周期。
- `text.takeaway.title`：Key Takeaway 标题。
- `text.takeaway.content`：Key Takeaway 核心洞察。
- `text.finding1.title`：宏观趋势区标题。
- `text.finding2.title`：维度分解区标题。
- `text.finding3.title`：深度洞察区标题。
- `text.kpi1.title` / `text.kpi1.value`：KPI 1 标题和值。
- `text.kpi2.title` / `text.kpi2.value`：KPI 2 标题和值。
- `text.kpi3.title` / `text.kpi3.value`：KPI 3 标题和值。
- `text.chart.trend.title`：主趋势图标题。
- `text.chart.bar1.title`：客户类型横向条形图标题。
- `text.chart.bar2.title`：区域市场横向条形图标题。
- `text.chart.bar3.title`：产品线堆积条形图标题。
- `text.chart.donut.title`：环形图标题。
- `text.chart.radar.title`：雷达图标题。
- `text.chart.scatter.title`：散点图标题。

## 图表挂载点

- `chart-kpi-1`：`kpi-sparkline`
- `chart-kpi-2`：`kpi-sparkline`
- `chart-kpi-3`：`kpi-sparkline`
- `chart-main-trend`：`area`
- `chart-bar-account`：`bar-horizontal`
- `chart-bar-region`：`bar-horizontal`
- `chart-bar-product`：`bar-stacked-horizontal`
- `chart-donut-distribution`：`donut`
- `chart-radar-performance`：`radar`
- `chart-scatter-correlation`：`scatter`

## 数据注入说明

- 文本替换：查找 `data-editable="true"` 或对应 `data-slot`。
- 图表替换：修改底部 ECharts option 中的 `series.data`、`xAxis.data`、`yAxis.data`。
- 缺失数据：使用 `null` 表示断点，不把缺失值补成 `0`。
- 空模块：图表无数据时建议隐藏整个模块，文本为空时建议折叠对应文本区域。
