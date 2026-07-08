# StyleLens 2.0 PRD：风格提取 + HTML 页面生成

## 1. 产品定位

StyleLens 2.0 是一个从参考风格到可编辑 HTML 页面的一体化工具。

当前 StyleLens 已经支持：

1. 输入官网 URL，提取网站视觉风格。
2. 上传图片 / 截图，提取视觉风格。
3. 输出风格报告、Prompt、CSS、历史记录。

本次升级新增：

1. 粘贴文本材料或上传 `.md` / `.txt` 文件。
2. 生成产品官网 HTML。
3. 在线预览生成结果。
4. 下载完整 HTML。

一句话定位：

> StyleLens：从参考风格到可编辑 HTML 页面。

副标题：

> 提取网站风格，或把文本材料生成可编辑官网。

## 2. 当前版本范围

第一版只做“文本生成产品官网”。

本版本包含：

1. 统一输入区。
2. URL / 图片继续走风格提取。
3. 文本 / `.md` / `.txt` 走官网生成。
4. 页面类型第一版只开放“官网”。
5. 模板第一版只开放现有 8 个 website 模板。
6. 生成后支持预览和下载 HTML。

本版本不包含：

1. dashboard 生成。
2. PPT / 其他页面类型生成。
3. PDF / Word / Excel 输入。
4. 使用提取风格自动重绘整站。
5. 多用户协作编辑。
6. 在线托管发布。
7. GitHub Skill 封装。

dashboard、Skill、GitHub 开源是后续阶段，不进入第一版。

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
粘贴产品文案 / PRD / 项目介绍，或上传 .md / .txt
↓
系统识别为“生成官网”
↓
用户选择模板
↓
用户点击“生成官网”
↓
系统生成可编辑 HTML
↓
用户预览
↓
用户下载 index.html
```

### 3.3 后续组合流程

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

第一版只保留“选择模板”，不强制接“套用风格”。

## 4. 首页交互

当前首页中间区域从“只支持 URL / 图片”升级为“智能输入区”。

建议界面结构：

```text
StyleLens

提取网站风格，或把文本材料生成可编辑官网。

[ 粘贴网址、产品文案、PRD、报告内容... ]

或

[ 上传图片 / 截图 / .md / .txt 文件 ]

用途：
[ 自动识别 ] [ 提取风格 ] [ 生成官网 ]

模板：
[ FUI ] [ Soft Surrealism ] [ Red Clay ] [ Premium Midnight ] ...

[ 提取风格 / 生成官网 ]
```

识别规则：

1. 输入内容是 `http://` 或 `https://` 开头：默认识别为 URL，执行风格提取。
2. 上传图片：执行风格提取。
3. 输入长文本：默认识别为文本材料，执行官网生成。
4. 上传 `.md` / `.txt`：执行官网生成。
5. 用户可以手动切换用途，避免自动识别错误。

按钮文案：

1. URL / 图片：`提取风格`
2. 文本 / `.md` / `.txt`：`生成官网`

## 5. 官网生成能力

官网生成由 AI HTML Publisher 的核心能力提供。

输入：

1. `sourceText`：用户粘贴或上传的文本。
2. `templateId`：模板 ID。
3. `pageType`：第一版固定为 `product-website`。

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

第一版只开放：

1. `website-01-fui`
2. `website-02-soft-surrealism`
3. `website-03-red-clay`
4. `website-04-premium-midnight`
5. `website-05-voltflow-cyber-saas`
6. `website-07-blueprint-agent-platform`
7. `website-08-editorial-apple-tech`
8. `website-09-blue-shift-portfolio`

dashboard 模板暂不开放。

原因：

1. dashboard 当前只有模板入库。
2. 还没有独立数据报告结构器。
3. 还没有 dashboard 注入链路。
4. 若提前开放，会造成产品承诺和实际能力不一致。

## 7. 预览与下载

生成完成后进入结果页。

结果页包含：

1. HTML 预览区。
2. 模板名称。
3. 页面标题。
4. `下载 HTML` 按钮。
5. `重新生成` 按钮。

第一版下载即可，不做在线托管。

预览建议使用 sandbox iframe，避免生成 HTML 影响 StyleLens 主页面。

## 8. 历史记录

第一版可以先不把生成结果接入 Supabase 历史。

最低要求：

1. 风格提取历史保持原逻辑。
2. 页面生成成功后能立即预览和下载。

第二阶段再增加：

1. 页面生成历史。
2. 重新打开历史生成页。
3. 删除 / 重命名 / 收藏生成记录。

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

1. 智能输入识别。
2. 上传 `.md` / `.txt`。
3. 发起生成请求。
4. 展示预览。
5. 下载 HTML。

## 10. 验收标准

第一版完成后必须通过：

1. 原 StyleLens URL 风格提取仍可用。
2. 原 StyleLens 图片风格提取仍可用。
3. 粘贴文本可以生成官网。
4. 上传 `.md` 可以生成官网。
5. 上传 `.txt` 可以生成官网。
6. 8 个官网模板都能生成。
7. 生成产物不包含外部 CDN、Google Fonts、`localhost`、`onclick`、`href="#"`。
8. 生成结果可以在页面中预览。
9. 生成结果可以下载为 `index.html`。
10. 下载后的 HTML 可以本地打开。
11. 原有测试通过。
12. 新增生成接口测试通过。

## 11. 后续路线

第二阶段：

1. 接入 dashboard 生成链路。
2. 新增数据报告内容结构器。
3. dashboard 生成结果预览和下载。

第三阶段：

1. 用已提取风格影响生成页面主题色、字体和视觉参数。
2. 页面生成历史接入 Supabase。

第四阶段：

1. 封装 GitHub 开源包。
2. 封装 Codex Skill。
3. 支持其他 Agent 调用。

第五阶段：

1. PPT / 其他页面类型。
2. PDF / Word / Excel 输入。
3. 在线发布托管。
