# 03 · 数据模型

数据层基于 Supabase（Postgres + Auth + Storage）。以下内容结合 `setup_supabase.sql`（仓库根目录）与 `lib/storage/libraryStore.ts` 的调用整理，立项文档 `PRD_StyleExtractor.md` 和 `VISUAL_AND_TECHSTACK.md` 里也各给出过一版 `style_records` 表设计，三者字段定义并不完全一致（例如主键字段名、`source_type`/`source_label` 的措辞），说明表结构在实际建表时有过调整。本文档以 `setup_supabase.sql`（离代码最近的一份）为准，其余版本仅作历史参考。

## 核心表：`style_records`

字段以仓库根目录 `setup_supabase.sql` 为准（已核实）：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `uuid` | 主键，默认 `gen_random_uuid()` |
| `user_id` | `uuid` | 外键关联 `auth.users`，`NOT NULL`，级联删除 |
| `source_label` | `text` | 来源标签（文件名或域名，可为空） |
| `thumbnail_url` | `text` | 缩略图地址（Supabase Storage） |
| `style_data` | `jsonb` | 完整风格报告数据，`NOT NULL` |
| `created_at` | `timestamptz` | 默认 `now()` |

注意：这份实际表结构比两份立项文档里设计的都要精简——立项文档规划过 `source_type`（image/url 枚举）和 `tags`（标签数组）两个字段，但实际 SQL 里都没有。这两个字段是"设计了但没实现"还是"实现了但换了字段名放在 `style_data` JSONB 里"，需要开发者确认，已记录到 `roadmap.md`。

RLS（行级安全）已启用，四条策略（SELECT/INSERT/UPDATE/DELETE）都限定 `auth.uid() = user_id`，用户只能读写自己的记录，与立项文档的安全设计意图一致。另建了两个索引：按 `user_id` 查询、按 `user_id + created_at DESC` 排序查询，对应素材库"按时间排序 + 按用户隔离"的典型查询模式。

## 游客数据（不进数据库）

未登录用户的历史记录不写数据库，而是存在浏览器 `localStorage`（`lib/storage/guestStore.ts`），关键点：

- `GUEST_TRIAL_KEY`（`stylelens_trial_used`）：推测用于标记游客是否已经用过一次试用，具体触发的产品逻辑（例如"游客只能提取 N 次"）未在本次审查中确认。
- `HISTORY_DELETE_TOMBSTONES_KEY`（`stylelens_history_delete_tombstones`，TTL 10 分钟）：游客删除一条历史记录后，会在本地留一个"墓碑"记录 10 分钟，防止后续的迁移/同步逻辑把刚删除的记录误当作"新记录"重新写回去。这是一个专门为处理"本地状态和迁移逻辑之间竞态问题"设计的机制，说明游客历史这条线在实现上经过了不止一轮打磨。

## 游客 → 账号的迁移

`hooks/useHistory.ts` 里有 `getGuestMigrationSnapshot` / `clearGuestMigrationSnapshot` 等函数，说明登录时会对游客本地历史做一次"快照 + 迁移"处理，迁移的具体规则（是全量迁移，还是需要用户确认，冲突如何处理）未逐行确认，建议开发者直接在这个 hook 里补充一段迁移流程说明。

## 待确认

- `source_type`（image/url）和 `tags` 两个立项文档设计过的字段，在实际表里不存在，需要确认是被合并进了 `style_data` JSONB，还是这两个能力（按来源类型筛选、自定义标签）根本没有实现。
- 是否存在正式的 migration 管理，还是和 KeyFrame 类似，靠手工维护一份 `setup_supabase.sql` 脚本，需要开发者确认。
