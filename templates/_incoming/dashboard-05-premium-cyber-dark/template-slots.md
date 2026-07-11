# Template Slots

## `data-section="report-header"`

- `report-title`：报告分析主体名称。
- `report-meta-type`：分析性质分类标签。
- `report-date-range`：时间跨度范围。
- `grand-kpi-1-val` 至 `grand-kpi-4-val`：顶部巨型核心指标。
- `grand-kpi-1-label` 至 `grand-kpi-4-label`：顶部核心指标名称。

## `data-section="activity-heatmap"`

- `heatmap-grid`：7x53 周期活跃度热力图容器。
- 热力图格子：由原生 JS 生成，带 `data-value` 和 `data-level`。
- 低频/高频图例、最热单日说明和洞察文案均可编辑。

## `data-section="key-metrics"`

八张核心指标卡片，每张卡片包含：

- 指标名称。
- 主数值。
- 单位。
- 辅助说明文字。

适合映射日均值、峰值、最活跃时段、周期性高峰、周末占比、连续活跃、活跃率等 Excel 字段。

## `data-section="initiative-trend"`

- 主动性总结大字。
- 双主体数值 PK。
- 主动性趋势 SVG 折线和渐变面积。
- 趋势解释文字。

## `data-section="behavioral-profiling"`

四张行为对比卡片：

- 话题终结者。
- 破冰达人。
- 平均响应时延。
- 追问倾向或未回连发。

## `data-section="message-profiles"`

- 文本长度分布卡片。
- 消息类型环形图。
- 24 小时活跃柱状图。

## `data-section="topic-profile"`

- Top 5 核心词标签。
- 词汇丰富度。
- 聊天/文本风格归纳。
- 词云 SVG 文本群。

## `data-section="radar-profile"`

- 双主体高频口头禅对比。
- 语言气质与标点性格。
- 多维行为雷达 SVG 图。

## `data-section="executive-summary"`

- 核心洞察。
- 话题演变。
- 建议改进。

## `data-section="footer-status"`

- 模板来源。
- 数据引擎版本或状态说明。
