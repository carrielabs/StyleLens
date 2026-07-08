# API 路由参考

所有路由在 `app/api/*/route.ts`，均为 Next.js App Router Route Handler。

## `POST /api/screenshot`

- **作用**：对给定 URL 做无头浏览器截图，同时做 DOM 级页面样式分析。
- **安全**：`isSafeUrl()` 校验，拒绝非 http(s) 协议、localhost、`.local` 域名、IPv4 私有/回环地址段（SSRF 防护）。
- **实现**：Playwright 直接跑 Chromium（不是立项文档规划的 Browserbase/ScreenshotOne）。
- **缓存**：本地文件缓存 `.screenshot_cache.json`，跨开发服务器重启保留。
- **运行时限制**：`maxDuration = 30`（Vercel 函数最长执行 30 秒）。
- 详见 `docs/features/01-extraction-pipeline.md`。

## `POST /api/extract`

- **作用**：接收图片（`imageBase64`）或截图结果（`screenshotUrl`）+ 页面分析数据（`pageAnalysis`），调用 Gemini 生成完整风格报告。
- **参数校验**：`imageBase64` 和 `screenshotUrl` 至少要有一个；`imageBase64` 大小上限 `MAX_BASE64_BYTES = 20MB`。
- **错误处理**：把 Gemini 的地域限制错误、多 Key 全部失败等内部错误转换成用户友好的中文提示（`toUserFacingExtractError`）。
- **运行时限制**：`maxDuration = 60`。
- 详见 `docs/features/01-extraction-pipeline.md`。

## 待确认

- 是否存在其他未被本次审查发现的 API 路由（本次只在 `app/api/` 下找到 `extract` 和 `screenshot` 两个）。
- `/api/extract` 的完整请求/响应类型定义建议直接参考 `lib/types/index.ts` 中的 `ExtractRequest`，本文档不重复摘抄类型细节以避免与代码脱节。
