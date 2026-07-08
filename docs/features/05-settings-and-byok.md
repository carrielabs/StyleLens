# 05 · 设置与 BYOK（自带 API Key）

## 立项文档里完全没有的能力

`components/settings/SettingsView.tsx`（+ `ApiKeysSection` 等子组件）、`components/common/SettingsModal.tsx` 构成了一套独立的设置工作区，组件注释里写着"Claude 风格的高级设置工作区"（"Claude-inspired Premium Workspace Settings"），说明这块 UI 的视觉参照对象是 Claude 的设置界面风格，这是一处纯视觉/体验层面的设计决策，与产品是否用 Claude 做 AI 分析无关（实际 AI 分析用的是 Gemini，见 `features/01-extraction-pipeline.md`，两者不要混淆）。

## BYOK 是什么、为什么需要

代码里出现了 `STYLELENS_GEMINI_API_KEY` 这个环境变量，结合"设置里有 API Keys 板块"的事实，可以确认产品支持用户配置自己的 Gemini API Key（Bring Your Own Key）。这类能力常见的产品动机包括：控制 AI 调用成本（把成本转嫁给愿意自带 Key 的重度用户）、绕开官方 Key 的速率限制、或作为国内网络访问受限时的备用方案（用户自己的 Key 可能配置了自己的代理/中转）。具体是以上哪个动机、BYOK 与官方默认 Key 之间的优先级和降级逻辑，未在本次审查中逐行确认 `ApiKeysSection` 的实现细节。

## 待确认

- BYOK 与系统默认 Key 的优先级/降级规则。
- 设置里除了 API Keys 板块，是否还有其他设置项（如语言、主题偏好等），需要开发者补充。
- 用户自带的 Key 是否加密存储、存在哪里（Supabase 还是仅浏览器本地），这是一个涉及用户密钥安全的问题，建议开发者明确说明，不应该在文档里留空白。
