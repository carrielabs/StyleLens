# 03 · 历史记录、素材库与登录

## 游客也能有"历史"

和立项文档"未登录只能复制不能保存"的简单描述不同，实际实现里游客有一套完整的本地历史体验：

- 提取结果自动缓存在 `localStorage`（`lib/storage/guestStore.ts`），不需要登录就能在同一浏览器里回看最近的提取记录。
- 支持重命名、删除、置顶（`useHistory.ts` 暴露的能力）。
- 删除操作有 10 分钟的"墓碑"保护（见 `guide/03-data-model.md`），避免删除后又被同步逻辑复活。

## 登录后的账号历史与自动迁移

登录后，历史记录从 `localStorage` 切换到 Supabase 的 `style_records` 表。`useHistory.ts` 里的 `getGuestMigrationSnapshot`/`clearGuestMigrationSnapshot` 说明登录时会对游客本地历史做一次快照并尝试迁移到账号下，具体的迁移触发时机（登录瞬间自动做，还是需要用户手动确认）和冲突处理策略（如果账号里已经有同来源的记录怎么办）未在本次审查中逐行确认。

## 素材库页面（`/library`）

`app/library/page.tsx` 是一个 Server Component，未登录直接 `redirect('/auth')`——也就是说素材库本身是登录墙保护的页面，和首页"游客也能用提取器"的开放策略形成对比：提取器开放、库页面收拢，这是刻意的产品设计，符合立项文档"账号只为保存/沉淀"的定位。

数据获取走 `fetchLibrary('newest', supabase)`，支持按最新排序（`newest` 参数暗示可能还有其他排序方式，未逐一确认）。

## 登录方式

`components/auth/AuthOverlay.tsx` + `app/auth/callback` 说明登录走的是 Supabase Auth 的标准 OAuth/邮箱回调流程，具体支持哪些登录方式（邮箱、Google 等，立项文档提过"邮箱/Google 登录"）未在本次审查中逐行确认对应代码是否已经实现全部选项。

## 待确认

- 迁移冲突处理策略。
- `fetchLibrary` 支持的完整排序/筛选选项。
- 实际启用的登录方式列表。
