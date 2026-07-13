# dashboard-18-enterprise-green-analytics-report

类型：Dashboard 数据分析报告模板

编号：18

名称：Enterprise Green Analytics 企业级绿调数据分析报告看板

适合：管理层经营汇报、季度经营分析、项目复盘、产品数据追踪、多维业务分析。

说明：本模板来自用户提供的 `html.html`、设计规范、槽位与数据注入指南、配置 JSON。入库版保留 Gemini 原始 HTML 和 ECharts 配置，并按仓库模板规范补齐配置、槽位、设计标准和预览说明。

交付检查：

- HTML：基本符合入库标准。22 个可编辑节点均包含 `data-editable="true"`、`contenteditable="true"` 和 `data-slot`；9 个 ECharts 容器均符合 `chart-*` 命名；4 个核心模块均包含 `data-section`。
- 设计规范：可用，和实际浅色企业绿视觉方向一致。
- 槽位说明：可用，但“dataset 驱动”与当前 HTML 的直接 `setOption` 实现不完全一致，已在配置审计中标记。
- 配置 JSON：原始 `id` 已规范化为仓库编号 `dashboard-18-enterprise-green-analytics-report`，模板名称同步规范化。

当前限制：未生成 `preview.png`。本轮按低性能模式执行，未打开浏览器、未截图、未启动 dev server。
