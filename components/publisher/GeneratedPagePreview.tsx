'use client'

import React from 'react'
import { Download, RotateCcw } from 'lucide-react'

interface GeneratedPagePreviewProps {
  html: string
  title: string
  templateId: string
  onBack: () => void
}

export default function GeneratedPagePreview({
  html,
  title,
  templateId,
  onBack,
}: GeneratedPagePreviewProps) {
  function downloadHtml() {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'index.html'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr', background: '#f5f5f4' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid #e7e5e4' }}>
        <div>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 12, color: '#78716c' }}>{templateId}</div>
          <div style={{ fontSize: 12, color: '#78716c', marginTop: 4 }}>已生成，可编辑并下载</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              height: 34,
              padding: '0 14px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.10)',
              background: '#FFFFFF',
              color: '#3C3C3E',
              fontSize: 13,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} strokeWidth={2} />
            重新上传
          </button>
          <button
            type="button"
            onClick={downloadHtml}
            style={{
              height: 34,
              padding: '0 14px',
              borderRadius: 10,
              border: '1px solid #1D1D1F',
              background: '#1D1D1F',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 650,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Download size={14} strokeWidth={2} />
            下载 HTML
          </button>
        </div>
      </div>
      <iframe
        title="生成页面预览"
        sandbox="allow-scripts allow-same-origin allow-downloads"
        srcDoc={html}
        style={{ width: '100%', height: '100%', border: 0, background: '#fff' }}
      />
    </div>
  )
}
