# Template Slots

## `data-section="key-takeaway"`

- `text.key_takeaway.title`：报告主标题。
- `text.key_takeaway.summary`：核心分析摘要。
- `kpi-collection`：`kpi_grid`，8 个核心指标卡片。

## `data-section="core-finding-1"`

- `text.core_finding_1.traffic_source_title`：流量来源结构标题。
- 图表：`chart-traffic-source`，`donut`，观众流量来源占比。
- `text.core_finding_1.traffic_trend_title`：场观趋势标题。
- 图表：`chart-traffic-trend`，`area`，场观人数波动趋势。

## `data-section="core-finding-2"`

- `text.core_finding_2.title`：互动与转化模块标题。
- 图表：`chart-comprehensive-trend`，`line`，综合流量趋势与阶段指标。
- 图表：`chart-conversion-funnel`，`funnel`，核心链路转化漏斗。
- 图表：`chart-click-distribution`，`bar_horizontal`，点击分布。

## `data-section="core-finding-3"`

- `text.core_finding_3.title`：人群画像模块标题。
- 图表：`chart-user-demographics`，`bar_stacked`，用户画像结构。
- 图表：`chart-user-persona`，`radar`，用户标签雷达图。
- 图表：`ranking-interaction-dimensions`，`ranking`，高频交互维度排行。

## 数据注入说明

- 文本替换：查找 `data-slot` 或 `data-editable="true"`。
- 图表替换：查找同一节点上的 `id` 和 `data-chart-type`。
- KPI 替换：查找 `#kpi-collection`，按卡片顺序替换 label、value、unit、subLabel。
- 排行替换：查找 `#ranking-interaction-dimensions`。
- 模块隐藏：无数据时可隐藏对应 `[data-section]`；`core-finding-1` 在当前 HTML 中有两个同名 section，可按单个节点分别隐藏。
