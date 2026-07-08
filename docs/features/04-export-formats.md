# 04 · 导出格式

## 五种导出格式（立项文档规划了四种，实际多了一种）

`lib/exporters/` 目录下有五个导出器：

| 文件 | 格式 | 立项文档是否提到 |
|---|---|---|
| `promptExporter.ts` | 风格 Prompt（喂给 AI 用） | ✅ |
| `markdownExporter.ts` | Markdown 风格描述 | ✅ |
| `cssExporter.ts` | CSS Variables | ✅ |
| `jsonExporter.ts` | Design Token JSON | ✅ |
| `tailwindExporter.ts` | **Tailwind 配置格式** | ❌ 立项文档完全没提到 |

`tailwindExporter.ts` 的存在说明产品在导出目标上做了扩展——原本立项文档设想的用户是"Vanilla CSS + CSS Variables"取向的开发者，但实际支持了 Tailwind 用户直接拿到可用的 Tailwind 配置，覆盖面比最初设计更广。

## 导出内容的具体格式规范

四种原有格式（Prompt/Markdown/CSS/JSON）的具体产物示例，立项文档 `PRD_StyleExtractor.md` 第 3.3.5 节写得很详细（包含完整的示例代码块），本文档不重复摘抄，这部分立项文档内容目前看仍然基本适用，直接参考即可。Tailwind 导出格式的具体产物规范建议由开发者补充一份类似的示例，纳入未来的文档更新。

## 待确认

- `tailwindExporter.ts` 产出的具体格式版本（Tailwind v3 config 还是 v4 的 CSS-first 配置方式），未在本次审查中确认，两者写法差异较大，建议明确标注。
