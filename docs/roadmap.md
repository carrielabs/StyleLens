# 已知空白与待办

写文档过程中发现的代码与（原有）文档不一致、或信息不完整的地方，按类别整理，不代表优先级排序。

## 文档与代码不一致（优先级较高，容易误导新成员）

1. **AI 视觉分析提供商不一致**：立项文档 `VISUAL_AND_TECHSTACK.md` 明确写"选 Claude 3.5 Sonnet 做 Vision 分析"，实际代码用的是 Google Gemini（`lib/api/aiExtract.ts`）。`@anthropic-ai/sdk` 仍在依赖列表里，但本次审查没有找到它的实际调用位置，需要确认是否还在用、用在哪里。
2. **`.env.example` 缺少 Gemini 相关变量，且保留了未确认仍在使用的 `ANTHROPIC_API_KEY`**：按现在的 `.env.example` 配置环境，AI 提取功能大概率跑不起来。这是新成员上手的直接阻塞项，建议优先修复。
3. **URL 截图方案不一致**：立项文档规划 Browserbase/ScreenshotOne 云服务，实际是 Playwright 直接跑 Chromium；但 `SCREENSHOT_ONE_API_KEY` 仍保留在 `.env.example` 和代码引用里，需要确认是否有残留调用路径。
4. **`style_records` 表字段比立项文档规划的更精简**：立项文档设计过的 `source_type`、`tags` 字段在实际建表 SQL 里不存在。

## 代码内部的技术债信号

5. **`DesignDetails` 存在四个版本**（`DesignDetails.tsx` / `Elite` / `EliteV2` / `EliteV3`），需要确认当前实际使用哪个版本，清理掉废弃版本。
6. **环境变量疑似存在命名笔误**：`STYLELENS_GEMINI_API_KEY_` 和 `SCREENSHOT_ONE_API_KEY_` 末尾多了一个下划线，与不带下划线的版本同时存在，需要确认是有意的多 Key 机制还是笔误。
7. 仓库根目录历史上散落过较大的非代码文件；当前已将测试截图素材归档到 `test/fixtures/visual/`，历史设计稿归档到 `docs/archive/`。`.screenshot_cache.json` 是本地缓存，继续由 `.gitignore` 忽略。

## 半成品功能（代码已写，未正式开放）

8. `lib/flags.ts` 控制的五项报告增强能力（设计审查、证据/覆盖度/交互摘要、页面审查）已有对应的规格文档（`docs/superpowers/specs/2026-04-09-stylelens-extraction-report-design.md`），但默认关闭，产品文档层面应明确标注"开发中"状态，避免被误认为已上线功能。

## 安全与数据

9. **BYOK Key 的存储方式未确认**：用户自带的 Gemini Key 存在哪里、是否加密，是一个涉及用户密钥安全的问题，需要开发者明确说明并写进文档，不应该留白。
10. **图片上传后的"24 小时自动删除"承诺**（立项文档里的非功能性要求）是否有对应的实际清理任务，未在本次审查中确认。

## 关于这份文档本身

这套 `docs/guide|features|reference` 是基于对代码库的静态审查编写的，没有运行项目、没有实际调用过 API。标注为"待确认"的内容都是审查范围内无法从代码直接验证的部分。原有的 `PRD_StyleExtractor.md` 和 `VISUAL_AND_TECHSTACK.md` 予以保留作为 Phase 1 立项时的历史参考，两者与当前代码的落差已经在 `guide/` 和本文档里逐条标注，不需要去修改那两份原始文档本身。
