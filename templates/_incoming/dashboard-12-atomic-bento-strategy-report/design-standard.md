# Design Standard

## 模板定位

面向战略复盘、经营分析和高管汇报的原子化 Bento 数据报告模板。页面由独立卡片组成，核心特点是可拖拽、可编辑、结构扁平。

## 核心设计理念

- 原子化便当盒：观点、指标、图表都是平级 Atomic Cards。
- 动态拼图排版：`#sortable-container` 使用 `grid-cols-12` 和 `grid-flow-dense`。
- 拖拽与编辑分离：拖拽只绑定 `.drag-handle`，正文继续使用 `contenteditable`。

## 色彩规范

- 页面背景：`#1a1a1a`
- 卡片背景：`#2a2a2a`
- 主文本：`#ffffff`
- 次文本：`#9ca3af`
- 强调绿：`#c7e54c`
- 对比蓝：`#425ab8`
- 深色：`#111111`

## 组件规范

- 所有可拖拽模块必须是 `#sortable-container` 的直接子元素。
- 每个直接子元素必须有 `data-section`。
- 可编辑文本必须同时具备 `data-editable="true"`、`contenteditable="true"` 和 `data-slot`。
- Chart.js 图表使用 `canvas id="chart-*"`。
- HTML/CSS 图表也必须提供 `id="chart-*"` 挂载节点。

## 入库修正

- 删除源文件中的左侧 sidebar 外壳。
- 保留顶部 header 为固定信息，不参与拖拽。
- 为客户留存热力图补充 `id="chart-cohort"`。
- 为市场渗透率进度图补充 `id="chart-penetration"`。

