# macOS 玻璃态数字交易大屏：设计规范

## 1. 核心视觉

- 卡片使用半透明玻璃材质，保留 `backdrop-filter` 和白色微光边框。
- 背景使用柔和多点径向渐变，支持系统深浅色自动同步。
- 主色以 Emerald/Lime、Purple/Indigo、Blue/Cyan 为核心，用于增长、技术吞吐和网络稳定状态。
- 字体优先使用系统无衬线：`-apple-system`、`BlinkMacSystemFont`、`Segoe UI`、`Roboto`、`Helvetica`、`Arial`。

## 2. 布局标准

- 页面外围留白：`p-4 md:p-8`。
- 主容器最大宽度：`max-w-[1580px]`。
- 卡片间距：`gap-6` / `space-y-8`。
- 核心模块分为 `key-takeaway`、`core-finding-1`、`core-finding-2`、`core-finding-3`。

## 3. 交互标准

- KPI 卡片 hover 时保留折线加粗和面积渐显。
- 热力点阵 hover 时显示 Tooltip、十字准线和坐标高亮。
- 嵌套圆环 hover 时中心数值和图例联动。
- 时间波形 hover 时柱体变高，时间标签和 slider 联动。
- 年度趋势图 hover 时显示垂直辅助线和玻璃态 Tooltip。
- 边缘节点 hover 时模拟延迟刷新。

## 4. 设计禁忌

- 不使用纯黑、纯白大色块作为卡片底板。
- 不出现“此处输入文字”“待补充数据”“点击进行编辑”“Lorem Ipsum”等占位文案。
- 不硬编码任何密码、Token、API Key。
- 不额外引入和当前模板风格冲突的 UI 架构。

## 5. 本次入库审查

- 原始视觉基本符合 Gemini 提供的 macOS 通透玻璃态规范。
- 原始 HTML 缺少项目标准需要的数据标记，已在入库版补齐。
- 原始说明和 HTML 存在图表数量不一致：说明为 12 个，HTML 实际为 10 个。
