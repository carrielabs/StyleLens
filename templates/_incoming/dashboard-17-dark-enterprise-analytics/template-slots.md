# Template Slots Guide

## 1. 内容模块

页面遵循 Key Takeaway + 3 个 Core Finding 结构：

- `data-section="key-takeaway"`：核心总结区和全局 KPI
- `data-section="finding-1"`：趋势与区域贡献分析
- `data-section="finding-2"`：结构、漏斗和成本拆解
- `data-section="finding-3"`：多维特征、分布和风险排行

## 2. 文本插槽

所有可编辑文本必须包含：

- `data-editable="true"`
- `contenteditable="true"`
- `data-slot="xxx"`
- `data-key="xxx"`

当前模板共有 32 个文本插槽：

- `text.report_title`
- `text.report_subtitle`
- `text.kpi_1_label`
- `text.kpi_1_value`
- `text.kpi_2_label`
- `text.kpi_2_value`
- `text.kpi_3_label`
- `text.kpi_3_value`
- `text.kpi_4_label`
- `text.kpi_4_value`
- `text.finding_1_title`
- `text.chart_1_title`
- `text.chart_2_title`
- `text.chart_2_desc`
- `text.finding_2_title`
- `text.chart_3_title`
- `text.chart_4_title`
- `text.chart_5_title`
- `text.finding_3_title`
- `text.chart_6_title`
- `text.chart_7_title`
- `text.chart_8_title`
- `text.rank_1_name`
- `text.rank_1_val`
- `text.rank_2_name`
- `text.rank_2_val`
- `text.rank_3_name`
- `text.rank_3_val`
- `text.rank_4_name`
- `text.rank_4_val`
- `text.rank_5_name`
- `text.rank_5_val`

## 3. 图表模块

当前模板共有 12 个 `data-chart-type` 模块：

- `kpi-main-revenue`：`kpi`
- `kpi-main-users`：`kpi`
- `kpi-main-cost`：`kpi`
- `kpi-main-efficiency`：`kpi`
- `chart-revenue-trend`：`area`
- `chart-region-bar`：`horizontal-bar`
- `chart-product-donut`：`donut`
- `chart-conversion-funnel`：`funnel`
- `chart-cost-stacked`：`stacked-bar`
- `chart-user-radar`：`radar`
- `chart-value-scatter`：`scatter`
- `ranking-list-module`：`ranking`

## 4. 数据注入建议

- 单维趋势：适合日期/类别 + 数值结构。
- 占比结构：适合分类名称 + 数值结构。
- 多维对比：适合透视表结构。
- 散点分布：适合 X 值、Y 值、分类标识和可选气泡大小。
- 排行模块：适合名称 + 指标值结构。

## 5. 缺失处理

原始 HTML 未内置 `null` 数据时的“暂无数据”渲染逻辑。后续接入解析引擎时，建议在数据注入层处理：

- 图表数据为空：渲染“暂无数据”或隐藏对应图表节点。
- 模块数据为空：按 `data-section` 隐藏整个模块。
