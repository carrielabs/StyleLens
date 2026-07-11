# Premium Cyber Dark 设计标准

## 核心原则

高端暗色、克制质感、信息密度清晰。用于聊天分析、企业业务分析、日常汇报和用户画像报告，避免廉价 AI 生成感。

## 色彩

- 页面背景：从 `#0b0f19` 到 `#1a1122` 的深蓝灰至暗红紫渐变。
- 卡片背景：`rgba(255, 255, 255, 0.03)`。
- 卡片描边：`1px solid rgba(255, 255, 255, 0.06)`。
- 卡片悬停描边：`1px solid rgba(255, 255, 255, 0.15)`。
- 信息/均值：`#38bdf8`。
- 情感/巅峰/个人：`#f43f5e`。
- 活跃度/连续打卡：`#fbbf24`。
- 率值/转化率/正向指标：`#34d399`。
- 多维对比/复杂图表：`#a78bfa`。

## 字体

- 字体族：`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`, `PingFang SC`, `Microsoft YaHei`, `sans-serif`。
- 大数值/KPI：`font-semibold` 或 `font-medium`，优先使用等宽数字。
- 主标题：`font-bold`。
- 辅助文本：`font-normal`。
- 巨型关键数字：48px-64px。
- 模块主标题：24px。
- 卡片高亮数据：20px-24px。
- 卡片次级标签：14px，颜色 `#94a3b8`。
- 微缩提示/日期：12px，颜色 `#64748b`。

## 布局

- 页面容器：`max-w-7xl`，居中，左右至少 32px 内边距。
- 模块间距：`py-10` 或 `my-10`。
- 主 KPI 横栏：`grid-cols-2 md:grid-cols-4`。
- 常规核心指标网格：`grid-cols-2 lg:grid-cols-4`。
- 双栏深度对比：`grid-cols-1 lg:grid-cols-2`。
- 卡片内边距：移动端 `p-4`，桌面端 `p-6`。

## 视觉细节

- 外层大卡片：`rounded-2xl`，最大不超过 20px。
- 小标签/徽章：`rounded-lg`。
- 热力图格子：等宽等高，`rounded-[3px]`。
- 未活跃热力格：`rgba(255, 255, 255, 0.05)`。
- 分割线：仅必要时使用 1px，颜色 `rgba(255, 255, 255, 0.06)`。

## 交互

- 卡片悬停：轻微提亮背景和描边，过渡 300ms。
- 图表：使用原生 SVG，设置 `viewBox` 并保持 `width="100%" height="100%"`。
- 无框按钮：`border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 rounded-lg px-3 py-1 text-xs transition`。
- 所有 `data-editable="true"` 元素必须同时带 `contenteditable="true"` 和 `data-slot`。
