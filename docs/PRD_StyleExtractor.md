# StyleLens — 视觉风格提取工具 PRD

> **版本**: v1.1 · **阶段**: Phase 1 — 风格提取 + 素材库
> **作者**: Antigravity · **日期**: 2026-03-20

---

## 一、产品愿景

### 1.1 一句话描述

> **StyleLens** — 上传一张图或一个网址，30秒内获得可直接用于 vibe coding 的完整风格系统。

### 1.2 解决的核心问题

| 痛点 | 现有解法 | StyleLens 的解法 |
|------|---------|-----------------|
| 找不到合适风格参考 | 手动刷 Dribbble / Pinterest | 随时上传任意图/网站，即时提取 |
| AI 复刻参考效果差 | 反复调 prompt | 自动生成精准风格 prompt + CSS |
| 灵感无法沉淀 | 截图放相册 | 个人风格库，账号登录后云端保存 |

### 1.3 产品定位

面向**独立开发者、设计师、AI 创作者**的专业视觉风格提取工具。
不是"设计工具"，是 **vibe coding 的起点加速器**。

---

## 二、目标用户

### Persona A — Vibe Coder（核心用户）
- 用 Cursor / Claude 快速搭建产品
- 审美有品位但懒得手写 CSS
- **需求**：上传参考图 → 拿到 CSS Variables + Prompt，直接粘贴

### Persona B — 独立设计师
- 需要快速分析竞品的视觉语言
- **需求**：输入竞品 URL → 提取完整色彩系统、字体排版规范

### Persona C — AI 创作者
- 用 Midjourney / Flux 生成图像，苦于 prompt 太模糊
- **需求**：图片 → 精准风格 prompt，直接拿去生图

---

## 三、功能规格

### 3.1 核心功能架构

```
StyleLens
├── 风格提取器（Extractor）
│   ├── 输入：图片上传
│   └── 输入：网站 URL
├── 风格报告（Style Report）
│   ├── 视觉概览卡
│   ├── 色彩系统
│   ├── 字体排版
│   ├── 风格标签
│   ├── 设计细节
│   └── 导出面板（Prompt / Markdown / CSS / JSON）
└── 素材库（Library）
    ├── 历史提取记录（云端，需登录）
    ├── 标签分类
    └── 收藏 & 搜索
```

---

### 3.2 输入模块

#### 3.2.1 图片上传

**支持格式**：JPG、PNG、WebP、AVIF、GIF（取第一帧）、SVG
**文件大小上限**：20MB
**分辨率建议**：最低 400×400px，低于此尺寸显示警告

**交互细节**：
- 支持拖拽上传（整页 drag zone，进入拖拽时边框变色高亮）
- 支持点击选择文件
- 支持粘贴图片（Cmd/Ctrl+V，自动识别剪贴板图片）
- 上传后立即显示缩略图预览，右上角可删除重选
- 上传进度条（百分比 + 动效）

**边界条件**：
- 上传非图片格式 → Toast 错误提示"不支持此文件格式"
- 超过 20MB → "文件过大，请上传 20MB 以内的图片"
- 网络中断 → 显示重试按钮，不清空已选图片
- 上传 SVG 纯矢量图（无丰富色彩）→ 提示"图片色彩信息有限，提取结果可能不完整"

---

#### 3.2.2 网站 URL 提取

**输入方式**：粘贴 URL，回车或点击"分析"按钮

**处理流程**：
1. 后端对目标 URL 进行截图（无头浏览器 Playwright）
2. 同时抓取该页面的 CSS 样式表（字体、颜色变量等）
3. 截图送入 Vision AI 提取视觉特征
4. CSS 源码解析字体名称、CSS Variables

**边界条件**：
- URL 格式不合法 → 内联错误"请输入有效的网址（以 http:// 或 https:// 开头）"
- 目标网站拒绝访问（403/anti-bot）→ "该网站限制了自动访问，请截图后上传"，并提供一键截图教程入口
- 网站加载超时（> 15s）→ "页面加载超时"，保留输入内容
- 网站含大量动画 → 截图取 3s 后的稳定帧
- 登录态页面 → 提示"该页面需要登录，建议截图后上传"
- localhost / 内网 IP → 拒绝访问，提示"不支持本地地址"
- HTTP（非 HTTPS）→ 允许，但显示安全警告

---

### 3.3 风格报告模块（Style Report）

分析完成后展示完整风格报告页面。

#### 3.3.1 视觉概览卡

- 原图/截图缩略图（可点击放大）
- AI 生成的风格一句话描述（例："深色极简风，午夜蓝主色调，融合玻璃拟态效果"）
- 3-6 个风格标签（Badge 样式）
- 分析来源标注（图片上传 / URL 来源域名）
- 分析时间戳

---

#### 3.3.2 色彩系统（Color System）

| 类型 | 说明 |
|------|------|
| 主色（Primary） | 最主导的品牌色，1-2个 |
| 辅助色（Secondary） | 配合主色使用 |
| 背景色（Background） | 页面底色，含渐变描述 |
| 文字色（Text） | 主文字色、辅助文字色 |
| 强调色（Accent） | 按钮、高亮、链接 |
| 完整色板 | AI 从图中提取的前 8-12 个颜色 |

**每个色块展示**：色块（点击复制 HEX）、HEX / RGB / HSL（三态切换）、颜色名称、用途描述

**渐变识别**：检测到渐变时额外展示渐变预览条和 `linear-gradient()` CSS 代码

---

#### 3.3.3 字体排版（Typography）

| 字段 | 说明 |
|------|------|
| 字体族 | 识别字体名称，标注"已识别"或"推测" |
| 标题/正文字重 | Bold (700) / Regular (400) |
| 字号比例 | 各级文字大小关系 |
| 行高 / 字间距 | 估算值 |
| 对齐方式 | 左对齐 / 居中 / 两端 |
| 文字颜色处理 | 纯色 / 渐变 / 半透明 |

**边界**：
- 系统字体 → 标注"系统默认字体"
- 无法识别 → 推荐相似 Google Fonts 替代
- 图片来源（无 CSS）→ 标注"视觉推测，精度有限"

---

#### 3.3.4 设计细节（Design Details）

| 维度 | 示例 |
|------|------|
| 整体风格 | Glassmorphism（玻璃拟态）|
| 圆角 | 大圆角（16-24px）|
| 阴影 | 柔和多层阴影，低不透明度 |
| 间距系统 | 8px 基础栅格 |
| 边框 | 半透明细边框 |
| 动效倾向 | ease-out，300-500ms |
| 布局结构 | 单栏居中，最大宽度 1200px |
| 暗色/亮色 | 深色模式 |

---

#### 3.3.5 导出面板（Export）

**四个 Tab**：

**① 风格 Prompt**（直接投喂 AI）
```
Visual style: Dark glassmorphism UI with midnight blue (#0D1B2A) as primary
background, electric blue (#4FC3F7) as accent. Frosted glass panels with
subtle white borders. Large rounded corners (16px). Soft multilayer shadows.
Modern sans-serif typography. Clean minimalist layout with spacious padding.
Smooth ease-out micro-animations.
```
- 一键复制 Prompt
- 切换语言（中文 / English）

---

**② 风格描述 Markdown**（粘贴进 Notion / AI 对话）
```markdown
## 风格分析报告

**整体风格**: 深色极简主义，玻璃拟态效果
**风格标签**: `Glassmorphism` `Dark Mode` `Minimalist`

### 色彩系统
| 用途 | 色值 | 名称 |
|------|------|------|
| 主背景 | `#0D1B2A` | Midnight Blue |
| 强调色 | `#4FC3F7` | Electric Blue |
| 主文字 | `#FFFFFF` | White |
| 辅助文字 | `rgba(255,255,255,0.6)` | — |

### 字体排版
- **字体**: Inter, -apple-system, sans-serif
- **标题字重**: Bold (700) · **正文字重**: Regular (400)
- **行高**: 1.6 · **字间距**: -0.01em

### 设计细节
- 圆角：16-24px
- 阴影：多层柔和阴影，低透明度
- 边框：半透明细边框 `rgba(255,255,255,0.1)`
- 动效：ease-out，300-500ms
```
- 一键复制 Markdown
- 下载 .md 文件

---

**③ CSS Variables**（直接粘贴进项目）
```css
:root {
  /* Colors */
  --color-bg-primary: #0D1B2A;
  --color-bg-secondary: #1A2B3C;
  --color-accent: #4FC3F7;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: rgba(255,255,255,0.6);
  --color-border: rgba(255,255,255,0.1);

  /* Typography */
  --font-family: 'Inter', -apple-system, sans-serif;
  --font-size-base: 16px;
  --font-size-heading: 2rem;
  --font-weight-bold: 700;
  --line-height-base: 1.6;
  --letter-spacing: -0.01em;

  /* Spacing & Radius */
  --spacing-unit: 8px;
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;

  /* Effects */
  --shadow-glass: 0 8px 32px rgba(0,0,0,0.3);
  --blur-glass: blur(12px);
  --transition-base: all 0.3s ease-out;
}
```
- 语法高亮
- 复制 CSS / 下载 .css 文件

---

**④ Design Token JSON**（Figma / Style Dictionary 用）
```json
{
  "color": {
    "bg": { "primary": "#0D1B2A", "secondary": "#1A2B3C" },
    "accent": "#4FC3F7",
    "text": { "primary": "#FFFFFF", "secondary": "rgba(255,255,255,0.6)" }
  },
  "typography": {
    "fontFamily": "Inter, -apple-system, sans-serif",
    "fontSize": { "base": "16px", "heading": "2rem" }
  },
  "spacing": { "unit": 8, "radiusMd": 16 }
}
```
- 复制 JSON

---

### 3.4 素材库（Library）

#### 3.4.1 存储逻辑

> **上线给多用户使用 → 必须有数据库 + 账号系统**
> 原因：localStorage 数据绑定设备，换设备/清缓存即丢失；多用户需要隔离的历史记录

**推荐方案：Supabase**
- Auth：邮箱/Google 登录，免维护用户系统
- Database：PostgreSQL 存储风格报告 JSON
- Storage：存储缩略图（每条约 50-200KB）
- 免费额度：500MB DB + 1GB Storage，够早期 MVP

**数据表设计**：
```sql
style_records (
  id          uuid primary key,
  user_id     uuid references auth.users,
  source_type text,            -- 'image' | 'url'
  source_url  text,            -- URL 或图片文件名
  thumbnail_url text,          -- Supabase Storage 路径
  style_data  jsonb,           -- 完整风格报告
  tags        text[],
  created_at  timestamptz
)
```

**未登录用户**：
- 可正常使用提取和复制功能
- 保存按钮点击后弹出"登录后保存"引导
- 素材库 Tab 显示锁定态 + 注册引导

---

#### 3.4.2 库界面

**视图切换**：网格视图（默认）/ 列表视图

**卡片展示**：缩略图、主色板（5个色块）、风格标签（最多3个）、来源、保存时间
**快捷操作**：复制 Prompt / 复制 CSS / 查看详情 / 删除

**筛选与搜索**：
- 按风格标签筛选（multi-select）
- 按来源筛选（图片/URL）
- 按时间排序（最新/最早）
- 关键词搜索（匹配风格描述、标签、域名）
- 支持用户自定义标签

**边界条件**：
- 库为空 → 空状态插画 + 引导文案
- 批量删除 → 勾选后底部操作栏 + 二次确认弹窗

---

## 四、交互设计规范

### 4.1 整体交互原则

1. **零学习成本** — 首屏就是输入框，未登录也能用
2. **即时反馈** — 每步操作有视觉响应，< 100ms
3. **渐进披露** — 信息按重要度分层
4. **容错优先** — 出错不清空用户数据，给明确恢复路径

### 4.2 状态流转

```
空白 → [上传/输入] → 处理中（Skeleton + 进度文案）→ 结果展示 → 保存到库
                           ↓
                        报错状态（原因清晰 + 操作建议）
```

### 4.3 加载体验

- 提交后立即响应，顶部进度条启动
- 动态文案每 2s 切换："正在提取色彩..." → "识别字体排版..." → "生成 Prompt 与 CSS..."
- Skeleton 预占位，减少布局抖动
- 预计：图片 < 8s，URL < 15s

### 4.4 复制反馈

- 点击复制 → 按钮变绿 + "已复制 ✓"，2s 后恢复
- 全部使用 Toast 通知，禁用 `alert()`

### 4.5 移动端适配

- 响应式布局，断点 768px / 1024px
- 移动端色块点击 = 复制（不依赖 hover）
- 导出 Tab 在移动端折叠为下拉选择
- 上传支持相机直拍

---

## 五、视觉美学方向

> StyleLens 本身就是"展示高级审美"的产品，界面即最好的广告。

### 5.1 整体基调

- **Dark Mode 优先**（深色背景 + 高对比内容）
- **极简克制** — 大量留白，信息密度适中
- **高级感材质** — 半透明卡片、细边框、精致阴影

### 5.2 色彩系统

| 用途 | 色值 |
|------|------|
| 背景底色 | `#0A0A0F` |
| 卡片底色 | `rgba(255,255,255,0.04)` |
| 卡片边框 | `rgba(255,255,255,0.08)` |
| 主强调色 | `#7C5CFC`（iris 紫）|
| 成功状态 | `#4ECDC4`（青绿）|
| 主文字 | `#F0F0F5` |
| 辅助文字 | `rgba(240,240,245,0.5)` |
| 错误色 | `#FF4D6D` |

### 5.3 字体

- **界面字体**：`Inter`（英文）+ `PingFang SC` / `Noto Sans SC`（中文）
- **代码字体**：`JetBrains Mono`（CSS/JSON 区域）
- **字重层级**：700 标题 / 500 标签 / 400 正文

### 5.4 动效

- 页面进入：`opacity 0→1 + translateY(8px→0)`，300ms ease-out
- 内容加载：Skeleton shimmer
- 色块出现：staggered fade-in（每块延迟 50ms）
- Hover：`scale(1.02)` + 阴影加深，150ms
- 成功状态：轻微弹簧动效

---

## 六、技术选型建议

| 层级 | 技术 | 理由 |
|------|------|------|
| 前端框架 | Next.js 14（App Router） | SEO + SSR，易部署 |
| 样式 | Vanilla CSS + CSS Variables | 极致可控 |
| 色彩提取 | Color Thief + Vibrant.js | 纯客户端，快速 |
| AI 风格分析 | GPT-4o Vision / Claude 3.5 Sonnet | 最强视觉理解 |
| URL 截图 | Playwright（后端无头浏览器） | 稳定，支持现代前端 |
| CSS 抓取 | Playwright 拦截 Network 响应 | 获取字体、CSS 变量 |
| 数据库 | Supabase（PostgreSQL + Auth + Storage） | 多用户云端记录，免费额度充足 |
| 部署 | Vercel | 与 Next.js 天然集成 |

### 代码架构（解耦原则，每文件职责单一）

```
/app
├── page.tsx                    # 首页（提取器入口）
├── library/page.tsx            # 素材库页面
└── api/
    ├── extract/route.ts        # 风格提取 API（调 AI Vision）
    └── screenshot/route.ts     # URL 截图 API（调 Playwright）

/components
├── extractor/
│   ├── ImageUploader.tsx       # 图片上传区域
│   ├── UrlInput.tsx            # URL 输入框
│   └── AnalyzeButton.tsx       # 提交按钮 + 状态管理
├── report/
│   ├── StyleReport.tsx         # 报告整体容器
│   ├── ColorSystem.tsx         # 色彩系统展示
│   ├── Typography.tsx          # 字体排版展示
│   ├── DesignDetails.tsx       # 设计细节卡片
│   ├── StyleTags.tsx           # 风格标签徽章
│   └── ExportPanel.tsx         # 四 Tab 导出面板
├── library/
│   ├── LibraryGrid.tsx         # 素材库网格视图
│   ├── LibraryCard.tsx         # 单条记录卡片
│   └── LibraryFilters.tsx      # 筛选 & 搜索栏
└── ui/
    ├── Toast.tsx               # 全局通知
    ├── Modal.tsx               # 弹窗
    └── Skeleton.tsx            # 加载骨架屏

/lib
├── api/
│   ├── aiExtract.ts            # AI Vision 调用封装
│   └── screenshotter.ts        # Playwright 截图封装
├── parsers/
│   ├── colorParser.ts          # 色彩提取与分类
│   ├── fontParser.ts           # 字体解析
│   └── cssParser.ts            # CSS 变量解析
├── exporters/
│   ├── promptExporter.ts       # 生成风格 Prompt
│   ├── markdownExporter.ts     # 生成 Markdown 报告
│   ├── cssExporter.ts          # 生成 CSS Variables
│   └── jsonExporter.ts         # 生成 Design Token JSON
└── storage/
    ├── supabaseClient.ts       # Supabase 初始化
    └── libraryStore.ts         # 素材库 CRUD 操作
```

---

## 七、非功能性要求

| 指标 | 目标 |
|------|------|
| 图片分析响应时间 | P90 < 8s |
| URL 分析响应时间 | P90 < 15s |
| 首屏加载时间 | < 2s（LCP）|
| 移动端兼容 | iOS Safari 15+ / Chrome Android |
| 可用性 | 99% uptime |
| 数据安全 | 上传图片处理后 24h 内自动删除服务器文件 |

---

## 八、Phase 2 路线图（暂不实现）

- [ ] 多模型生图对比（Flux / DALL-E / SD）
- [ ] 风格相似度搜索（找相似风格）
- [ ] 团队协作共享素材库
- [ ] Figma 插件（直接导入 Design Token）
- [ ] 浏览器扩展（右键任意网页一键提取）

---

## 九、成功指标（Phase 1，上线后 30 天）

| 指标 | 目标值 |
|------|------|
| 注册/访问用户数 | 500 UV |
| 平均每用户使用次数 | > 3 次 |
| 提取成功率 | > 90% |
| Prompt 复制率 | > 60% |
| 库保存率 | > 30% |
| 用户自发分享 | 社交媒体提及 20+ 次 |
