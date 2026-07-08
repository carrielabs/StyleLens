# 环境变量参考

以下变量名来自代码中 `process.env.*` 的实际引用（`grep -rhoE "process\.env\.[A-Z_]+" app/ lib/ components/ hooks/`），并与仓库根目录的 `.env.example` 交叉核对。

## 实际代码引用，但不在 `.env.example` 里的变量（需要补充）

| 变量 | 用途 | 说明 |
|---|---|---|
| `STYLELENS_GEMINI_API_KEY` | Gemini API Key（BYOK 相关，见 `features/05-settings-and-byok.md`） | `.env.example` 里完全没有列出这个变量，也没有列出任何 Gemini 相关的官方 Key 变量名——但实际 AI 分析用的是 Gemini。这是最需要优先修复的文档缺口。 |
| `STYLELENS_GEMINI_API_KEY_` | 疑似上面变量的兜底/次要 Key（注意末尾多一个下划线，可能是多 Key 轮询机制的一部分，或是命名笔误） | 待开发者确认这是有意为之的多 Key 命名模式，还是代码里的笔误 |
| `SCREENSHOT_ONE_API_KEY_`（注意末尾下划线） | 同上，可能是多 Key 机制或笔误 | 待确认 |
| `STYLELENS_HTTP_PROXY` | 请求 Gemini / ScreenshotOne 域名时使用的代理地址 | 服务于国内网络访问限制场景 |
| `HTTP_PROXY` / `HTTPS_PROXY` | 标准代理环境变量，作为 `STYLELENS_HTTP_PROXY` 的兜底 | — |

## `.env.example` 里列出，但实际代码引用中未直接搜到的变量

| 变量 | .env.example 里的用途 | 说明 |
|---|---|---|
| `ANTHROPIC_API_KEY` | 立项文档规划的 Claude Vision Key | 本次 grep 在 `app/`、`lib/`、`components/`、`hooks/` 范围内没有搜到对这个变量的直接引用，与"实际 AI 分析已经换成 Gemini"的发现一致。可能是遗留配置，建议开发者确认是否可以从 `.env.example` 移除，或者是否还有别处代码在用（例如 `@anthropic-ai/sdk` 依赖仍然存在，可能有其他未被本次审查覆盖的用途）。 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端专用 Key | 本次 grep 范围内没有直接搜到引用，可能在未被搜索到的文件里使用，也可能是预留但未启用，需要确认。 |

## 确认一致的变量

| 变量 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名 Key |
| `SCREENSHOT_ONE_API_KEY` | ScreenshotOne 服务 Key（用途待确认是否仍在实际调用路径中，见 `guide/02-architecture.md`） |

## 实验性功能开关（`NEXT_PUBLIC_ENABLE_*`）

见 `lib/flags.ts`，五个开关默认关闭：`ENABLE_DESIGN_AUDITS`、`ENABLE_REPORT_EVIDENCE_SUMMARY`、`ENABLE_REPORT_COVERAGE_SUMMARY`、`ENABLE_REPORT_INTERACTION_SUMMARY`、`ENABLE_PAGE_AUDITS`。详见 `docs/features/02-style-report.md`。

## 建议

`.env.example` 目前与实际代码使用的变量名有明显出入（缺 Gemini 相关变量，多了可能已经不用的 Anthropic 变量），建议尽快同步更新，否则新成员按 `.env.example` 配置环境变量后，AI 提取功能会直接不可用。这一条已经记录到 `roadmap.md`。
