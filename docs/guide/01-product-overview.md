# 01 · 产品总览

## 一句话定位

StyleLens 是面向 vibe coder / 设计师 / AI 创作者的视觉风格提取与 HTML 页面生成工具：上传一张参考图或粘贴一个网址，自动分析出色彩系统、字体排版、设计细节；输入文本 / Markdown / TXT 可以生成产品官网 HTML；上传 `.csv` / `.json` / `.xlsx` 可以生成 Dashboard HTML。风格提取这个定位在立项文档 `PRD_StyleExtractor.md` 里表述为"vibe coding 的起点加速器"，从实际代码看依然成立；Publisher / Dashboard 是当前新增的页面生成能力。

## 核心用户场景（与立项文档一致，仍然成立）

1. **拿到参考图/网站 → 直接可用的风格系统**：这是产品的基础能力，未登录也能完整体验。
2. **输入产品材料 → 生成可编辑官网 HTML**：在 `生成页面与看板` 工作区选择 8 个官网模板之一，粘贴文本或上传 `.md` / `.txt` 后生成。
3. **上传数据文件 → 生成可编辑 Dashboard HTML**：在 `生成页面与看板` 工作区选择 28 个 Dashboard 模板之一，上传 `.csv` / `.json` / `.xlsx` 后生成。
4. **积累风格素材库**：登录后可以把提取结果保存到个人库，支持重命名、删除、置顶、搜索。
5. **游客体验优先，登录只为"保存"这一步**：未登录用户可以正常提取、复制导出内容；只有想要跨设备保存历史时才需要登录。这一点被实现得比立项文档描述的更完整——见下方"游客体验"。

## 相比立项文档，实际代码里多出来的东西

立项文档 `PRD_StyleExtractor.md` 描述的是 Phase 1 的初始范围（提取器 + 风格报告 + 素材库）。审查当前代码后，发现至少这几类能力是立项文档完全没有覆盖、但已经实实在在写进代码里的：

- **游客历史与账号迁移**：`hooks/useHistory.ts` 里有完整的"游客历史（localStorage）→ 登录后自动合并进账号历史"的迁移逻辑，还带删除操作的"墓碑"（tombstone）机制防止迁移时把已删除的记录复活。这比立项文档里"未登录只能复制不能保存"的简单描述复杂得多。
- **BYOK（自带 API Key）设置工作区**：`components/settings/SettingsView.tsx` + `ApiKeysSection` 提供了一套完整的设置界面，允许用户配置自己的 API Key。立项文档完全没有提到这个能力。
- **Publisher 官网与 Dashboard 生成**：`components/publisher/PublisherWorkspace.tsx`、`hooks/usePublisher.ts`、`lib/publisher/`、`app/api/generate/route.ts`、`app/api/generate-dashboard-data/route.ts` 提供了官网和数据看板生成链路。当前前端已分成 `提取视觉风格` 与 `生成页面与看板` 两个工作区。
- **品牌预设/示例报告**：`lib/presets/brandPresets.ts` 里硬编码了 Linear、Stripe、Vercel、Apple、Notion、Framer 等知名产品的完整风格报告（含真实色值、字体信息、双语摘要），用途推测是首页的"示例/演示报告"，让新用户不用自己上传就能看到产品效果——这是一个立项文档里没有的获客/演示设计。
- **实验性报告增强模块**：`lib/flags.ts` 定义了 5 个 Feature Flag（设计审查、证据摘要、覆盖度摘要、交互摘要、页面审查），默认关闭，说明团队已经在为"更深度的报告分析"做准备，但还没有正式对所有用户开放。
- **AI 视觉模型从 Claude 换成了 Gemini**：立项文档明确写"选 Claude 3.5 Sonnet"，但实际代码用的是 Google Gemini，还专门做了代理适配以应对国内网络访问限制（`STYLELENS_HTTP_PROXY`，`aiExtract.ts` 里有针对"当前 AI 解析服务在此网络环境下暂不可用"的专门错误提示）。这是目前发现的最大一处技术选型落差。

## 目标用户（沿用立项文档判断，未重新验证）

立项文档定义了三类用户画像（Vibe Coder / 独立设计师 / AI 创作者），代码层面没有推翻这个判断的证据，予以保留。是否需要更新/收窄，建议由产品负责人结合实际使用数据确认。
