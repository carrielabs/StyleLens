'use client'

import React, { useRef } from 'react'
import { ArrowLeft, CheckCircle2, Download } from 'lucide-react'

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
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  function downloadHtmlContent(htmlContent: string) {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'index.html'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  async function requestCurrentHtml() {
    const frameWindow = iframeRef.current?.contentWindow
    if (!frameWindow) return html

    return new Promise<string>((resolve) => {
      const timeout = window.setTimeout(() => {
        window.removeEventListener('message', handleMessage)
        resolve(html)
      }, 800)

      function handleMessage(event: MessageEvent) {
        if (event.source !== frameWindow) return
        if (event.data?.type !== 'AHP_EXPORT_HTML') return
        window.clearTimeout(timeout)
        window.removeEventListener('message', handleMessage)
        resolve(typeof event.data.html === 'string' && event.data.html.trim() ? event.data.html : html)
      }

      window.addEventListener('message', handleMessage)
      frameWindow.postMessage({ type: 'AHP_REQUEST_EXPORT_HTML' }, '*')
    })
  }

  async function downloadHtml() {
    downloadHtmlContent(await requestCurrentHtml())
  }

  return (
    <div style={{ height: '100%', position: 'relative', background: '#FFFFFF' }}>
      <div style={{
        position: 'absolute',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 8px',
        borderRadius: '999px',
        background: 'rgba(15,23,42,0.96)',
        boxShadow: '0 18px 48px rgba(15,23,42,0.24)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              height: 34,
              padding: '0 13px',
              borderRadius: 999,
              border: 'none',
              background: 'transparent',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 750,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={15} strokeWidth={2} />
            返回画廊
          </button>
          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.18)' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 13px', color: '#CBD5E1', fontSize: 14, fontWeight: 750 }}>
            <CheckCircle2 size={15} strokeWidth={2} color="#22C55E" />
            <span>{title}</span>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>{templateId}</span>
            <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>已生成，可编辑并下载</span>
          </div>
          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.18)' }} />
          <button
            type="button"
            onClick={downloadHtml}
            style={{
              height: 34,
              padding: '0 18px',
              borderRadius: 999,
              border: '1px solid #2563EB',
              background: '#2563EB',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 800,
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
      <iframe
        ref={iframeRef}
        title="生成页面预览"
        sandbox="allow-scripts allow-same-origin allow-downloads"
        srcDoc={html}
        style={{ width: '100%', height: '100%', border: 0, background: '#fff' }}
      />
    </div>
  )
}
