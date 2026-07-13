# 原始槽位说明归档

来源：用户粘贴的 Gemini《数字化交易大屏：内容插槽与数据对接指南》。

核心要求：

- 内容模块：`key-takeaway`、`core-finding-1`、`core-finding-2`、`core-finding-3`。
- 推荐文本槽：`text.brand_title`、`text.brand_sub`、`text.insight_1_desc`、`text.insight_2_desc`、`text.insight_3_desc`、`text.finding_1_title`、`text.finding_1_desc`、`text.finding_2_title`、`text.finding_2_desc`、`text.finding_3_title`、`text.finding_3_desc`。
- 原始说明声称包含 12 个核心图表卡片区。
- 原始说明列出的图表类型包括：`kpi`、`funnel`、`radar`、`line`、`area` 等。
- 数据注入要求：保持 `chart-*` ID 稳定；文本使用 `data-editable="true"`、`contenteditable="true"`、`data-key`。

入库核对结论：

- HTML 原件没有提供这些数据标记，入库版已补齐。
- HTML 原件实际只有 10 个图表/数据模块，未交付漏斗、雷达、瀑布、排行等模块。
