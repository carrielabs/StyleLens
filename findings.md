# StyleLens 工作区拆分发现记录

## 当前代码现状

1. 当前仓库在正式目录 `/Users/shaobaolu/Downloads/AI 工程/Vibe coding 项目/StyleLens`。
2. 当前分支为 `main...origin/main`，开工时工作区干净。
3. `HomeWorkspace` 目前同时承载风格提取入口和模板生成入口。
4. `HomeSidebar` 目前是 `New Extraction` / `Search`，没有两个工作区菜单。
5. 真实模板数据已经在 `HomeWorkspace.tsx` 中硬编码为官网 8 个、Dashboard 15 个。
6. 模板预览 API 已存在：`app/api/template-preview/[templateId]/route.ts`。
7. 生成 API 已存在：`usePublisher.generatePage` 和 `usePublisher.generateDashboardFromFile`。
8. 生成结果页已有 iframe 预览和下载逻辑：`GeneratedPagePreview.tsx`。
9. 当前历史系统主要服务风格提取记录，生成 HTML 记录还没有独立结构。

## 实现策略

1. 保留现有风格提取主流程。
2. 新增 Publisher 相关组件，避免继续扩张 `HomeWorkspace`。
3. 生成历史第一版放在 `usePublisher` 的本地状态中，满足当前会话内左侧分流展示和打开生成结果。
4. 后续如需跨登录持久化，再单独设计数据库表或 Supabase 存储，不硬塞进 `style_records.style_data`。
