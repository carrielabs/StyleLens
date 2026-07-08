# 02 · 风格报告与展示层

## 报告的基本构成（与立项文档一致的部分）

风格报告的核心模块和立项文档规划的一致：视觉概览、色彩系统（`ColorSystem.tsx`）、字体排版（`Typography.tsx`）、设计细节（`DesignDetails.tsx`）、导出面板（`ExportPanel.tsx`）。

## "单一来源，双视图"的展示结构

仓库根目录 `README.md` 里明确写了这条约定，本文档直接引用，因为这是理解报告展示层代码组织方式的关键：

> 报告采用"单一来源，双视图"结构：页面模式（Page mode）活在 `HomeWorkspace` 里，浮层模式（Modal mode）活在 `HomeOverlays` 里。共享的报告内容可以复用，但这两个容器不应该被合并成一个通用壳，否则会丢失 UX 细节差异。

也就是说，同一份报告数据，在首页主区域展示时（大概率是"提取后停留在当前页看结果"的场景）和在浮层里展示时（大概率是"从历史记录点开一条旧记录"的场景），是两套独立维护的展示容器，共享底层组件但不共享外层壳。这是理解 `components/home/` 和 `components/report/` 分工关系的关键前提，修改报告展示逻辑时要注意别把两个场景的代码路径搞混。

## 设计细节的多个版本：Elite / EliteV2 / EliteV3

`components/report/` 目录下同时存在 `DesignDetails.tsx`、`DesignDetailsElite.tsx`、`DesignDetailsEliteV2.tsx`、`DesignDetailsEliteV3.tsx` 四个文件。这种"同名 + 递增版本后缀"的命名方式通常说明：设计细节这个模块的展示形式被多次推翻重做，且旧版本代码没有被清理掉。哪个版本是当前实际在用的、其余版本是否可以安全删除，未在本次审查中确认——这是一处明确的技术债信号，记录到 `roadmap.md`。

## 品牌预设：不用提取就能看到的示例报告

`lib/presets/brandPresets.ts` 里硬编码了至少 6 个知名产品（Linear、Stripe、Vercel、Apple、Notion、Framer）的完整风格报告，包含真实感的色值、字体信息（如 Linear 预设里"Inter Variable，590 字重，0.5px 边框"这类具体到像素的描述）、中英双语摘要和标签。这套预设数据的用途推测是首页的"示例报告"，让新用户（尤其是未登录的游客）不需要自己上传任何内容，就能立刻看到 StyleLens 分析出来的报告长什么样，起到降低使用门槛/展示产品能力的作用。这个能力在立项文档里完全没有设计，是后续迭代加上的。

## 实验性报告增强（Feature Flag 控制，默认关闭）

`lib/flags.ts` 定义了 5 个开关，均以 `NEXT_PUBLIC_ENABLE_` 开头，默认在生产环境关闭：

- `ENABLE_DESIGN_AUDITS`
- `ENABLE_REPORT_EVIDENCE_SUMMARY`
- `ENABLE_REPORT_COVERAGE_SUMMARY`
- `ENABLE_REPORT_INTERACTION_SUMMARY`
- `ENABLE_PAGE_AUDITS`

结合 `docs/superpowers/specs/2026-04-09-stylelens-extraction-report-design.md` 里的方案文档（该文档判断"当前最大问题不是完全识别不到，而是采样覆盖不够广、报告层对已有数据消费不足"，并推荐"基础提取增强 + 报告增强并行推进"的方案 C），可以确认：这些 Flag 对应的是一批**已经在开发、但还没有对普通用户开放**的报告深度分析能力（设计一致性审查、可信度/覆盖度说明、交互态分析、页面级审查）。这是目前处于"半成品但代码已经在仓库里"状态的功能集，产品文档层面应该明确标注为"开发中"而不是完全不提。

## 待确认

- `DesignDetails` 四个版本中，哪个是当前首页实际渲染路径在用的，其余是否可以清理。
- Feature Flag 控制的报告增强能力的预计上线时间/范围，需要开发者或产品负责人补充。
