# StyleLens

> 视觉风格提取工具 — 上传图片或网站 URL，30 秒内获得完整可用的风格系统

## 功能

- 🎨 提取色彩系统（主色、辅色、背景色、强调色）
- 🔤 识别字体排版规范
- 🏷️ 生成设计风格标签
- 📋 一键复制 Prompt / Markdown / CSS Variables / Design Token JSON
- 📚 个人风格素材库（账号登录后云端保存）

## 技术栈

- **框架**: Next.js 15 (App Router) + TypeScript
- **样式**: Vanilla CSS + CSS Modules
- **数据库**: Supabase (PostgreSQL + Auth + Storage)
- **AI 分析**: Anthropic Claude 3.5 Sonnet (Vision)
- **色彩提取**: Vibrant.js (客户端)
- **URL 截图**: ScreenshotOne API
- **部署**: Vercel

## 开发

```bash
npm install
cp .env.example .env.local
# 填写环境变量
npm run dev
```

## 环境变量

参考 `.env.example`
