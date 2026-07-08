# 02 · 系统架构

## 技术栈（实际 vs 立项文档）

| 层 | 立项文档写的 | 实际代码里的 | 说明 |
|---|---|---|---|
| 框架 | Next.js 14 | Next.js 15.5.14（App Router） | 版本号有出入，属于文档滞后 |
| React | 未明确写版本 | React 19.1.0 | — |
| 样式 | Vanilla CSS + CSS Modules | 审查到的组件（如 `SettingsView.tsx`）大量使用内联 `style={{}}` 而非 CSS Modules | 与立项文档"CSS Modules 保证样式作用域隔离"的原则有出入，具体比例（哪些组件用 CSS Modules、哪些用内联样式）未逐一统计，建议开发者补充 |
| AI 视觉分析 | Claude 3.5 Sonnet（`@anthropic-ai/sdk`） | **Google Gemini**（`@google/generative-ai`，`GoogleGenerativeAI`） | 重大落差，见下方"AI 提供商" |
| URL 截图 | Browserbase（推荐）/ ScreenshotOne（备选） | **Playwright 直接跑 Chromium**（`lib/api/screenshotter.ts` 中 `import { chromium } from 'playwright'`），同时 `.env.example` 里仍保留 `SCREENSHOT_ONE_API_KEY` | 说明实际实现绕开了立项文档的两个云服务方案，自己直接跑无头浏览器；`SCREENSHOT_ONE_API_KEY` 可能是遗留配置项，需要开发者确认是否还在用 |
| 色彩提取 | Vibrant.js（客户端） | `node-vibrant` 在依赖中存在 | 与立项文档一致 |
| 数据库/鉴权 | Supabase | Supabase（`@supabase/ssr` + `@supabase/supabase-js`） | 一致 |
| 部署 | Vercel | 代码中 `maxDuration` 等 Vercel 专用配置项存在 | 一致 |
| 测试 | 立项文档未提及 | Vitest + Testing Library，已有多个 `.test.ts(x)` 文件 | 立项文档没写测试策略，属于文档空白而非落差 |
| 网络代理 | 立项文档未提及 | `https-proxy-agent` + 自定义 `STYLELENS_HTTP_PROXY`，专门给 Gemini 请求打代理 | 新增能力，服务于"国内网络访问 Gemini API"这个实际运营问题 |

## 目录结构（实际）

```text
app/
├─ page.tsx             首页：提取器入口 + 报告展示（承担了立项文档里 page/library 拆分之外更多的组装逻辑）
├─ library/page.tsx      素材库页面，需登录（未登录会 redirect 到 /auth）
├─ auth/                 登录相关页面与回调
└─ api/
   ├─ extract/route.ts    风格提取主接口
   └─ screenshot/route.ts URL 截图接口

components/
├─ auth/AuthOverlay.tsx
├─ common/SettingsModal.tsx
├─ extractor/ (ImageUploader, UrlInput)
├─ home/ (HomeSidebar, HomeWorkspace, HomeOverlays, MagicalHeroLogo, viewUtils)
├─ report/ (StyleReport, ColorSystem, Typography, DesignDetails 及其 Elite/EliteV2/EliteV3 变体,
│           DesignInspector, StyleInspector, AtomicSandbox, ColorHighlighter, ExportPanel)
└─ settings/SettingsView.tsx（+ ApiKeysSection 等子组件）

hooks/
├─ useHistory.ts     历史列表状态：游客历史、账号历史、迁移、增删改查、搜索、置顶、撤销
└─ useExtraction.ts  提取流程状态：URL/图片输入、上传预览、拖拽粘贴、取消、加载态、错误处理

lib/
├─ api/ (aiExtract, screenshotter, pageAnalyzer, heroRegionDetector, heroVisualAnalyzer)
├─ design-details/gradeTokens.ts
├─ exporters/ (css/json/markdown/prompt/tailwind 五种导出格式 —— 比立项文档多了 tailwindExporter)
├─ presets/brandPresets.ts   知名品牌的预置示例报告
├─ storage/ (guestStore, libraryStore, supabaseClient, supabaseServer)
├─ flags.ts    实验性功能开关
└─ types/index.ts
```

`README.md`（仓库根目录）里对 `app/page.tsx`、`hooks/useHistory.ts`、`hooks/useExtraction.ts`、`components/home/*` 的职责划分有一段说明，写得比较清楚，本文档不重复，直接引用："`app/page.tsx` 是首页组装层，负责把鉴权状态、历史状态、提取状态、页面布局和浮层组合在一起。" 这段说明本身就是这个仓库里除了本次新增文档之外，唯一贴近代码现状的架构描述，建议后续维护时保持更新。

## 请求链路：从粘贴 URL 到看到风格报告

1. 用户在首页粘贴 URL 或上传图片（`hooks/useExtraction.ts` 统一处理这两种输入方式，含拖拽、粘贴、上传进度）。
2. 如果是 URL：调用 `POST /api/screenshot`，服务端先做 SSRF 防护校验（拒绝 localhost / 内网 IP / 非 http(s) 协议），再用 Playwright 打开页面截图，同时调用 `lib/api/pageAnalyzer.ts` 在同一个页面上下文里做 DOM 级别的样式分析（颜色、字体、圆角、阴影、间距、边框、交互态、组件快照、页面分区）。截图结果有本地文件缓存（`.screenshot_cache.json`），重启开发服务器不会丢失缓存。
3. 服务端把截图 + 结构化的 `pageAnalysis` 一起送进 `POST /api/extract`（走 `lib/api/aiExtract.ts`），由 Gemini 做视觉理解，并把 `pageAnalysis` 提供的"测量信号"作为约束——也就是说，最终风格报告不是纯粹靠 AI"看图猜"，而是"DOM 实测数据 + AI 视觉理解"两条信号融合的结果，这一点立项文档完全没有提到，是实际实现里更扎实的部分。
4. 报告在前端渲染为多个展示模块（色彩系统、字体排版、设计细节，及若干 Elite 版本的进阶展示组件），可以导出成 Prompt / Markdown / CSS / JSON / Tailwind 五种格式。
5. 登录用户点击保存，写入 Supabase；未登录用户走 `lib/storage/guestStore.ts` 存在 localStorage，登录后自动迁移。

## 待确认

- CSS Modules 与内联样式在组件层的实际使用比例。
- `SCREENSHOT_ONE_API_KEY` 是否还有实际调用路径，还是纯历史遗留配置。
- 历史设计稿已归档到 `docs/archive/`；测试截图素材已归档到 `test/fixtures/visual/`，避免散落在仓库根目录。
