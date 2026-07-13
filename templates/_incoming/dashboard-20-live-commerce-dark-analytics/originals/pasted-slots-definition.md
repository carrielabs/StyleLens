# Dashboard 模板插槽与模块使用说明

## 1. 内容模块定义

- `data-section="key-takeaway"`：顶部核心结论。
- `data-section="core-finding-1"`：流量与漏斗（发现 1）。
- `data-section="core-finding-2"`：互动与转化（发现 2）。
- `data-section="core-finding-3"`：人群与留存（发现 3）。

## 2. 文本插槽

可通过 `data-slot` 唯一定位并替换文本内容。

结构：`text.[section_name].[element_name]`

示例：

- `text.key_takeaway.title`
- `text.key_takeaway.summary`
- `text.core_finding_1.title`
- `text.core_finding_1.insight`

## 3. 图表模块与数据注入

每个图表容器通过 `id` 定位，并通过 `data-chart-type` 声明渲染逻辑。

图表占位缺失处理：当无数据传入时，对应图表 DOM 节点可加 `display: none` 或 `hidden`，布局自动适应剩余空间。

Excel/CSV 注入注意事项：

- 时间序列数据：第一列为时间/维度，后续列为指标。
- 结构化映射：注入工具需根据 `template.json` 中的 schema 转换为 ECharts Option。

## 4. 支持的可视化类型字典

- `kpi_grid`
- `line`
- `area`
- `bar`
- `bar_horizontal`
- `bar_stacked`
- `donut`
- `funnel`
- `radar`
- `scatter`
- `heatmap`
- `waterfall`
- `ranking`
