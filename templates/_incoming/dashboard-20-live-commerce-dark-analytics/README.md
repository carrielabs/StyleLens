# Dashboard 20 - Live Commerce Dark Analytics

## 模板名称

Live Commerce Dark Analytics 直播经营复盘数据大屏

## 文件说明

- `template.html`：入库版 HTML，已补齐标准 `id`、`data-section`、`data-chart-type` 和文本插槽。
- `template.json`：模板元数据、图表模块、插槽规则和审计结果。
- `template-slots.md`：可替换文本、KPI、图表和模块说明。
- `design-standard.md`：整理后的设计规范。
- `originals/`：Gemini 原始交付归档。

## 入库处理

- 保留原始视觉、布局、ECharts 配置和样例数据。
- 将 `core-finding-1-b` 规范为 `core-finding-1`。
- 将图表 `id` 和 `data-chart-type` 放到同一个 DOM 节点。
- 为 KPI 阵列和排行模块补充稳定 id。
- 未补画 Gemini 配置中声明但 HTML 不存在的散点图。
