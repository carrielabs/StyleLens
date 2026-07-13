# dashboard-23-enterprise-teal-report

类型：Dashboard 数据分析报告模板

编号：23

名称：Enterprise Teal Report 企业级蓝绿经营分析报告

适合：企业年度经营分析、季度经营复盘、ESG 可持续发展报告、管理层战略复盘、董事会或投资者正式汇报。

说明：本模板来自用户提供的单文件 HTML、设计规范、槽位说明和配置 JSON。入库版保留 Gemini 原始 Chart.js 图表结构，并按项目标准补齐 `template.json`、`template-slots.md`、`design-standard.md`、`README.md`、`preview-metadata.md` 和注册入口。

交付检查：

- HTML：完整单页，可直接浏览器打开；已包含 `data-section`、`data-slot`、`data-editable="true"` 和 `contenteditable="true"`。
- 槽位：19 个可编辑槽位，覆盖标题、摘要、3 个 KPI、3 个核心发现和环形图中心文字。
- 图表：实际有 10 个 `chart-*` 模块，其中 3 个 KPI 卡片和 7 个 Chart.js canvas 图表。
- 配置 JSON：原始配置 ID 为 `enterprise_report_emerson_style_v1`，入库版规范化为 `dashboard-23-enterprise-teal-report`。
- 标准符合度：整体符合企业级蓝绿报告规范；原始英文/品牌文案已在入库版替换为通用中文文案。

当前限制：未生成 `preview.png`。本轮按低性能模式执行，未打开浏览器、未截图、未启动 dev server。
