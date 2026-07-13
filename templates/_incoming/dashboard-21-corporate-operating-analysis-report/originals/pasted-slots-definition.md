# 模板插槽与数据注入指南

## 文本插槽

所有可编辑文本元素应标记 `contenteditable="true"`、`data-editable="true"`，并具有唯一 `data-slot` 和 `data-key`。

- `text.header.title`：报告主标题。
- `text.header.subtitle`：报告副标题或元数据。
- `text.takeaway.title`：核心结论板块标题。
- `text.takeaway.desc`：核心结论摘要。
- `text.finding1.title`：发现 1 标题。
- `text.finding1.desc`：发现 1 结论详述。
- `text.finding2.title`：发现 2 标题。
- `text.finding2.desc`：发现 2 结论详述。
- `text.finding3.title`：发现 3 标题。
- `text.finding3.desc`：发现 3 结论详述。

## 图表插槽

图表容器通过稳定 `id` 和 `data-chart-type` 标记。注入前应清洗空值、错误值、货币符号、千分位和百分比格式。时间轴建议统一为 `YYYY-MM-DD` 或 `YYYY-MM`。

缺少数据时，不应保留空图表；应隐藏图表容器或显示“暂无相关数据”。

## 当前 HTML 差异

当前 Gemini HTML 未实现 `finding3`，且图表模块与原始 JSON 配置不完全一致。入库后以仓库 `template.json` 为准。
