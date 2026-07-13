# 数据分析报告模板插槽说明

## 顶部核心：关键结论

定位：报告的「电梯演讲」。读者只看这一部分，也应能抓住报告最核心的 1 - 3 个亮点或风险。

- 文本插槽：`text.key_takeaway_summary`
- 建议字数：50 - 100 字
- 图表插槽区域：`section-key-takeaway-charts`
- 推荐图表：KPI 指标卡、计量图、带目标的进度条

## 核心发现 1：运营与效率分析

- 文本插槽：`text.finding_1_analysis`
- 建议字数：100 - 150 字
- 图表区域：`section-finding-1-charts`
- 插槽 A：`chart-finding-1-trend`
- 推荐类型：双轴折线柱状混合图、堆叠面积图
- 插槽 B：`chart-finding-1-composition`
- 推荐类型：堆叠横向条形图、瀑布图

## 核心发现 2：市场与竞争格局

- 文本插槽：`text.finding_2_analysis`
- 建议字数：100 - 150 字
- 图表区域：`section-finding-2-charts`
- 插槽 A：`chart-finding-2-share`
- 推荐类型：环形图
- 插槽 B：`chart-finding-2-rank`
- 推荐类型：排行榜、Top N 条形图、热力图

## 核心发现 3：风险与未来展望

- 文本插槽：`text.finding_3_analysis`
- 建议字数：100 - 150 字
- 图表区域：`section-finding-3-charts`
- 插槽 A：`chart-finding-3-capability`
- 推荐类型：雷达图
- 插槽 B：`chart-finding-3-scatter`
- 推荐类型：散点图、气泡图

## 入库差异

- 原始槽位说明中的 `chart-finding-1-composition` 在 HTML 中实际实现为 `chart-finding-1-waterfall`。
- 原始槽位说明中的 `chart-finding-2-share` 在 HTML 中实际实现为 `chart-finding-2-donut`。
- 原始槽位说明中的 `chart-finding-3-capability` 在 HTML 中实际实现为 `chart-finding-3-radar`。
