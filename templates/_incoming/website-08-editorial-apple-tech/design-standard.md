# Editorial Apple-Tech 殿堂级科技官网设计标准

## 核心定位

本模板定位为 Apple-Like 高端科技官网，适合企业级 SaaS、开发者工具、AI 工作流、技术基础设施和组织协作系统。

## 视觉规范

1. 一体化拟物控制台：使用 macOS/Safari 质感视窗承载功能展示、选项卡和运行流。
2. 技术蓝图感：业务逻辑图采用直角物理连线和等宽代码标注，避免随意几何拼贴。
3. 微米级点阵纹理：暖灰白背景局部使用低透明度点阵，保持精密网格感。
4. 极简画册型页脚：页脚保持中置大排版，不堆叠无意义导航。

## 颜色系统

1. 背景渐变：`#8DA4C2` 到 `#BDCDDF`。
2. 暖灰纸白：`#F4F5F3`。
3. 主文本：`#1E2530`，避免纯黑。
4. 辅助文本：`#5C6A7E`。
5. 高光金：`#FFE895`。
6. 异常珊瑚红：`#D16B54`。
7. 毛玻璃按钮：`rgba(255, 255, 255, 0.7)`，配合 `backdrop-filter: blur(16px)`。

## 字体规则

1. 标题中文使用 `Noto Serif SC, Songti SC, STSong, SimSun, Georgia, serif`。
2. 正文使用系统无衬线字体。
3. 系统标签、协议、数据日志使用等宽字体，字号控制在 10px 到 11px。
4. Hero 标题允许使用 `<i>` 强调斜体。

## 模块结构

1. `header`：品牌与 7 个锚点导航。
2. `hero`：首屏艺术主视觉、主 CTA、次 CTA。
3. `problem`：组织协同痛点陈述。
4. `solution`：非对称流转方案和三项亮点。
5. `business-flow`：分布式微服务技术拓扑。
6. `features`：左右文图交替功能说明。
7. `product-visuals`：产品界面大展示。
8. `target-users`：角色赋能说明。
9. `use-cases`：macOS 沙盒集成选项卡。
10. `workflow`：阶梯式流转步骤。
11. `metrics`：点阵数据指标。
12. `pricing`：价格方案。
13. `footer`：极简社媒页脚。

## 入库调整

1. 保留 Gemini 原始官网 HTML 作为模板源码。
2. 保留所有 `data-section`、`data-slot` 和 `contenteditable` 标记。
3. 将示例外链改为本地空链接，避免模板交付时带假链接。
4. 原始 HTML 与粘贴副本已归档到 `originals/`。
