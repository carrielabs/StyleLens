'use client'

import type { StyleReport as ReportType } from '@/lib/types'
import { useState } from 'react'
import ColorSystem from './ColorSystem'
import Typography from './Typography'
import DesignDetails from './DesignDetails'
import { generatePrompt } from '@/lib/exporters/promptExporter'
import { generateCssVariables } from '@/lib/exporters/cssExporter'
import { generateMarkdown } from '@/lib/exporters/markdownExporter'

const i18n = {
  zh: {
    vibe: '风格描述',
    tags: '设计标签',
    colors: '色彩体系',
    typo: '字体排版',
    details: '细节解析',
    export: '代码输出',
    markdown_desc: '用于设计交接的标准 Markdown 文档',
    css_desc: '前端可直接复制的 :root 变量映射',
    prompt_desc: '一键复制，直接发送给 v0 或 Cursor 生成前端代码',
    copy: '复制',
    copied: '已复制',
    tab_markdown: 'Markdown 文档',
    tab_css: 'CSS 变量',
    tab_prompt: 'AI 提示词'
  },
  en: {
    vibe: 'Style Vibe',
    tags: 'Keywords',
    colors: 'Color System',
    typo: 'Typography',
    details: 'Design Details',
    export: 'Export Assets',
    markdown_desc: 'Standard Markdown documentation for handoff',
    css_desc: ':root CSS variables ready for your stylesheet',
    prompt_desc: 'Direct prompt for v0 or Cursor to generate UI',
    copy: 'Copy',
    copied: 'Copied',
    tab_markdown: 'Markdown Doc',
    tab_css: 'CSS Variables',
    tab_prompt: 'AI Prompt'
  }
}

export default function StyleReport({ report, lang = 'zh' }: { report: ReportType, lang?: 'zh' | 'en' }) {
  const [activeCode, setActiveCode] = useState<'markdown' | 'css' | 'prompt'>('markdown')
  const [copied, setCopied] = useState(false)

  const t = i18n[lang]

  const contentMap = {
    markdown: generateMarkdown(report, lang),
    css: generateCssVariables(report),
    prompt: generatePrompt(report, lang)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(contentMap[activeCode])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="no-scrollbar" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '40px', 
      maxWidth: '680px', 
      paddingBottom: '80px',
      fontFamily: 'var(--font-sans)'
    }}>
      


      {/* 1. 风格描述 */}
      <section>
        <SectionLabel>{t.vibe}</SectionLabel>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, letterSpacing: '0.01em', fontWeight: 400 }}>
          {lang === 'en' ? (report.summaryEn || report.summary) : (report.summaryZh || report.summary)}
        </p>
      </section>

      {/* 2. 标签 - Outline Ghost Version */}
      <section>
        <SectionLabel>{t.tags}</SectionLabel>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(lang === 'en' ? (report.tagsEn || report.tags) : (report.tagsZh || report.tags)).map(tag => (
            <span key={tag} style={{
              fontSize: '12px', padding: '4px 12px', background: 'transparent', borderRadius: '100px', 
              color: 'var(--text-secondary)', fontWeight: 500, border: '1px solid rgba(0,0,0,0.08)'
            }}>
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* 3. 色彩体系 */}
      <section>
        <SectionLabel>{t.colors}</SectionLabel>
        <ColorSystem colors={report.colors} lang={lang} />
      </section>

      {/* 4. 字体排版 */}
      <section>
         <SectionLabel>{t.typo}</SectionLabel>
         <Typography data={report.typography} lang={lang} />
      </section>

      {/* 5. 细节解析 */}
      <section>
         <SectionLabel>{t.details}</SectionLabel>
         <DesignDetails data={report.designDetails} lang={lang} />
      </section>

      {/* 6. 导出面板 */}
      <section style={{ paddingTop: '24px' }}>
        <SectionLabel>{t.export}</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Top-Tier Ghost Tabs (Vercel Style) */}
          <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0' }}>
            {(['markdown', 'css', 'prompt'] as const).map(type => (
              <button 
                key={type}
                onClick={() => setActiveCode(type)}
                style={{
                  padding: '0 0 10px 0', fontSize: '13px', fontWeight: activeCode === type ? 600 : 500, letterSpacing: '0.02em',
                  background: 'none', border: 'none',
                  color: activeCode === type ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  cursor: 'pointer', transition: 'color 0.2s', position: 'relative'
                }}
              >
                {t[`tab_${type}` as keyof typeof t]}
                {/* Active Indicator Line */}
                {activeCode === type && <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', background: 'var(--text-primary)', borderRadius: '2px' }} />}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            {t[`${activeCode}_desc` as keyof typeof t]}
          </div>

          {/* Code View */}
          <div style={{ 
            background: 'var(--bg-elevated)', borderRadius: '12px', 
            padding: '24px', position: 'relative',
            border: '1px solid rgba(0,0,0,0.03)' // pure subtle definition
          }}>
            <button 
              onClick={handleCopy}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: copied ? 'var(--success)' : '#fff', 
                border: '1px solid var(--border-subtle)', fontSize: '12px', fontWeight: 500, 
                padding: '4px 12px', borderRadius: '100px',
                color: copied ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: copied ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              {copied ? t.copied : t.copy}
            </button>
            <pre className="no-scrollbar" style={{ 
              margin: 0, fontSize: '13px', fontFamily: 'var(--font-mono)', lineHeight: 1.6, 
              color: 'var(--text-secondary)', maxHeight: '320px', overflowY: 'auto',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', paddingTop: '16px'
            }}>
              {contentMap[activeCode]}
            </pre>
          </div>
        </div>
      </section>

    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ 
      fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', 
      marginBottom: '16px'
    }}>
      {children}
    </h3>
  )
}
