# dashboard-26-emerald-b2b-analytics-dashboard

类型：Dashboard 数据报告模板

编号：26

名称：Emerald B2B Analytics Dashboard 企业级翠绿经营分析复盘看板

适合：企业级高管经营复盘、客户行为洞察、交易频次分析、产品与业务诊断报告、Excel 数据报告可视化。

说明：本模板来自用户提供的 Gemini 单文件 HTML、设计规范、槽位说明和配置 JSON。入库版保留原始 Chart.js 页面结构，并按项目标准补齐 `template.json`、`template-slots.md`、`design-standard.md`、`README.md`、`preview-metadata.md` 和注册入口。

交付检查：

- HTML：完整单页，可直接浏览器打开；包含 `data-section`、`data-slot`、`data-key`、`data-editable="true"`、`contenteditable="true"` 和 `chart-*` 图表容器。
- 槽位：实际 12 个可编辑文字槽位，无重复；但原始槽位说明为 `text.header.title`，HTML 实际为 `text.header_title`，入库版按 HTML 实际登记。
- 图表：实际 12 个模块，覆盖 KPI、面积图、柱状图、环形图、条形进度、漏斗、散点、雷达和排行表。
- 配置 JSON：原始 ID 为 `premium-b2b-analytics-dashboard`，入库版规范化为 `dashboard-26-emerald-b2b-analytics-dashboard`。
- 标准符合度：原始交付存在轻微偏差，入库版已修正背景、卡片、圆角、错误数字格式和缺失图表 id。
- 限制：原始配置声称支持 heatmap、waterfall，但 HTML 未交付对应模块；入库版未强行新增。

当前限制：未生成 `preview.png`。本轮按低性能模式执行，未打开浏览器、未截图、未启动 dev server。
