HTML 模板模块槽位 (Template Slots) v2.0

该文档定义了 template.html 中的结构化数据槽位。所有需要由 AI/Codex 动态注入内容的 DOM 节点，均同时具备 data-editable="true" 和唯一的 data-key="[key_name]" 属性。

页面被划分为 10 个独立区块，每个区块拥有独立的 data-section="[section_name]"，方便 AI 精准定位上下文。

1. Header (顶部导航)

section_id: header

Slots:

brand_name (Text): 品牌 Logo 纯文本

nav_1, nav_2, nav_3 (Text): 导航链接文本

2. Hero (核心首屏)

section_id: hero

Slots:

hero_title (HTML): 巨型主标题，内部支持 <br> 换行以及携带 .motion-smudge 滤镜的 <span> 标签。

hero_desc (Text): 核心愿景陈述文本。

hero_btn_primary, hero_btn_secondary (Text): 双按钮文本。

3. Philosophy (理念与价值)

section_id: philosophy

Slots:

phil_tag (Text): 模块小标签（大写英文最佳）。

phil_title (HTML): 核心理念引言（支持 <br>）。

phil_desc (Text): 理念阐述段落。

4. Features (动能特征)

section_id: features

Slots:

feat_title (Text): 模块大标题。

feat_desc (Text): 模块说明段落。

5. Core Values (核心卖点卡片)

section_id: core-values

Slots:

val1_title, val1_desc (Text): 卖点 1 标题与描述

val2_title, val2_desc (Text): 卖点 2 标题与描述

val3_title, val3_desc (Text): 卖点 3 标题与描述

6. Gallery (视觉画廊)

section_id: gallery

Slots:

gal_tag (Text): 画廊区顶部标签

gal_1, gal_2, gal_3 (Text): 悬停在画廊卡片上时显示的文本。

7. Statistics (数据展示)

section_id: statistics

Slots:

stat1_num, stat1_text (Text): 数据指标 1

stat2_num, stat2_text (Text): 数据指标 2

stat3_num, stat3_text (HTML/Text): 数据指标 3（如无穷符号 &infin;）

8. Testimonials (用户回声)

section_id: testimonials

Slots:

test_tag (Text): 模块小标签

test_quote (Text): 用户反馈引言正文

test_author, test_role (Text): 发声者姓名及职位身份

9. Literature (文献/文档入口)

section_id: literature

Slots:

lit_title, lit_desc, lit_btn (Text/HTML): 左侧文献导语及按钮。

lit_doc1_title, lit_doc1_desc (Text): 推荐文档卡片 1。

lit_doc2_title, lit_doc2_desc (Text): 推荐文档卡片 2。

10. CTA & Footer (底部行动号召与页脚)

section_id: cta / footer

Slots:

cta_title, cta_desc, cta_btn (HTML/Text): 页面底部终极转化区域。

foot_copy (Text): 版权声明。

social_1, social_2, social_3 (Text): 社交媒体文本。

foot_slogan (Text): 底部品牌口号。