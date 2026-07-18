# 04 · 导出格式

## 五种导出格式（立项文档规划了四种，实际多了一种）

`lib/exporters/` 目录下有五个导出器：

| 文件 | 格式 | 立项文档是否提到 |
|---|---|---|
| `promptExporter.ts` | 风格 Prompt（喂给 AI 用） | ✅ |
| `markdownExporter.ts` | Markdown 风格描述 | ✅ |
| `cssExporter.ts` | CSS Variables | ✅ |
| `jsonExporter.ts` | DTCG-shaped Design Token JSON | ✅ |
| `tailwindExporter.ts` | **Tailwind 配置格式** | ❌ 立项文档完全没提到 |

`tailwindExporter.ts` 的存在说明产品在导出目标上做了扩展——原本立项文档设想的用户是"Vanilla CSS + CSS Variables"取向的开发者，但实际支持了 Tailwind 用户直接拿到可用的 Tailwind 配置，覆盖面比最初设计更广。

## 当前导出质量门

2026-07 的导出升级后，Prompt / CSS / JSON 不再只输出“看起来像”的风格描述，而是必须满足以下硬标准：

1. Prompt 不能出现“未提取，靠视觉匹配”这类弱占位。
2. Prompt 必须包含 `Taste DNA` 和 `Evidence Basis`，说明风格为什么成立，以及证据来自哪里。
3. CSS 必须在有 DOM 实测时输出组件级 token，例如按钮、输入框、卡片的 padding。
4. JSON 必须使用 DTCG 常见结构：`$schema`、`$value`、`$type`、`$description`、`$extensions`。
5. JSON 里的圆角、间距按 `dimension` 类型输出，证据摘要放在 `$extensions.stylelens.evidence`。

成熟技术依据：

- DTCG Design Tokens Format：使用 `$value`、`$type`、`$description`、`$extensions` 组织设计 token。
- Style Dictionary：可基于设计 token 转换成 CSS、JS 等多端格式。
- Project Wallace / Dembrandt 类工具：证明“提取样式 token + 做质量审计”是成熟方向。

## 待确认

- `tailwindExporter.ts` 产出的具体格式版本（Tailwind v3 config 还是 v4 的 CSS-first 配置方式），未在本次审查中确认，两者写法差异较大，建议明确标注。
