# dashboard-25-space-cyber-charging-safety-dashboard

类型：Dashboard 数据大屏模板

编号：25

名称：Space Cyber Charging Safety Dashboard 深空赛博充电安全监管看板

适合：电动自行车充电安全监管、物联网实时监控、社区网格治理、智能硬件运维、企业安全资产看板。

说明：本模板来自用户提供的 Gemini 单文件 HTML、设计规范、槽位说明和配置 JSON。入库版保留原始 ECharts 大屏结构，并按项目标准补齐 `template.json`、`template-slots.md`、`design-standard.md`、`README.md`、`preview-metadata.md` 和注册入口。

交付检查：

- HTML：完整单页，可直接浏览器打开；包含 `data-section`、`data-slot`、`data-editable="true"`、`contenteditable="true"` 和 `chart-*` 图表容器。
- 槽位：原始 HTML 实际 9 个文本槽位；槽位说明提到但 HTML 缺失的 `text.finding2Title`、`text.alarmTime` 已补齐，入库版共 11 个可编辑槽位。
- 图表：实际 8 个 ECharts 图表模块，覆盖环形图、柱状图、面积折线图、漏斗图、雷达图、热力图、散点图和瀑布图。
- 配置 JSON：原始配置 ID 为 `electric-bike-charging-safety-dashboard`，入库版规范化为 `dashboard-25-space-cyber-charging-safety-dashboard`。
- 标准符合度：整体符合深空蓝、霓虹青、火警红、安全绿的大屏风格；主要折线、柱状、Tooltip 和分割线符合规范。
- 已修正：原始 HTML 中 FontAwesome CSS 被写成 `<script>` 标签，入库版改为标准 `<link rel="stylesheet">`。

当前限制：未生成 `preview.png`。本轮按低性能模式执行，未打开浏览器、未截图、未启动 dev server。
