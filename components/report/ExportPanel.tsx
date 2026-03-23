'use client'

import { useState } from 'react'
import type { StyleReport } from '@/lib/types'
import { generatePrompt } from '@/lib/exporters/promptExporter'
import { generateCssVariables } from '@/lib/exporters/cssExporter'
import { generateJsonToken } from '@/lib/exporters/jsonExporter'
import { generateMarkdown } from '@/lib/exporters/markdownExporter'
import { generateTailwindConfig } from '@/lib/exporters/tailwindExporter'

type Tab = 'prompt_en' | 'prompt_zh' | 'css' | 'tailwind' | 'json' | 'markdown'

export default function ExportPanel({ report }: { report: StyleReport }) {
  const [activeTab, setActiveTab] = useState<Tab>('prompt_en')
  const [copied, setCopied] = useState(false)

  const contentMap: Record<Tab, string> = {
    prompt_en: generatePrompt(report, 'en'),
    prompt_zh: generatePrompt(report, 'zh'),
    css: generateCssVariables(report),
    tailwind: generateTailwindConfig(report),
    json: generateJsonToken(report),
    markdown: generateMarkdown(report)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(contentMap[activeTab])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'prompt_en', label: 'Prompt (EN)' },
    { id: 'prompt_zh', label: 'Prompt (中)' },
    { id: 'css', label: 'CSS Variables' },
    { id: 'tailwind', label: 'Tailwind Config' },
    { id: 'json', label: 'Design Tokens' },
    { id: 'markdown', label: 'Markdown' }
  ]

  return (
    <div style={{ border: '1px solid var(--border-base)', borderRadius: 'var(--radius-base)', overflow: 'hidden' }}>
      
      {/* Tab Header */}
      <div style={{ 
        display: 'flex', background: 'var(--bg-surface)', 
        borderBottom: '1px solid var(--border-subtle)', overflowX: 'auto' 
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              fontSize: '13px',
              fontWeight: 500,
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: activeTab === tab.id ? 'var(--bg-base)' : 'transparent',
              border: 'none',
              borderRight: '1px solid var(--border-subtle)',
              borderBottom: activeTab === tab.id ? '1px solid transparent' : '1px solid var(--border-subtle)',
              marginBottom: '-1px',
              transition: 'color var(--duration-fast), background var(--duration-fast)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code Area */}
      <div style={{ position: 'relative', background: 'var(--bg-base)' }}>
        <button
          onClick={handleCopy}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'var(--bg-surface)', color: copied ? 'var(--success)' : 'var(--text-secondary)',
            border: '1px solid var(--border-base)', borderRadius: 'var(--radius-sm)',
            padding: '6px 12px', fontSize: '12px', fontWeight: 500,
            transition: 'all 0.2s', zIndex: 10
          }}
        >
          {copied ? '已复制 ✓' : '复制内容'}
        </button>
        
        <pre style={{
          margin: 0, padding: '24px',
          fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6,
          color: 'var(--text-primary)',
          maxHeight: '400px', overflowY: 'auto',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word'
        }}>
          {contentMap[activeTab]}
        </pre>
      </div>

    </div>
  )
}
