{
  "id": "fui-hardcore-landing-page-v2",
  "name": "FUI (Future User Interface) 满血版硬核官网",
  "pageTypes": ["landing_page", "product_website", "developer_tools", "saas_intro"],
  "styleTags": ["sci-fi", "fui", "hud", "cyberpunk", "terminal", "dark-mode", "tech"],
  "editableCapabilities": {
    "text": "通过 [data-editable='true'] 属性识别可替换文字",
    "structure": "禁止修改现有 DOM 嵌套结构和 Tailwind 类名",
    "visibility": "如果某个 section 没有对应业务内容，可以直接将整个带有 [data-section] 属性的 HTML 标签删除，页面排版不会崩溃"
  },
  "decorativeElements": [
    "任何带有 'COORD', 'LAT', 'LON' 的经纬度坐标",
    "类似 'TX_RATE: 2.45 TB/s', 'NODE: 192.168.1.1' 的网络状态词",
    "类似 'ERR_CODE: 0x1A', 'HASH: 0x8F9A2B' 的十六进制代码",
    "带有 'SYS_UPTIME', 'SYSTEM_LOAD', 'NEURAL CORE' 等仪表盘微缩文字"
  ],
  "supportedSections": [
    {
      "id": "header",
      "mandatory": true,
      "purpose": "全局导航与系统状态栏",
      "textLimit": "导航项最多 4 个，每个最多 10 字符（英文建议）"
    },
    {
      "id": "hero",
      "mandatory": true,
      "purpose": "第一视觉冲击，展示产品核心 Slogan 和主行动按钮",
      "textLimit": "主标题 < 15 字符，副标题 < 20 字符"
    },
    {
      "id": "pain-points",
      "mandatory": false,
      "purpose": "以系统报错/异常的形式展示用户痛点",
      "textLimit": "痛点标题 < 12 字符，描述 < 50 字符"
    },
    {
      "id": "status",
      "mandatory": true,
      "purpose": "侧边栏，用于产品的一句话核心定义和假状态条",
      "textLimit": "定义段落 < 80 字符"
    },
    {
      "id": "features",
      "mandatory": true,
      "purpose": "图文结合展示产品的核心特点",
      "textLimit": "特点标题 < 10 字符，特点描述 < 50 字符"
    },
    {
      "id": "showcase",
      "mandatory": false,
      "purpose": "使用 CSS 假UI展示产品界面/架构，引导用户体验",
      "textLimit": "按钮文案 < 15 字符"
    },
    {
      "id": "functions",
      "mandatory": false,
      "purpose": "4 个核心底层引擎或技术能力的并排展示",
      "textLimit": "能力标题 < 8 字符，描述 < 40 字符"
    },
    {
      "id": "business-logic",
      "mandatory": false,
      "purpose": "横向步骤条，展示数据流向或使用步骤",
      "textLimit": "步骤标题 < 8 字符，说明 < 15 字符"
    },
    {
      "id": "architecture",
      "mandatory": false,
      "purpose": "系统架构层级划分",
      "textLimit": "层级名称 < 10 字符"
    },
    {
      "id": "core-selling-points",
      "mandatory": true,
      "purpose": "带进度条的三大核心卖点，用于长文案论述",
      "textLimit": "卖点标题 < 12 字符，详细描述 < 80 字符"
    },
    {
      "id": "product-value",
      "mandatory": false,
      "purpose": "大字号数字指标，展示产品带来的直观价值",
      "textLimit": "数字部分（含符号） < 8 字符，指标说明 < 15 字符"
    },
    {
      "id": "analytics",
      "mandatory": false,
      "purpose": "用波形图和动态数据增加“正在运行”的真实感",
      "textLimit": "仅替换部分业务名词，不要动数字结构"
    },
    {
      "id": "cta",
      "mandatory": true,
      "purpose": "终端命令行的形式引导最终转化/注册/购买",
      "textLimit": "命令行描述 < 30 字符，主按钮文案 < 15 字符"
    },
    {
      "id": "social-media",
      "mandatory": false,
      "purpose": "外部链接聚合",
      "textLimit": "链接名称 < 15 字符"
    },
    {
      "id": "footer",
      "mandatory": true,
      "purpose": "页脚状态码，模拟系统底层信息",
      "textLimit": "保持英文微缩文本，仅替换用户名等简短词"
    }
  ]
}