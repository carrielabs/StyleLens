# BLUE SHIFT 极简主义设计标准 V2.0

本模板面向“新结构主义数字作品集”，核心目标是黑底、直角网格、极细白线、青蓝绿紫液态光晕和技术图纸式元数据。

## 色彩与光影

- 水母核心青：`rgba(0, 242, 254, 0.95)`，`mix-blend-mode: screen`，作为第一视觉落点。
- 水母中层蓝：`rgba(15, 60, 255, 0.8)`，用于控制深冷边界。
- 水母霓虹绿：`rgba(0, 255, 180, 0.65)`，用于右侧虹彩过渡。
- 水母柔光紫：`rgba(135, 50, 255, 0.35)`，用于环境冷光。
- 顶部与底部均保留流体发光场，中部作品网格保持黑色缓冲区。
- 光影实现采用多点色块混合、SVG 噪声湍流形变和局部模糊。

## 字体

- 主体字体：Inter。
- 技术元数据：JetBrains Mono。
- 大标题：最高 `6.5rem / 104px`，带 `drop-shadow(0 0 20px rgba(0, 242, 254, 0.18))`。
- 技术标签：`10px`，`tracking: 0.35em`，全大写。

## 结构

- 所有新增模块保持直角网格，不使用圆角。
- 卡片使用 1px 极细白线边框。
- 主体模块顺序：`navbar`、`hero`、`philosophy`、`works`、`methodology`、`metrics`、`milestones`、`contact`。

## 交互

- `works` 卡片点击触发 `openDetailModal(...)`。
- `methodology` 卡片点击触发 `openDetailModal(...)`。
- `methodology` 卡片 Hover 时边框透明度提高，内部 SVG 线稿缩放，前导方块亮起。
- `metrics` 卡片 Hover 时 SVG 折线产生波动，仪表圈使用 `stroke-dasharray` 蓄力发光。

## 入库约束

- 可替换文字必须有 `data-editable="true"`、`contenteditable="true"`、`data-slot` 和 `data-key`。
- 不在模板内实现平台级预览、编辑、主题切换、导出和恢复能力。
- 缺少真实内容时保留默认文案，不写假链接和假数据。
