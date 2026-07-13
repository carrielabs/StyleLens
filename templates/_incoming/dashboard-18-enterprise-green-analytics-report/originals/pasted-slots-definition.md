# 模板插槽与数据注入指南

## 结构模块

- `data-section="key-takeaway"`：核心结论摘要，包含文本和 KPI 卡片。
- `data-section="core-finding-1"`：核心发现一，默认配置为趋势与构成分析。
- `data-section="core-finding-2"`：核心发现二，默认配置为分布与排行分析。
- `data-section="core-finding-3"`：核心发现三，默认配置为效率与转化分析。

## 文本插槽

- `text.global.reportTitle`：报告主标题。
- `text.global.reportDate`：报告时间范围。
- `text.takeaway.title`：核心结论模块标题。
- `text.takeaway.summary`：全局业务总结。
- `text.finding1.title`：发现一标题。
- `text.finding1.analysis`：发现一分析。
- `text.finding2.title`：发现二标题。
- `text.finding2.analysis`：发现二分析。
- `text.finding3.title`：发现三标题。
- `text.finding3.analysis`：发现三分析。

## KPI 插槽

- `kpi.mainRevenue`
- `kpi.activeUsers`
- `kpi.conversionRate`
- `kpi.npsScore`

每个 KPI 包含 `name`、`value`、`trend`。

## ECharts 容器

- `chart-trend-line`：`line`，营收趋势。
- `chart-mix-stackbar`：`stacked-bar`，产品占比。
- `chart-user-area`：`area`，用户活跃度。
- `chart-segment-donut`：`donut`，客户分层。
- `chart-region-bar-h`：`bar-horizontal`，区域排行。
- `chart-scatter-ltv`：`scatter`，相关性分析。
- `chart-funnel-sales`：`funnel`，转化率。
- `chart-radar-perf`：`radar`，多维能力。
- `chart-profit-waterfall`：`waterfall`，利润拆解。
