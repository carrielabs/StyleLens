# dashboard-17-dark-enterprise-analytics

类型：数据报告 Dashboard 模板

编号：17

风格：Dark Enterprise Analytics / 深色企业级数据分析

模板名：Dark Enterprise Analytics 高管业务效能洞察 Dashboard

适合：高管经营复盘、年度业务报告、季度业务报告、核心系统状态监控、业务效能分析。

说明：本模板来自用户提供的 `dashboard.html` 和同内容粘贴附件。入库版保留 Gemini 原始视觉方向，按仓库统一结构补齐 `template.json`、槽位说明、设计规范、预览说明和模板索引注册。

交付检查：

- HTML：32 个可编辑节点均包含 `data-editable="true"`、`contenteditable="true"`、`data-slot` 和 `data-key`。
- 图表：12 个 `data-chart-type` 模块，使用 ECharts 和一个 HTML 排行模块。
- 模块：4 个 `data-section`，结构为 `key-takeaway`、`finding-1`、`finding-2`、`finding-3`。
- 原始文件：已归档到 `originals/source-template.html` 和 `originals/pasted-text.html`。
- 标准修正：入库版统一了 ECharts tooltip 深色样式。

注意：Gemini 原始配置声明 `chartModules: 13`，但 HTML 实际只有 12 个图表/数据模块；入库元数据已按实际数量记录为 12。

当前限制：未生成 `preview.png`。本轮按低性能模式执行，未打开浏览器、未截图、未启动 dev server。
