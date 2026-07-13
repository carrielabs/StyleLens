# 原始设计规范归档

来源：用户粘贴的 Gemini《macOS 极致通透数据大屏：设计规范与视觉标杆》。

核心要求摘要：

1. 使用 Glassmorphism：半透明底色、`backdrop-filter: blur(25px)`、白色微光边缘、多层软阴影。
2. 页面留白：外围 `p-4 md:p-8`，卡片内边距 `p-6`，网格间距 `gap-6`。
3. 主配色：Emerald/Lime、Purple/Indigo、Blue/Cyan。
4. 模块结构：`key-takeaway`、`core-finding-1`、`core-finding-2`、`core-finding-3`。
5. 交互要求：KPI Sparkline、漏斗、热力点阵、嵌套圆环、时间直方图、趋势折线图等具备 hover 反馈。
6. 中文排版：系统无衬线字体，正文使用舒适行高。
7. 禁止项：禁止纯黑纯白硬底板、占位文案、虚假指标、生硬高浓度阴影。

入库核对结论：

- HTML 视觉大体符合玻璃态、渐变背景、系统字体和 hover 交互要求。
- HTML 实际未交付漏斗图、雷达图、瀑布图、排行图。
- HTML 原件缺少项目的数据槽位属性，入库版已补齐。
