'use client'

import type { StyleReport as ReportType } from '@/lib/types'
import { useState } from 'react'
import ColorSystem from './ColorSystem'
import Typography from './Typography'
import DesignDetails from './DesignDetails'
import { generatePrompt } from '@/lib/exporters/promptExporter'
import { generateCssVariables } from '@/lib/exporters/cssExporter'
import { generateMarkdown } from '@/lib/exporters/markdownExporter'
import { Copy, Check } from 'lucide-react'

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
          
          {/* Technical Minimalist Tabs (Pro/IDE Style) */}
          <div style={{ 
            display: 'flex', 
            gap: '24px', 
            borderBottom: '1px solid rgba(0,0,0,0.04)',
            paddingBottom: '0',
            alignItems: 'baseline'
          }}>
            {(['markdown', 'css', 'prompt'] as const).map(type => (
              <button 
                key={type}
                onClick={() => setActiveCode(type)}
                style={{
                  padding: '8px 0 12px 0', 
                  fontSize: '11px', 
                  fontWeight: activeCode === type ? 600 : 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  background: 'none', 
                  border: 'none',
                  color: activeCode === type ? '#1D1D1F' : '#AEAEB2',
                  cursor: 'pointer', 
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  fontFamily: 'var(--font-outfit)'
                }}
              >
                {t[`tab_${type}` as keyof typeof t]}
                {activeCode === type && (
                  <div style={{ 
                    position: 'absolute', bottom: '-1px', left: '0', right: '0', 
                    height: '1.5px', background: '#1D1D1F',
                    borderRadius: '1px'
                  }} />
                )}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            {t[`${activeCode}_desc` as keyof typeof t]}
          </div>

          {/* Code View (Floating Sheet / IDE Style) */}
          <div 
            className="group"
            style={{ 
              background: '#FFFFFF', borderRadius: '12px', 
              padding: '24px 28px', position: 'relative',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.02)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <button 
              onClick={handleCopy}
              className="copy-button"
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: copied ? '#E8F5E9' : '#FFFFFF', 
                border: '1px solid rgba(0,0,0,0.08)', 
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', // Circle for pro tool look
                color: copied ? '#2E7D32' : '#8E8E93', 
                cursor: 'pointer', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                opacity: 0, // Ghost by default
                pointerEvents: 'auto'
              }}
              onMouseEnter={e => {
                if (!copied) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'
              }}
              onMouseLeave={e => {
                if (!copied) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
              }}
              title={t.copy}
            >
              <style jsx>{`
                .group:hover .copy-button { opacity: 1 !important; transform: translateY(0) !important; }
              `}</style>
              {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2} />}
            </button>
            <pre className="no-scrollbar" style={{ 
              margin: 0, fontSize: '13px', fontFamily: 'var(--font-mono)', lineHeight: 1.6, 
              color: 'rgba(29, 29, 31, 0.75)', maxHeight: '420px', overflowY: 'auto',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', paddingTop: '8px'
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
