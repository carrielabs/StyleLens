# VoltFlow 精益赛博 SaaS 官网模板设计标准

## 核心定位

本模板定位为 Lean Cyber-Analytics 风格的 SaaS 官网，服务于开发者工具、内容自动化、数据监控和高科技产品营销页。

## 视觉原则

1. 主背景使用极暗森林色：`#070A08`。
2. 全站使用 40px 网格线：`#111813`。
3. 卡片背景使用暗绿色：`#0D120F`。
4. 卡片边框使用极细线：`#18221B`。
5. 核心行动色使用荧光绿：`#7CFF44`。
6. 痛点模块使用暗红底和警示红文字，避免和正向转化色混用。
7. 正文使用灰绿色：`#889E8D`，弱信息使用 `#3E5244`。

## 字体规则

1. 主字体：`Inter, PingFang SC, Microsoft YaHei, sans-serif`。
2. 代码、大数字和指标：`JetBrains Mono, ui-monospace, SFMono-Regular, monospace`。
3. Hero 标题保持大字号、强字重、短行距。
4. 模块标题配合等宽小字标签。

## 模块特征

1. `header`：顶部导航、版本号、ROI 入口和部署 CTA。
2. `hero`：利益前置主标题、双按钮和三项背书指标。
3. `live-preview`：三类数据源切换与 SVG 曲线演示。
4. `problem`：三张暗红痛点诊断卡。
5. `features`：四列技术能力矩阵。
6. `architecture`：四步系统生命管线。
7. `calculator`：ROI 投资回报模拟器。
8. `proof`：留存矩阵和客户引言。
9. `pricing`：月付/年付切换定价。
10. `cta`：最终行动召唤。
11. `footer`：品牌说明、社媒入口和友情链接。

## 入库调整

1. 补齐所有 `data-editable="true"` 节点的 `data-slot`。
2. 修正原始文件中的 `rounded.md` 为 `rounded-md`。
3. 保留模板原生交互，但生成页存在 AHP 运行时时，页面内编辑交给统一编辑器接管。
