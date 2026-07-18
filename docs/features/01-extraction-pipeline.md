# 01 · 提取链路：截图/上传 → 页面分析 → AI 提取

## 两种输入方式

`hooks/useExtraction.ts` 统一处理两条输入路径，与立项文档描述的一致：

- **图片上传**：拖拽整页放置、点击选择、粘贴（Cmd/Ctrl+V）三种方式，服务端对 base64 大小做了限制（`app/api/extract/route.ts` 中 `MAX_BASE64_BYTES = 20MB`），与立项文档"20MB 上限"的规格一致。
- **网站 URL**：提交后先打 `POST /api/screenshot`。

## URL 截图：安全与实现

`app/api/screenshot/route.ts` 在截图前做了一层 SSRF（服务端请求伪造）防护，`isSafeUrl()` 函数会拒绝：

- 非 `http:`/`https:` 协议
- `localhost` / `0.0.0.0`
- `.local` 域名
- IPv4 私有/回环地址段

这是立项文档完全没有提到的安全设计，说明实际实现在"允许用户输入任意 URL 让服务端去访问"这件事上，比立项文档考虑得更周全。

截图本身由 `lib/api/screenshotter.ts` 用 Playwright 直接跑 Chromium 完成，而不是立项文档规划的 Browserbase/ScreenshotOne 云服务（见 `guide/02-architecture.md` 里的技术选型落差表）。截图结果有一份基于本地文件的持久缓存（`.screenshot_cache.json`），专门用来在开发环境下扛住 Next.js 热更新（HMR）导致的进程重启，避免反复截同一个 URL。

## 页面分析（DOM 实测，不只是"看截图"）

截图的同时，`lib/api/pageAnalyzer.ts` 会在同一个 Playwright 页面上下文里做结构化的 DOM 分析，产出内容包括（从类型定义推断）：颜色候选（`PageColorCandidate`）、字体候选与 Token（`TypographyCandidate`/`TypographyToken`）、圆角/阴影/间距/边框/过渡 Token、交互态快照（Input/Card/Tag/Button 在 hover/focus 等状态下的样式）、页面分区（`PageSection`）、布局证据（`LayoutEvidence`）。

这一套"实测信号"是立项文档完全没有设计的部分——立项文档设想的是纯粹"截图 + Vision AI 识别"，而实际实现里 AI 只是流程的一环，DOM 实测数据同样重要，甚至被明确当作"约束"喂给 AI（见下一节）。

## 质量门（2026-07 更新）

当前质量门已经从“只盯颜色”扩展到“颜色 + 字体 + 圆角 + 按钮 + 间距 + 导出质量”。

- 10 个真实网站基线必须声明这些检查项，避免后续只测颜色导致能力退化。
- Prompt 导出必须带证据说明和 Taste DNA，不能输出空泛风格话术。
- CSS 导出必须优先使用 DOM 实测的组件尺寸。
- JSON 导出按 DTCG-shaped token 结构输出，并带 StyleLens 证据扩展。

## AI 提取

`lib/api/aiExtract.ts` 把截图和 `pageAnalysis` 一起送给 Gemini（不是立项文档写的 Claude，见 `guide/01-product-overview.md`），并且：

- 对国内网络访问 Gemini API 的场景做了专门处理：识别"user location is not supported"类错误，转换成对用户友好的中文提示"当前网络环境暂时无法使用 AI 解析，请切换网络环境后重试"。
- 支持通过 `STYLELENS_HTTP_PROXY`（或标准的 `HTTP_PROXY`/`HTTPS_PROXY`）走代理请求 Gemini 和 ScreenshotOne 的域名。
- 结合 `heroVisualAnalyzer.ts`（`mergeScreenshotColorSignals`）把截图色彩信号和 DOM 实测色彩信号做融合，而不是简单地二选一。

## 待确认

- "多 Gemini Key 轮询"的具体机制：`extract/route.ts` 里有对"all gemini keys failed"错误的兜底文案，暗示可能配置了多个 Gemini Key 做轮询/负载均衡，但具体轮询策略未在本次审查中确认。
- 图片上传后的服务器文件是否按立项文档承诺的"24 小时内自动删除"执行，未在本次审查中确认。
