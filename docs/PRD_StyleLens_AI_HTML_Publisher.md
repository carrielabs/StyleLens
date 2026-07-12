# StyleLens 2.0 PRD：风格提取 + HTML 页面生成

## 1. 产品定位

StyleLens 2.0 是一个从参考风格到可编辑 HTML 页面的一体化工具。

当前 StyleLens 已经支持：

1. 输入官网 URL，提取网站视觉风格。
2. 上传图片 / 截图，提取视觉风格。
3. 输出风格报告、Prompt、CSS、历史记录。

本次升级新增：

1. 粘贴文本材料或上传 `.md` / `.txt` 文件。
2. 上传 `.csv` / `.json` / `.xlsx` 数据文件。
3. 生成产品官网 HTML 或 Dashboard HTML。
4. 在线预览生成结果。
5. 下载完整 HTML。

一句话定位：

> StyleLens：从参考风格到可编辑 HTML 页面。

副标题：

> 提取网站风格，或把文本材料 / 数据文件生成可编辑 HTML。

## 2. 当前版本范围

当前版本做“风格提取 + 官网生成 + Dashboard 生成”三个清晰工作区能力。

本版本包含：

1. 左侧两个工作区：`提取视觉风格`、`生成页面与看板`。
2. URL / 图片继续走风格提取。
3. 文本 / `.md` / `.txt` 走官网生成。
4. `.csv` / `.json` / `.xlsx` 走 Dashboard 生成。
5. 官网开放现有 8 个 website 模板。
6. Dashboard 开放现有 15 个 dashboard 模板。
7. 模板支持全屏预览、选择模板、生成后预览和下载 HTML。
8. 生成结果内置页面编辑和高级编辑运行时。

本版本不包含：

1. PPT / 其他页面类型生成。
2. PDF / Word 输入。
3. 使用提取风格自动重绘整站。
4. 多用户协作编辑。
5. 在线托管发布。
6. GitHub Skill 封装。

PPT、Skill、GitHub 开源是后续阶段，不进入当前版本。

## 3. 用户流程

### 3.1 提取风格

```text
用户打开 StyleLens
↓
粘贴官网 URL，或上传图片 / 截图
↓
系统识别为“风格提取”
↓
用户点击“提取风格”
↓
输出风格报告
↓
保存到历史记录
```

### 3.2 生成官网

```text
用户打开 StyleLens
↓
切换到“生成页面与看板”
↓
选择“网站官网”
↓
浏览 8 个官网模板，必要时全屏预览
↓
点击“立即使用此模板”
↓
粘贴产品文案 / PRD / 项目介绍，或上传 .md / .txt
↓
用户点击“立即生成”
↓
系统生成可编辑官网 HTML
↓
用户预览
↓
用户下载 index.html
```

### 3.3 生成 Dashboard

```text
用户打开 StyleLens
↓
切换到“生成页面与看板”
↓
选择“数据看板”
↓
浏览 15 个 Dashboard 模板，必要时全屏预览
↓
点击“立即使用此模板”
↓
上传 .csv / .json / .xlsx 数据文件
↓
用户点击“立即生成”
↓
系统解析字段、提取指标、生成可编辑 Dashboard HTML
↓
用户预览
↓
用户下载 index.html
```

### 3.4 后续组合流程

```text
用户先丢一个喜欢的网站
↓
StyleLens 提取风格
↓
用户再丢自己的产品文案
↓
系统用选定模板生成官网
↓
后续版本再支持套用已提取风格
```

当前版本只保留“选择模板”，不强制接“套用风格”。

## 4. 首页交互

当前首页拆成两个工作区，不再把风格提取和页面生成揉在同一个输入框里。

建议界面结构：

```text
StyleLens

左侧工作区：
[ 提取视觉风格 ]
[ 生成页面与看板 ]

提取视觉风格：
[ 粘贴网址 ]
[ 上传图片 / 截图 ]

生成页面与看板：
[ 网站官网 ] [ 数据看板 ]
[ 8 个官网模板 / 15 个 Dashboard 模板 ]
[ 全屏预览 ]
[ 立即使用此模板 ]
[ 右侧抽屉：粘贴文本或上传文件 ]
[ 立即生成 ]
```

识别规则：

1. 提取视觉风格工作区：URL 执行风格提取。
2. 提取视觉风格工作区：图片执行风格提取。
3. 生成页面与看板工作区 + 网站官网：文本 / `.md` / `.txt` 执行官网生成。
4. 生成页面与看板工作区 + 数据看板：`.csv` / `.json` / `.xlsx` 执行 Dashboard 生成。

按钮文案：

1. URL / 图片：`提取风格`
2. 文本 / `.md` / `.txt`：`立即生成 HTML`
3. `.csv` / `.json` / `.xlsx`：`立即生成 HTML`

## 5. 生成能力

官网和 Dashboard 生成由 AI HTML Publisher 的核心能力提供。

输入：

1. `sourceText`：用户粘贴或上传的文本。
2. `templateId`：模板 ID。
3. `pageType`：`product-website` 或 `dashboard`。
4. `file`：Dashboard 数据文件，支持 `.csv` / `.json` / `.xlsx`。

输出：

1. `html`：完整 HTML 字符串。
2. `templateId`：实际使用模板。
3. `title`：从输入材料提取的页面标题。

必须满足：

1. 不依赖外部 CDN。
2. 不保留模板样例业务数据。
3. 不保留 `localhost`、`href="#"`、`onclick` 等上线阻塞内容。
4. HTML 内置编辑运行时。
5. 用户下载后可以直接打开、编辑、保存、导出。

## 6. 模板范围

官网开放：

1. `website-01-fui`
2. `website-02-soft-surrealism`
3. `website-03-red-clay`
4. `website-04-premium-midnight`
5. `website-05-voltflow-cyber-saas`
6. `website-07-blueprint-agent-platform`
7. `website-08-editorial-apple-tech`
8. `website-09-blue-shift-portfolio`

Dashboard 开放：

1. `dashboard-01-blue-business`
2. `dashboard-02-premium-dark`
3. `dashboard-03-lean-cyber-analytics`
4. `dashboard-04-premium-midnight`
5. `dashboard-05-premium-cyber-dark`
6. `dashboard-06-warm-paper-analytics`
7. `dashboard-07-dark-bento-analytics`
8. `dashboard-08-saas-executive-analytics`
9. `dashboard-09-editorial-corporate-analytics`
10. `dashboard-10-executive-logic-report`
11. `dashboard-11-saas-growth-health-report`
12. `dashboard-12-atomic-bento-strategy-report`
13. `dashboard-13-corporate-blue-analytics-report`
14. `dashboard-14-financial-blue-analytics-report`
15. `dashboard-15-consulting-data-report`

## 7. 预览与下载

生成完成后进入结果页。

结果页包含：

1. HTML 预览区。
2. 模板名称。
3. 页面标题。
4. `下载 HTML` 按钮。
5. `重新生成` 按钮。

当前版本下载即可，不做在线托管。

预览建议使用 sandbox iframe，避免生成 HTML 影响 StyleLens 主页面。

## 8. 历史记录

当前生成历史先使用前端本地状态，不接入 Supabase 持久化。

最低要求：

1. 风格提取历史保持原逻辑。
2. 页面生成成功后能立即预览和下载。
3. 左侧能按工作区展示当前会话内的生成历史。

后续再增加：

1. 页面生成历史接入 Supabase。
2. 删除 / 重命名 / 收藏生成记录。

## 9. 技术接入方式

不要把两个项目硬拼。

推荐方式：

```text
StyleLens 作为主项目
AI HTML Publisher 作为生成模块迁入 StyleLens
```

目标结构：

```text
StyleLens/
├── app/
│   └── api/
│       └── generate/
│           └── route.ts
├── components/
│   └── publisher/
├── lib/
│   └── publisher/
├── templates/
└── docs/
```

`lib/publisher/` 负责：

1. 内容结构化。
2. 模板加载。
3. HTML 注入。
4. 运行时注入。
5. 输出 HTML 字符串。

`app/api/generate/route.ts` 负责：

1. 校验请求。
2. 调用 publisher。
3. 返回 HTML。

前端负责：

1. 工作区切换。
2. 上传 `.md` / `.txt` / `.csv` / `.json` / `.xlsx`。
3. 发起生成请求。
4. 展示预览。
5. 下载 HTML。

## 10. 验收标准

当前版本完成后必须通过：

1. 原 StyleLens URL 风格提取仍可用。
2. 原 StyleLens 图片风格提取仍可用。
3. 粘贴文本可以生成官网。
4. 上传 `.md` 可以生成官网。
5. 上传 `.txt` 可以生成官网。
6. 8 个官网模板都能生成。
7. 上传 `.csv` 可以生成 Dashboard。
8. 上传 `.json` 可以生成 Dashboard。
9. 上传 `.xlsx` 可以生成 Dashboard。
10. 15 个 Dashboard 模板都能生成。
11. 生成产物不包含外部 CDN、Google Fonts、`localhost`、`onclick`、`href="#"`。
12. 生成结果可以在页面中预览。
13. 生成结果可以下载为 `index.html`。
14. 下载后的 HTML 可以本地打开。
15. 生成结果支持即时编辑和高级编辑。
16. 原有测试通过。
17. 新增生成接口测试通过。

## 11. 后续路线

第二阶段：

1. 用已提取风格影响生成页面主题色、字体和视觉参数。
2. 页面生成历史接入 Supabase。

第三阶段：

1. 封装 GitHub 开源包。
2. 封装 Codex Skill。
3. 支持其他 Agent 调用。

第四阶段：

1. PPT / 其他页面类型。
2. PDF / Word / Excel 输入。
3. 在线发布托管。
