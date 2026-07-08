'use client'

import React from 'react'

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
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onBack}>返回</button>
          <button type="button" onClick={downloadHtml}>下载 HTML</button>
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
