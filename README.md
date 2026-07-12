# StyleLens

StyleLens 是一个面向设计参考和页面生成的 Web 工具。

当前能力：

- 输入官网 URL，提取网站视觉风格。
- 上传图片 / 截图，提取视觉风格。
- 输出风格报告、Prompt、CSS、Design Token JSON。
- 输入文本 / Markdown / TXT，选择 8 个官网模板之一，生成可预览、可下载、可编辑的产品官网 HTML。
- 上传 `.csv` / `.json` / `.xlsx` 数据文件，选择 15 个 Dashboard 模板之一，生成可预览、可下载、可编辑的数据看板 HTML。

## 开发规则

开发、调试、提交、push、合并前，先读根目录 [`AGENTS.md`](./AGENTS.md)。

关键规则：

- 可信基线是 `origin/main`。
- 新任务开始前必须检查 Git 状态。
- 历史 worktree 只能只读参考，不能作为正式开发目录。
- 未经用户明确要求，不自动提交、push、合并或创建 PR。
- 修改必须控制范围，只做用户明确要求的事。

## 技术栈

- Next.js 15 App Router
- React 19
- TypeScript
- Vitest
- Supabase
- Google Gemini
- Playwright
- Cheerio
- Tailwind CSS CLI（用于 Publisher 模板内联样式）

## 快速开始

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

默认访问：

```text
http://localhost:3000
```

## 常用命令

```bash
npm test
npx tsc --noEmit
npm run build
npm run lint
```

说明：

- `npm test`：运行 Vitest 测试。
- `npx tsc --noEmit`：运行 TypeScript 类型检查。
- `npm run build`：运行生产构建。
- `npm run lint`：运行 ESLint。当前项目仍有历史 lint 债务，不能把 lint 结果单独当作本次改动失败依据。

## 环境变量

环境变量以 `.env.example` 和 Vercel 配置为准。

安全要求：

- 不允许把 API Key、Token、数据库密码写进代码。
- 不允许在文档或提交信息里写明文密钥。
- 本地 `.env.local` 不进入版本控制。

## 项目结构

```text
app/                  Next.js 页面与 API 路由
components/           React UI 组件
hooks/                前端状态与业务 Hook
lib/                  核心业务逻辑、API、存储、Publisher
templates/            官网与 Dashboard 生成模板
public/               静态资源
test/fixtures/        测试素材与截图 fixture
docs/                 产品、架构、功能和参考文档
scripts/              本地辅助脚本
```

重点文件：

- `app/page.tsx`：首页组合层。
- `components/home/HomeWorkspace.tsx`：风格提取工作区。
- `components/publisher/PublisherWorkspace.tsx`：官网与 Dashboard 生成工作区。
- `hooks/useExtraction.ts`：URL / 图片风格提取逻辑。
- `hooks/usePublisher.ts`：官网与 Dashboard 生成逻辑。
- `lib/publisher/`：AI HTML Publisher 服务端生成模块。
- `app/api/extract/route.ts`：风格提取 API。
- `app/api/generate/route.ts`：文本生成官网 / Dashboard API。
- `app/api/generate-dashboard-data/route.ts`：数据文件生成 Dashboard API。

## 核心约定

- URL / 图片继续走风格提取。
- 文本 / `.md` / `.txt` 走产品官网生成。
- `.csv` / `.json` / `.xlsx` 走 Dashboard 生成。
- Publisher 当前必须支持 8 个官网模板和 15 个 Dashboard 模板；PPT、Skill、GitHub 开源不属于当前版本。
- `walkthrough.md` 是外部流程维护文件，普通开发不要随意修改。
- `.claude/worktrees`、`.next`、`node_modules`、本地缓存不能作为正式源码依据。
- 测试截图素材放在 `test/fixtures/`，不要散落在仓库根目录。

## 测试策略

当前测试重点：

- 提取流程 Hook。
- 历史记录 Hook。
- Publisher 官网生成。
- Publisher Dashboard 数据文件生成。
- API 路由输入校验。
- 页面分析核心逻辑。

实时联网 / 浏览器类测试默认跳过，需要时显式开启：

```bash
STYLELENS_REAL_WORLD_TESTS=1 npm test
```

## 文档入口

- [`AGENTS.md`](./AGENTS.md)：开发总纲，优先级最高。
- [`docs/README.md`](./docs/README.md)：文档目录入口。
- [`docs/guide/`](./docs/guide/)：产品、架构、数据模型。
- [`docs/features/`](./docs/features/)：功能模块说明。
- [`docs/reference/`](./docs/reference/)：API 和环境变量参考。

## 当前已知问题

- 全量 lint 仍有历史债务，主要是旧代码里的 `any`、未使用变量和 JSX 规则问题。
- `docs/archive/` 存放历史设计稿或一次性调试产物，不作为正式源码入口。
- `.claude/worktrees` 已从测试、lint、tsconfig 中排除，但本地仍可按需清理。
