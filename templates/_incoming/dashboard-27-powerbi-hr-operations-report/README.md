# dashboard-27-powerbi-hr-operations-report

类型：Dashboard 数据报告模板

编号：27

名称：PowerBI HR Operations Report 人力资源经营分析复盘看板

适合：人力资源年度经营复盘、员工结构分析、招聘转化分析、薪酬分布诊断、留存流失复盘、组织效能分析。

说明：本模板来自用户提供的 Gemini 单文件 HTML、设计规范、槽位说明和配置 JSON。入库版保留原始 ECharts 页面结构，并按项目标准补齐 `template.json`、`template-slots.md`、`design-standard.md`、`README.md`、`preview-metadata.md` 和注册入口。

交付检查：

- HTML：完整单页 Dashboard，可直接浏览器打开；包含 `data-section`、`data-slot`、`data-key`、`data-editable="true"`、`contenteditable="true"` 和 `chart-*` 图表容器。
- 槽位：实际 7 个可编辑文字槽位，无重复；和用户提供的槽位列表一致。
- 图表：实际 12 个 ECharts 容器，覆盖 Bar、Waffle/Heatmap、Funnel、Radar、Doughnut、Scatter、Sparkline、Combo-Line-Bar、HorizontalBar、Waterfall、Heatmap。
- 配置 JSON：原始 ID 为 `power-bi-hr-analysis-template`，入库版规范化为 `dashboard-27-powerbi-hr-operations-report`。
- 标准符合度：视觉、色彩、卡片圆角、轻阴影、页签 resize、切换视图 resize 基本符合用户提供的 Power BI 商务精简版规范。
- 限制：原始槽位说明写“5 个主要内容区”，但实际列出并交付 8 个 `data-section`；入库版按实际 8 个登记。

当前限制：未生成 `preview.png`。本轮按低性能模式执行，未打开浏览器、未截图、未启动 dev server。
