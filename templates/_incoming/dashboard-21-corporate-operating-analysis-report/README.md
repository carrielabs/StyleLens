# dashboard-21-corporate-operating-analysis-report

类型：Dashboard 数据分析报告模板

编号：21

名称：Corporate Operating Analysis 企业经营分析报告

适合：管理层经营汇报、阶段性业务复盘、专项经营数据分析。

说明：本模板来自用户提供的 HTML、槽位与数据注入指南、配置 JSON。入库版保留 Gemini 原始 HTML，并按仓库模板规范补齐配置、槽位、设计标准和预览说明。

交付检查：

- HTML：可入库，但不完全符合用户给出的商务灰蓝设计规范。实际为暖色、大圆角、柔和卡片风。
- 槽位：8 个文本槽位完整包含 `data-editable="true"`、`contenteditable="true"`、`data-slot` 和 `data-key`；缺少规范里提到的 `finding3` 文本槽。
- 图表：实际有 10 个 `chart-*` 容器，其中 4 个 KPI 卡片和 6 个 ECharts 图表。
- 配置 JSON：原始 JSON 与 HTML 不一致，已归档到 `originals/pasted-template-config.json`；入库版 `template.json` 按实际 HTML 结构重写。

当前限制：未生成 `preview.png`。本轮按低性能模式执行，未打开浏览器、未截图、未启动 dev server。
