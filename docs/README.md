# StyleLens Documentation

StyleLens 是一个视觉风格提取与 HTML 页面生成工具：上传一张图或粘贴一个网址，可以生成风格报告；输入文本 / Markdown / TXT 可以生成产品官网 HTML；上传 `.csv` / `.json` / `.xlsx` 可以生成 Dashboard HTML。

## 开发规则入口

开发、调试、提交、push、合并前，先读仓库根目录的 [`AGENTS.md`](../AGENTS.md)。

如果 README、docs、历史方案或聊天记录与 `AGENTS.md` 冲突，以 `AGENTS.md` 为准；用户当前最新明确指令始终最高优先级。

这份文档参考 TensorFlow 项目文档的分层方式组织：`guide/` 讲现在是什么、怎么搭的；`features/` 逐个拆解每个功能模块怎么运作；`reference/` 是查阅型的 API 与配置参考；`roadmap.md` 记录已知的文档与代码落差、待办事项。

## 和已有文档的关系

这个目录下原本已经有两份文档，是项目立项时（2026-03-20）写的 Phase 1 设计稿，本次没有删除或覆盖，仍然保留作为历史参考：

- [`PRD_StyleExtractor.md`](./PRD_StyleExtractor.md) — 最初的产品需求文档（v1.1）
- [`VISUAL_AND_TECHSTACK.md`](./VISUAL_AND_TECHSTACK.md) — 最初的视觉规范与技术选型文档（v1.0）
- [`PRD_StyleLens_AI_HTML_Publisher.md`](./PRD_StyleLens_AI_HTML_Publisher.md) — 当前 Publisher / Dashboard 需求口径
- [`superpowers/`](./superpowers/) — 后续某次功能增强（提取与报告增强）的方案与规格文档

立项文档写得很细，视觉规范（色彩/字体/间距/圆角/阴影 token）目前仍然基本适用，**但技术选型和产品范围已经和实际代码不一致**——最明显的两处：立项文档写"选 Claude 3.5 Sonnet 做 Vision 分析"，但实际代码（`lib/api/aiExtract.ts`）用的是 Google Gemini；早期 Publisher 文档写 dashboard 不进入第一版，但当前目标已经要求 8 个官网模板 + 15 个 Dashboard 模板完整支持。这类落差在下面的 `guide/` 和 `roadmap.md` 里有说明，不在这份说明里重复。

下面这套新文档基于对代码（`app/`、`lib/`、`components/`、`hooks/`、`package.json`、git 提交历史）的实际审查编写，目标是把文档拉到和当前代码一致的状态。凡是代码中没有直接证据、只能推测的地方，都标注"待确认"。

## 目录

### Guide（总览）

- [01 · 产品总览](./guide/01-product-overview.md)
- [02 · 系统架构](./guide/02-architecture.md)
- [03 · 数据模型](./guide/03-data-model.md)

### Features（功能模块）

- [01 · 提取链路（截图/上传 → 页面分析 → AI 提取）](./features/01-extraction-pipeline.md)
- [02 · 风格报告与展示层](./features/02-style-report.md)
- [03 · 历史记录、素材库与登录](./features/03-history-library-auth.md)
- [04 · 导出格式](./features/04-export-formats.md)
- [05 · 设置与 BYOK（自带 API Key）](./features/05-settings-and-byok.md)

### Reference（参考）

- [API 路由参考](./reference/api-routes.md)
- [环境变量参考](./reference/environment-variables.md)

### Archive（归档）

- `archive/` 用于历史设计稿或一次性调试产物，不作为正式源码入口。

### Roadmap

- [已知空白与待办](./roadmap.md)
