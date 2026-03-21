# StyleLens — 视觉系统 & 技术栈文档

> **版本**: v1.0 · **日期**: 2026-03-20

---

## 一、视觉风格定义

### 1.1 设计哲学

**参照物**：Linear、Pitch、Craft.do、Stripe Dashboard、Are.na

**核心原则**：
- **编辑排版感** — 设计语言来自平面印刷，而非科技产品
- **克制的单色调** — 几乎是黑白灰，一个极其克制的强调色
- **密度适中** — 信息呼吸感，不堆砌，不过度留白
- **功能性优雅** — 每一个视觉元素都在服务内容，没有装饰性噪音

**明确禁止**：
- ❌ 荧光/霓虹色（紫色发光、蓝色高亮等 AI 典型配色）
- ❌ Glassmorphism 磨砂玻璃背景（过度使用）
- ❌ 渐变色背景、渐变文字
- ❌ Glow 发光效果、box-shadow 带颜色
- ❌ 圆润卡通感的大圆角按钮（> 8px 的按钮圆角）
- ❌ 动效过度：粒子、波纹、浮动动画
- ❌ 饱和度过高的任何颜色

---

### 1.2 色彩系统

#### 基础色板

```css
:root {
  /* Background */
  --bg-base:       #0D0D0B;   /* 暖近黑，主背景 */
  --bg-surface:    #141412;   /* 卡片/面板底色 */
  --bg-elevated:   #1C1C19;   /* 悬浮元素、Dropdown */
  --bg-hover:      #222220;   /* Hover 态底色 */

  /* Border */
  --border-subtle: #232321;   /* 最细的分隔线 */
  --border-base:   #2E2E2B;   /* 常规边框 */
  --border-strong: #3D3D39;   /* 强调边框（Active 态）*/

  /* Text */
  --text-primary:  #EEECEA;   /* 主文字，暖奶油白 */
  --text-secondary:#8C8C87;   /* 辅助文字，中调暖灰 */
  --text-tertiary: #555552;   /* 极弱文字，时间戳等 */
  --text-inverse:  #0D0D0B;   /* 深色背景上的黑色文字 */

  /* Accent — 唯一的强调色 */
  --accent:        #C9A96E;   /* 哑光琥珀金，品牌色 */
  --accent-subtle: rgba(201,169,110,0.08); /* 强调色低透明度底色 */
  --accent-hover:  #D4B882;   /* Hover 态略亮 */

  /* Status */
  --success:       #5C8C6E;   /* 哑光绿，非荧光 */
  --error:         #9E4848;   /* 暗红，非亮红 */
  --warning:       #9E7C3A;   /* 暗金，非黄 */
}
```

#### 色彩使用原则

| 场景 | 使用色 |
|------|--------|
| 页面背景 | `--bg-base` |
| 卡片、输入框、面板 | `--bg-surface` + `--border-subtle` |
| 主按钮背景 | `--text-primary`（黑字）|
| 次级按钮 | `--bg-elevated` + `--border-base` |
| 强调/激活态 | `--accent` |
| 所有文字 | `--text-primary` / `--text-secondary` |
| 错误提示 | `--error` |

---

### 1.3 字体系统

```css
:root {
  /* 字体族 */
  --font-sans:  'Inter', 'PingFang SC', 'Noto Sans SC', system-ui, sans-serif;
  --font-mono:  'JetBrains Mono', 'Fira Code', 'Courier New', monospace;

  /* 字号 Scale（基于 1.25 比例）*/
  --text-xs:   11px;    /* 标签、时间戳 */
  --text-sm:   13px;    /* 辅助文字、Meta 信息 */
  --text-base: 15px;    /* 正文 */
  --text-lg:   18px;    /* 小标题 */
  --text-xl:   22px;    /* 区块标题 */
  --text-2xl:  28px;    /* 页面标题 */
  --text-hero: 40px;    /* Hero 标题 */

  /* 字重 */
  --weight-regular: 400;
  --weight-medium:  500;
  --weight-semibold:600;

  /* 行高 */
  --leading-tight:  1.3;   /* 标题 */
  --leading-base:   1.6;   /* 正文 */
  --leading-loose:  1.8;   /* 长文阅读 */

  /* 字间距 */
  --tracking-tight: -0.025em;  /* 大标题 */
  --tracking-base:  -0.01em;   /* 正文 */
  --tracking-wide:  0.05em;    /* 全大写标签 */
}
```

**字体渲染**：
```css
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

---

### 1.4 间距系统

基于 **4px 基础单位**：

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
}
```

---

### 1.5 圆角系统

```css
:root {
  --radius-sm:   4px;    /* 输入框、标签 */
  --radius-base: 6px;    /* 按钮、卡片 */
  --radius-lg:   10px;   /* 模态框、大卡片 */
  --radius-full: 9999px; /* 仅用于 Pill 标签 */
}
```

> 原则：**绝不超过 10px**（除 Pill 类型）。设计感来自棱角，不来自圆润。

---

### 1.6 阴影系统

```css
:root {
  /* 无彩色阴影，仅使用黑色透明 */
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.4);
  --shadow-base:0 2px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4);
  --shadow-lg:  0 8px 24px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.4);
}
```

> 绝不使用带颜色的 glow 阴影（如 `box-shadow: 0 0 20px rgba(124,92,252,0.5)`）。

---

### 1.7 动效规范

```css
:root {
  --ease-base:   cubic-bezier(0.16, 1, 0.3, 1);  /* 快出慢入，自然感 */
  --ease-in:     cubic-bezier(0.4, 0, 1, 1);
  --ease-out:    cubic-bezier(0, 0, 0.2, 1);

  --duration-fast:   120ms;   /* Hover、Focus */
  --duration-base:   200ms;   /* 一般过渡 */
  --duration-slow:   350ms;   /* 页面级切换 */
}
```

**动效原则**：
- Hover 态只改变 `background-color` 或 `border-color`，不做位移
- 不使用 `scale()` 放大（显廉价）
- 页面内容进入：`opacity 0→1`，仅此而已，不加位移动画
- 禁止 Loading 状态的旋转图标（使用线性进度条或 Skeleton）

---

### 1.8 核心组件规范

#### 按钮

```
Primary Button:
  背景: --text-primary (近白)  文字: --text-inverse (近黑)
  圆角: --radius-base (6px)    字重: --weight-medium
  高度: 34px  横向内边距: 14px
  Hover: opacity 0.88，过渡 120ms
  ❌ 禁止渐变背景  ❌ 禁止发光阴影

Secondary Button:
  背景: transparent  边框: 1px solid --border-base
  文字: --text-primary  Hover: --bg-elevated
  高度: 34px  圆角: --radius-base

Ghost Button:
  背景: transparent  无边框
  文字: --text-secondary  Hover: --bg-hover，文字转 --text-primary
```

#### 输入框

```
背景: --bg-surface
边框: 1px solid --border-subtle
Focus: 边框色升为 --border-strong，无 glow
圆角: --radius-sm (4px)
高度: 36px  横向内边距: 12px
Placeholder: --text-tertiary
```

#### 卡片

```
背景: --bg-surface
边框: 1px solid --border-subtle
圆角: --radius-base (6px)
内边距: 20px
Hover: 边框色升为 --border-base，过渡 120ms
❌ 不使用 backdrop-filter: blur()
```

#### 标签/Badge

```
背景: --bg-elevated
边框: 1px solid --border-base
文字: --text-secondary  字号: --text-xs  字重: --weight-medium
圆角: --radius-sm (4px)  横向内边距: 6px  高度: 20px
字母大写 + letter-spacing: 0.04em
```

#### 分隔线

```
border: none;
border-top: 1px solid --border-subtle;
不使用 hr 标签，全部用 CSS border 实现
```

---

## 二、技术栈

### 2.1 选型总览

| 层级 | 技术 | 版本 | 选择理由 |
|------|------|------|---------|
| 框架 | **Next.js** | 15 (App Router) | SSR/SSG 混合，SEO 友好，API Routes 内置 |
| 语言 | **TypeScript** | 5.x | 类型安全，Supabase 原生支持 |
| 样式 | **Vanilla CSS** (CSS Modules) | — | 无框架依赖，与设计系统 Token 完全一致 |
| 数据库 | **Supabase** | — | PostgreSQL + Auth + Storage 一体，免费额度够 MVP |
| AI 分析 | **Anthropic Claude 3.5 Sonnet** | — | 视觉理解最强，Prompt 遵从度优于 GPT-4o |
| 色彩提取 | **Vibrant.js** (客户端) | — | 纯前端运行，无服务器成本 |
| URL 截图 | **Browserbase + Playwright** | — | Serverless 友好，Vercel 兼容，无需自维护浏览器 |
| 图片上传 | **Supabase Storage** | — | 与数据库同一平台，权限控制简单 |
| 部署 | **Vercel** | — | Next.js 原生支持，Edge Functions |

---

### 2.2 关键技术决策说明

#### 为什么选 Claude 做 Vision 分析？
- Claude 3.5 Sonnet 对视觉细节描述（色彩语义、设计风格语言）更精确
- 对中英文混合 Prompt 输出的一致性更好
- API 价格与 GPT-4o 相近

#### 为什么用 Vanilla CSS + CSS Modules，不用 Tailwind？
- StyleLens 本身是设计工具，CSS 变量 Token 系统是产品核心能力的延伸
- Tailwind 的 utility class 会让样式逻辑分散，不利于 debug
- CSS Modules 保证样式作用域隔离，防止全局污染

#### URL 截图方案的选择
- Vercel Serverless Functions 不能运行 Playwright（无 Chromium 环境）
- 方案 A（推荐）：使用 **Browserbase** API（专为 Playwright 云执行设计）
- 方案 B（备选）：使用 **ScreenshotOne** REST API（更简单，无需 Playwright）
- Phase 1 先用 ScreenshotOne，稳定后迁移到 Browserbase 获取更多 CSS 信息

#### Supabase Storage 图片处理
- 用户上传图片 → 服务端处理完后存 Supabase Storage（压缩为 WebP，max 800px）
- 原始图片不存储，保护用户隐私，降低存储成本

---

### 2.3 环境变量清单

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=

# Screenshot
SCREENSHOT_ONE_API_KEY=       # URL 截图服务（Phase 1）

# App
NEXT_PUBLIC_APP_URL=
```

---

### 2.4 依赖清单

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@supabase/ssr": "^0.0.10",
    "@anthropic-ai/sdk": "^0.20.0",
    "node-vibrant": "^3.1.6"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0"
  }
}
```

---

### 2.5 项目目录结构

```
stylelens/
├── .env.local                      # 环境变量（不提交）
├── .env.example                    # 环境变量模板（提交）
├── .gitignore
├── next.config.ts
├── tsconfig.json
├── package.json
│
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # 根布局（字体、全局 CSS）
│   ├── page.tsx                    # 首页（提取器入口）
│   ├── library/
│   │   └── page.tsx                # 素材库页面
│   ├── globals.css                 # CSS 变量 Token + Reset
│   └── api/
│       ├── extract/
│       │   └── route.ts            # POST: 调 Claude 分析图片/截图
│       └── screenshot/
│           └── route.ts            # POST: 调 ScreenshotOne 截图 URL
│
├── components/
│   ├── extractor/
│   │   ├── ImageUploader.tsx       # 图片拖拽上传
│   │   ├── ImageUploader.module.css
│   │   ├── UrlInput.tsx            # URL 输入框
│   │   ├── UrlInput.module.css
│   │   ├── AnalyzeButton.tsx       # 提交 + 状态
│   │   └── AnalyzeButton.module.css
│   ├── report/
│   │   ├── StyleReport.tsx         # 报告容器
│   │   ├── StyleReport.module.css
│   │   ├── ColorSystem.tsx         # 色彩展示
│   │   ├── ColorSystem.module.css
│   │   ├── Typography.tsx          # 字体展示
│   │   ├── Typography.module.css
│   │   ├── DesignDetails.tsx       # 设计细节
│   │   ├── DesignDetails.module.css
│   │   ├── StyleTags.tsx           # 标签
│   │   ├── StyleTags.module.css
│   │   ├── ExportPanel.tsx         # 四 Tab 导出面板
│   │   └── ExportPanel.module.css
│   ├── library/
│   │   ├── LibraryGrid.tsx
│   │   ├── LibraryGrid.module.css
│   │   ├── LibraryCard.tsx
│   │   ├── LibraryCard.module.css
│   │   ├── LibraryFilters.tsx
│   │   └── LibraryFilters.module.css
│   └── ui/
│       ├── Toast.tsx               # 全局通知
│       ├── Toast.module.css
│       ├── Modal.tsx               # 弹窗
│       ├── Modal.module.css
│       ├── Skeleton.tsx            # 骨架屏
│       └── Skeleton.module.css
│
├── lib/
│   ├── api/
│   │   ├── aiExtract.ts            # Claude Vision 调用
│   │   └── screenshotter.ts        # ScreenshotOne API 封装
│   ├── parsers/
│   │   ├── colorParser.ts          # 色彩提取 + 分类逻辑
│   │   ├── fontParser.ts           # 字体解析
│   │   └── cssParser.ts            # CSS 变量解析
│   ├── exporters/
│   │   ├── promptExporter.ts       # 生成风格 Prompt（中/英）
│   │   ├── markdownExporter.ts     # 生成 Markdown 报告
│   │   ├── cssExporter.ts          # 生成 CSS Variables
│   │   └── jsonExporter.ts         # 生成 Design Token JSON
│   ├── storage/
│   │   ├── supabaseClient.ts       # Supabase 浏览器端客户端
│   │   ├── supabaseServer.ts       # Supabase 服务端客户端
│   │   └── libraryStore.ts         # 素材库 CRUD
│   └── types/
│       └── index.ts                # 全局 TypeScript 类型定义
│
└── public/
    └── fonts/                      # 本地字体（如需）
```

---

### 2.6 Supabase 数据库 Schema

```sql
-- 风格记录表
create table style_records (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users on delete cascade,
  source_type   text not null check (source_type in ('image', 'url')),
  source_label  text,                       -- 文件名 or 域名
  thumbnail_url text,                       -- Supabase Storage 路径
  style_data    jsonb not null,             -- 完整风格报告
  tags          text[] default '{}',
  created_at    timestamptz default now()
);

-- RLS: 用户只能读写自己的记录
alter table style_records enable row level security;

create policy "Users can manage own records"
  on style_records for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 索引
create index on style_records (user_id, created_at desc);
create index on style_records using gin (tags);
```
