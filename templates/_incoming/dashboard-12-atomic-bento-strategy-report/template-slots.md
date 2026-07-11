# Template Slots

## 固定顶部信息

- `text.header.company`：公司名称。
- `text.header.period`：报告周期。
- `text.header.badge`：状态或季度徽标。

## 独立观点节点

- `text.insight.summary.title`：核心摘要标题。
- `text.insight.summary.highlight`：核心摘要强调语。
- `text.insight.summary.desc`：核心摘要说明。
- `text.insight.revenue.title` / `text.insight.revenue.desc`：营收观点。
- `text.insight.growth.title` / `text.insight.growth.desc`：增长观点。
- `text.insight.market.title` / `text.insight.market.desc`：市场观点。
- `text.insight.action.title` / `text.insight.action.desc`：行动计划前言。

## 独立指标节点

- `text.health.title` / `text.health.subtitle` / `text.health.value`：系统健康度卡片。
- `text.kpi.arr.label` / `text.kpi.arr.value` / `text.kpi.arr.trend`：ARR 卡片。
- `text.kpi.npm.label` / `text.kpi.npm.value` / `text.kpi.npm.trend`：NPM 卡片。
- `text.kpi.cac.label` / `text.kpi.cac.value` / `text.kpi.cac.trend`：CAC 卡片。
- `text.kpi.ltv.label` / `text.kpi.ltv.value` / `text.kpi.ltv.trend`：LTV 卡片。
- `text.action.1.title` / `text.action.1.desc` / `text.action.1.value` / `text.action.1.unit`：行动计划卡片 1。
- `text.action.2.title` / `text.action.2.desc` / `text.action.2.value` / `text.action.2.unit`：行动计划卡片 2。
- `text.action.3.title` / `text.action.3.desc` / `text.action.3.value` / `text.action.3.unit`：行动计划卡片 3。
- `text.action.4.title` / `text.action.4.desc` / `text.action.4.value` / `text.action.4.unit`：行动计划卡片 4。

## 独立图表节点

- `chart-health`：系统健康度趋势图。
- `chart-area`：营收与成本剪刀差。
- `chart-composition`：全球市场营收结构环形图。
- `chart-trend`：月度活跃用户趋势图。
- `chart-cohort`：客户留存热力图，HTML/CSS 实现。
- `chart-penetration`：核心市场渗透率进度图，HTML/CSS 实现。
- `chart-radar`：产品竞争力雷达图。

## 图表标题槽位

- `text.chart.area.title` / `text.chart.area.subtitle`
- `text.chart.composition.title` / `text.chart.composition.subtitle`
- `text.chart.trend.title` / `text.chart.trend.subtitle`
- `text.chart.cohort.title` / `text.chart.cohort.subtitle`
- `text.chart.penetration.title` / `text.chart.penetration.subtitle`
- `text.chart.radar.title` / `text.chart.radar.subtitle`

## 数据注入说明

- 文本替换：查找 `data-slot` 或 `data-editable="true"`。
- 拖拽排序：读取 `#sortable-container > [data-section]`。
- 图表替换：修改底部 Chart.js 配置；HTML 图表修改对应 `chart-cohort`、`chart-penetration` 节点内容。
- 顶部 header 固定，不参与拖拽排序。

