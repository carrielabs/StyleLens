# Template Slots

## `data-section="key-takeaway"`

- `text.header.title`：页面主标题。
- `text.header.desc`：页面说明文字。
- `text.kpi.main.title`：账单环形图卡片标题。
- `text.kpi.main.value`：账单环形图中心汇总值。
- `text.overview.title`：核心概览标题。
- 图表：`chart-main-pie`，类型为 `doughnut`，展示账单构成。
- 图表：`chart-user-stats`，类型为 `bar`，展示患者年龄或时段统计。
- 图表：`chart-wait-time`，类型为 `area`，展示候诊延迟趋势。

## `data-section="core-finding-1"`

- `text.section2.title`：核心发现 1 标题。
- `text.radar.title`：雷达图标题。
- `text.funnel.title`：漏斗图标题。
- 图表：`chart-clinical-radar`，类型为 `radar`，展示多系统健康度评估。
- 图表：`chart-diagnostic-funnel`，类型为 `funnel`，展示诊疗流程转化。

## `data-section="core-finding-2"`

- `text.section3.title`：核心发现 2 标题。
- `text.heatmap.title`：热力图标题。
- `text.scatter.title`：散点图标题。
- 图表：`chart-temporal-heatmap`，类型为 `heatmap`，展示时段患者流入。
- 图表：`chart-cost-scatter`，类型为 `scatter`，展示年龄与诊疗资费分布。

## `data-section="core-finding-3"`

- `text.section4.title`：核心发现 3 标题。
- `text.ranking.title`：科室排行图标题。
- `text.waterfall.title`：瀑布图标题。
- 图表：`chart-dept-ranking`，类型为 `horizontal-bar`，展示优势科室业绩排行。
- 图表：`chart-operational-waterfall`，类型为 `waterfall`，展示季度财务盈余变动。

## 数据注入说明

- 文本替换：优先查找 `data-key`，没有 `data-key` 时查找 `data-slot`。
- 图表替换：查找底部 ECharts 初始化函数，替换 `series.data`、`xAxis.data`、`yAxis.data` 或 `radar.indicator`。
- Tooltip 替换：保留 `commonTooltipStyle`，只替换 `formatter` 文案和字段。
- 模块隐藏：无数据时可隐藏对应 `[data-section]` 或图表所在卡片。
