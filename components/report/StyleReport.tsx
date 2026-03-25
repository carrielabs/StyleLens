'use client'

import type { StyleReport as ReportType } from '@/lib/types'
import { useState } from 'react'
import ColorSystem from './ColorSystem'
import Typography from './Typography'
import DesignDetails from './DesignDetails'
import DesignDetailsElite from './DesignDetailsElite'
import DesignDetailsEliteV2 from './DesignDetailsEliteV2'
import DesignDetailsEliteV3 from './DesignDetailsEliteV3'
import AtomicSandbox from './AtomicSandbox'
import StyleInspector from './StyleInspector'
import DesignInspector from './DesignInspector'
import { generatePrompt } from '@/lib/exporters/promptExporter'
import { generateCssVariables } from '@/lib/exporters/cssExporter'
import { generateJsonToken } from '@/lib/exporters/jsonExporter'
import { generateMarkdown } from '@/lib/exporters/markdownExporter'
import { generateTailwindConfig } from '@/lib/exporters/tailwindExporter'
import { Copy, Check, Download } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { FLAGS } from '@/lib/flags'

const i18n = {
  zh: {
    vibe: '风格描述',
    tags: '设计标签',
    colors: '色彩体系',
    typo: '字体排版',
    details: '细节解析',
    sandbox: '样式预览',
    inspector: '样式解析',
    export: '代码输出',
    markdown_desc: '完整设计规范文档，可直接发给设计师或 PM',
    css_desc: '直接可用的 CSS 变量，粘贴进 :root 零修改',
    json_desc: '标准设计 Token，可导入 Figma 变量库或 Style Dictionary',
    prompt_desc: '发给 AI 的设计契约，约束 AI 不乱发挥',
    tailwind_desc: '粘进 tailwind.config.js 即可，颜色字体圆角一步到位',
    copy: '复制',
    copied: '已复制',
    tab_markdown: 'Markdown',
    tab_css: 'CSS',
    tab_json: 'Tokens',
    tab_prompt: 'Prompt',
    tab_tailwind: 'Tailwind'
  },
  en: {
    vibe: 'Style Vibe',
    tags: 'Keywords',
    colors: 'Color System',
    typo: 'Typography',
    details: 'Design Details',
    sandbox: 'Style Preview',
    inspector: 'Style Analysis',
    export: 'Export Assets',
    markdown_desc: 'Full design spec — share directly with designers or PMs',
    css_desc: 'Ready-to-use CSS variables — paste into :root, zero edits needed',
    json_desc: 'Standard design tokens — import into Figma variables or Style Dictionary',
    prompt_desc: 'Design contract for AI — keeps Cursor / v0 from going off-script',
    tailwind_desc: 'Paste into tailwind.config.js — colors, fonts, and radii all set',
    copy: 'Copy',
    copied: 'Copied',
    tab_markdown: 'Markdown',
    tab_css: 'CSS',
    tab_json: 'Tokens',
    tab_prompt: 'Prompt',
    tab_tailwind: 'Tailwind'
  }
}

export default function StyleReport({ report, lang = 'zh', fullWidth = false, onSectionHover }: { report: ReportType, lang?: 'zh' | 'en', fullWidth?: boolean, onSectionHover?: (section: { yStart: number; yEnd: number } | null) => void }) {
  const [activeCode, setActiveCode] = useState<'markdown' | 'css' | 'json' | 'prompt' | 'tailwind'>('markdown')
  const [copied, setCopied] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const t = i18n[lang]
  const isV2 = report.id === 'preset_linear_v2'
  const isV3 = report.id === 'preset_linear_v3'
  const isElite = isV2 || isV3
  const isDNA = report.id?.startsWith('preset_') || report.id === 'linear'
  const showDNA = FLAGS.ENABLE_DESIGN_AUDITS || !isDNA

  const contentMap = {
    markdown: generateMarkdown(report, lang),
    css: generateCssVariables(report),
    json: generateJsonToken(report),
    prompt: generatePrompt(report, lang),
    tailwind: generateTailwindConfig(report)
  }

  const fileExtMap: Record<typeof activeCode, string> = {
    markdown: 'md', css: 'css', json: 'json', prompt: 'md', tailwind: 'js'
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(contentMap[activeCode])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const ext = fileExtMap[activeCode]
    const blob = new Blob([contentMap[activeCode]], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stylelens-${activeCode}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="no-scrollbar" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '40px', 
      maxWidth: (fullWidth || isElite) ? 'none' : '680px', 
      paddingBottom: '80px',
      fontFamily: 'var(--font-sans)',
      width: '100%'
    }}>
      
      {!isElite && showDNA && (
        <>
          {/* 1. 风格描述 */}
          <section>
            <SectionLabel>{t.vibe}</SectionLabel>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, letterSpacing: '0.01em', fontWeight: 400 }}>
              {lang === 'en' ? (report.summaryEn || report.summary) : (report.summaryZh || report.summary)}
            </p>
          </section>

          {/* 2. 标签 */}
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
            <ColorSystem colors={report.colors} colorSystem={report.colorSystem} analysis={report.pageAnalysis} sourceType={report.sourceType} lang={lang} />
          </section>

          {/* 4. 字体排版 */}
          <section>
             <Typography data={report.typography} analysis={report.pageAnalysis} sourceType={report.sourceType} lang={lang} fullWidth={fullWidth} />
          </section>
        </>
      )}

      {/* 5. Elite 专属细节模块 (preset_linear / V2 / V3) */}
      {showDNA && FLAGS.ENABLE_DESIGN_AUDITS && isElite && (
        <section>
          {report.id === 'preset_linear' ? (
            <>
              <DesignDetailsElite data={report.designDetails} analysis={report.pageAnalysis} sourceType={report.sourceType} lang={lang} fullWidth={fullWidth} />
              <AtomicSandbox report={report} lang={lang} />
            </>
          ) : isV2 ? (
            <>
              <DesignDetailsEliteV2 data={report.designDetails} lang={lang} />
              <div style={{ padding: '0 48px', marginTop: '48px' }}>
                <AtomicSandbox report={report} lang={lang} />
              </div>
            </>
          ) : (
            <DesignDetailsEliteV3 data={report.designDetails} lang={lang} report={report} />
          )}
        </section>
      )}

      {/* 5. 样式解析 (普通报告：组件 + 形态 + 空间 + 交互，合并展示) */}
      {!isElite && (
        <section>
          <SectionLabel>{t.inspector}</SectionLabel>
          <DesignInspector report={report} lang={lang} onSectionHover={onSectionHover} />
        </section>
      )}

      {/* 6. 导出面板 */}
      <section style={{ 
        paddingTop: '24px',
        paddingLeft: isElite ? '48px' : '0',
        paddingRight: isElite ? '48px' : '0'
      }}>
        <SectionLabel>{t.export}</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ 
            display: 'flex', 
            gap: '24px', 
            borderBottom: '1px solid rgba(0,0,0,0.04)',
            paddingBottom: '0',
            alignItems: 'baseline'
          }}>
            {(['markdown', 'css', 'json', 'prompt', 'tailwind'] as const).map(type => (
              <button 
                key={type}
                onClick={() => setActiveCode(type)}
                style={{
                  padding: '8px 0 12px 0', 
                  fontSize: '13px', 
                  fontWeight: activeCode === type ? 600 : 500,
                  textTransform: 'none',
                  letterSpacing: '0',
                  background: 'none', 
                  border: 'none',
                  color: activeCode === type ? '#1D1D1F' : '#AEAEB2',
                  cursor: 'pointer', 
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  fontFamily: 'var(--font-sans)'
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

          <div style={{ fontSize: '12px', color: '#8E8E93', letterSpacing: '0.01em' }}>
            {t[`${activeCode}_desc` as keyof typeof t]}
          </div>

          <div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ 
              background: '#1E1E1E', borderRadius: '16px', 
              padding: '0', position: 'relative',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute', top: '16px', right: '16px',
              display: 'flex', gap: '8px',
              opacity: (isHovered || copied) ? 1 : 0,
              transform: (isHovered || copied) ? 'translateY(0)' : 'translateY(4px)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: (isHovered || copied) ? 'auto' : 'none',
              zIndex: 10
            }}>
              <button
                onClick={handleDownload}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)' }}
                onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)' }}
                onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', color: '#FFFFFF', cursor: 'pointer',
                  transition: 'background 0.15s ease, transform 0.1s ease'
                }}
                title="下载"
              >
                <Download size={14} strokeWidth={2} />
              </button>
              <button
                onClick={handleCopy}
                onMouseEnter={e => { if (!copied) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)' }}
                onMouseLeave={e => { if (!copied) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)' }}
                onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)' }}
                onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
                style={{
                  background: copied ? '#E8F5E9' : 'rgba(255,255,255,0.05)',
                  border: copied ? '1px solid #C8E6C9' : '1px solid rgba(255,255,255,0.1)',
                  width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  color: copied ? '#2E7D32' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'background 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.1s ease',
                }}
                title={t.copy}
              >
                {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2} />}
              </button>
            </div>
            <SyntaxHighlighter
              language={activeCode === 'css' ? 'css' : activeCode === 'json' ? 'json' : activeCode === 'tailwind' ? 'javascript' : 'markdown'}
              style={vscDarkPlus}
              showLineNumbers={true}
              lineNumberStyle={{ minWidth: '3.25em', paddingRight: '1em', color: '#555555', textAlign: 'right', fontSize: '11px', userSelect: 'none' }}
              customStyle={{
                margin: 0,
                padding: '28px 16px',
                fontSize: '12.5px',
                fontFamily: 'var(--font-mono)',
                lineHeight: '1.7',
                backgroundColor: 'transparent',
                border: 'none',
                maxHeight: '480px',
              }}
              codeTagProps={{
                style: {
                  fontFamily: 'inherit',
                }
              }}
            >
              {contentMap[activeCode]}
            </SyntaxHighlighter>
          </div>
        </div>
      </section>

    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ 
      fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', 
      marginBottom: '16px', letterSpacing: '-0.01em'
    }}>
      {children}
    </h3>
  )
}
