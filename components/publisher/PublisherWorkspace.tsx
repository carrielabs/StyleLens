'use client'

import React, { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { ArrowLeft, ArrowRight, FileText, Maximize, UploadCloud, X } from 'lucide-react'
import type { GeneratedPageResult, GeneratedPageType } from '@/hooks/usePublisher'
import { isDataUpload, isTextUpload } from '@/lib/publisher/inputIntent'
import { DASHBOARD_TEMPLATES, WEBSITE_TEMPLATES, type PublisherTemplate } from './templates'

type TemplateCategory = 'product-website' | 'dashboard'
type QueuedFile = { file: File; kind: 'text' | 'data' }

interface PublisherWorkspaceProps {
  isGenerating: boolean
  generatePage: (sourceText: string, templateId: string, pageType?: GeneratedPageType) => Promise<GeneratedPageResult>
  generateDashboardFromFile: (file: File, templateId?: string) => Promise<GeneratedPageResult>
  error: string | null
  setError: (error: string | null) => void
}

export default function PublisherWorkspace({
  isGenerating,
  generatePage,
  generateDashboardFromFile,
  error,
  setError,
}: PublisherWorkspaceProps) {
  const [category, setCategory] = useState<TemplateCategory>('product-website')
  const [previewTemplate, setPreviewTemplate] = useState<PublisherTemplate | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<PublisherTemplate | null>(null)
  const [sourceText, setSourceText] = useState('')
  const [queuedFile, setQueuedFile] = useState<QueuedFile | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const templates = category === 'product-website' ? WEBSITE_TEMPLATES : DASHBOARD_TEMPLATES

  function openDrawer(template: PublisherTemplate) {
    setSelectedTemplate(template)
    setDrawerOpen(true)
    setError(null)
  }

  function closeDrawer() {
    setDrawerOpen(false)
  }

  function usePreviewTemplate() {
    if (!previewTemplate) return
    const nextTemplate = previewTemplate
    setPreviewTemplate(null)
    openDrawer(nextTemplate)
  }

  function queueFile(file: File) {
    if (isDataUpload(file)) {
      setQueuedFile({ file, kind: 'data' })
      setError(null)
      return
    }
    if (isTextUpload(file)) {
      setQueuedFile({ file, kind: 'text' })
      setError(null)
      return
    }
    setError('仅支持 .md、.txt、.csv、.json、.xlsx 文件')
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) queueFile(file)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) queueFile(file)
  }

  async function handleGenerate() {
    if (!selectedTemplate || isGenerating) return
    setError(null)

    try {
      if (queuedFile?.kind === 'data') {
        if (category !== 'dashboard') {
          setError('数据文件只能生成数据看板')
          return
        }
        await generateDashboardFromFile(queuedFile.file, selectedTemplate.id)
        closeDrawer()
        return
      }

      const text = queuedFile?.kind === 'text' ? await queuedFile.file.text() : sourceText.trim()
      if (!text) {
        setError('请先输入文本或上传文档')
        return
      }
      await generatePage(text, selectedTemplate.id, category)
      setSourceText('')
      setQueuedFile(null)
      closeDrawer()
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试')
    }
  }

  return (
    <main style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', background: '#FAFAFA' }}>
      <header style={{ height: '56px', borderBottom: '1px solid #E5E7EB', background: 'rgba(255,255,255,0.86)', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111827' }}>模板库</h1>
      </header>

      <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: '48px 32px 72px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          {error && (
            <div role="alert" style={{ margin: '0 auto 18px', maxWidth: '520px', border: '1px solid rgba(255,59,48,0.18)', background: '#FFF2F1', color: '#B42318', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: '42px' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: '32px', lineHeight: 1.15, fontWeight: 800, color: '#111827', letterSpacing: 0 }}>
              探索模板
            </h2>
            <p style={{ margin: 0, color: '#64748B', fontSize: '15px', fontWeight: 500 }}>
              选择一个起点，然后注入您的数据。
            </p>
            <div style={{ display: 'inline-flex', gap: '4px', padding: '4px', borderRadius: '10px', background: '#EEF2F7', marginTop: '26px' }}>
              <CategoryButton active={category === 'product-website'} onClick={() => setCategory('product-website')}>
                网站官网
              </CategoryButton>
              <CategoryButton active={category === 'dashboard'} onClick={() => setCategory('dashboard')}>
                数据看板
              </CategoryButton>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={() => setPreviewTemplate(template)}
                onUse={() => openDrawer(template)}
              />
            ))}
          </div>
        </div>
      </div>

      {previewTemplate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${previewTemplate.name} 模板预览`}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#111111' }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', zIndex: 2, background: 'linear-gradient(to bottom, rgba(0,0,0,0.62), rgba(0,0,0,0))' }}>
            <button type="button" onClick={() => setPreviewTemplate(null)} style={fullscreenButtonStyle}>
              <ArrowLeft size={16} strokeWidth={2} />
              返回画廊
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 700 }}>{previewTemplate.name}</span>
              <button type="button" onClick={usePreviewTemplate} style={{ ...fullscreenButtonStyle, background: '#2563EB', borderColor: '#2563EB' }}>
                立即使用此模板
              </button>
            </div>
          </div>
          <iframe
            title={`${previewTemplate.name} 全屏模板预览`}
            src={`/api/template-preview/${previewTemplate.id}`}
            sandbox="allow-scripts"
            style={{ width: '100%', height: '100%', border: 0, background: '#FFFFFF' }}
          />
        </div>
      )}

      {drawerOpen && selectedTemplate && (
        <>
          <button
            type="button"
            aria-label="关闭配置抽屉遮罩"
            onClick={closeDrawer}
            style={{ position: 'absolute', inset: 0, zIndex: 20, border: 'none', background: 'rgba(15,23,42,0.32)', backdropFilter: 'blur(4px)', cursor: 'pointer' }}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="配置数据源"
            style={{ position: 'absolute', top: 0, right: 0, width: '400px', maxWidth: '100%', height: '100%', zIndex: 30, background: '#FFFFFF', borderLeft: '1px solid #E5E7EB', display: 'grid', gridTemplateRows: '56px 1fr auto', boxShadow: '-18px 0 48px rgba(15,23,42,0.14)' }}
          >
            <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #F1F5F9' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>配置数据源</h3>
              <button type="button" onClick={closeDrawer} aria-label="关闭配置数据源" style={iconButtonStyle}>
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: '22px' }}>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
                <div style={{ width: '58px', height: '58px', borderRadius: '8px', background: selectedTemplate.tone }} />
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, marginBottom: '4px' }}>正在使用</div>
                  <div style={{ fontSize: '18px', color: '#0F172A', fontWeight: 800 }}>{selectedTemplate.name}</div>
                </div>
              </div>

              <label htmlFor="publisher-source-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
                输入文本内容
                <span style={{ fontSize: '12px', color: '#94A3B8', background: '#F1F5F9', borderRadius: '6px', padding: '2px 7px' }}>支持 Markdown</span>
              </label>
              <textarea
                id="publisher-source-text"
                value={sourceText}
                onChange={event => setSourceText(event.target.value)}
                placeholder="例如：这是我们的新产品，它具有以下特性..."
                style={{ width: '100%', height: '250px', resize: 'none', border: '1px solid #CBD5E1', borderRadius: '10px', background: '#F8FAFC', padding: '14px', outline: 'none', color: '#111827', fontSize: '14px', fontFamily: 'var(--font-sans)' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#94A3B8', fontSize: '12px', margin: '22px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                或
                <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
              </div>

              <input
                ref={fileInputRef}
                aria-label="上传文档文件"
                type="file"
                accept=".md,.txt,.csv,.json,.xlsx,text/plain,text/markdown,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={event => event.preventDefault()}
                style={{ minHeight: '150px', border: '1.5px dashed #CBD5E1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', background: queuedFile ? '#F8FAFC' : '#FFFFFF', color: '#475569' }}
              >
                {queuedFile ? (
                  <>
                    <FileText size={28} strokeWidth={1.8} />
                    <strong style={{ fontSize: '14px' }}>{queuedFile.file.name}</strong>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>{queuedFile.kind === 'data' ? '数据文件' : '文本文件'}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={30} strokeWidth={1.8} />
                    <strong style={{ fontSize: '14px' }}>点击上传文档文件</strong>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>支持 .md, .txt, .csv, .json, .xlsx</span>
                  </>
                )}
              </div>
            </div>
            <div style={{ padding: '18px 22px', borderTop: '1px solid #F1F5F9' }}>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{ width: '100%', height: '46px', border: 'none', borderRadius: '10px', background: '#0F172A', color: '#FFFFFF', fontSize: '15px', fontWeight: 800, cursor: isGenerating ? 'wait' : 'pointer' }}
              >
                {isGenerating ? '正在生成...' : '立即生成 HTML'}
              </button>
            </div>
          </aside>
        </>
      )}
    </main>
  )
}

function CategoryButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        height: '36px',
        padding: '0 24px',
        border: 'none',
        borderRadius: '8px',
        background: active ? '#FFFFFF' : 'transparent',
        color: active ? '#111827' : '#64748B',
        fontSize: '14px',
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: active ? '0 1px 4px rgba(15,23,42,0.12)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

function TemplateCard({
  template,
  onPreview,
  onUse,
}: {
  template: PublisherTemplate
  onPreview: () => void
  onUse: () => void
}) {
  return (
    <article data-testid={`template-card-${template.id}`} style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', background: '#FFFFFF' }}>
      <div style={{ height: '210px', background: template.tone, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <iframe
          title={`${template.name} 模板预览`}
          src={`/api/template-preview/${template.id}`}
          loading="lazy"
          sandbox="allow-scripts"
          tabIndex={-1}
          style={{ width: '1280px', height: '760px', border: 0, transform: 'scale(0.22)', transformOrigin: '0 0', pointerEvents: 'none', background: '#FFFFFF', opacity: 0.92 }}
        />
        <button type="button" aria-label={`全屏预览 ${template.name}`} onClick={onPreview} style={{ position: 'absolute', inset: 0, border: 'none', background: 'rgba(15,23,42,0)', color: '#FFFFFF', cursor: 'zoom-in' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '999px', background: 'rgba(15,23,42,0.72)', fontSize: '13px', fontWeight: 800 }}>
            <Maximize size={15} strokeWidth={2} />
            全屏预览
          </span>
        </button>
      </div>
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
        <div>
          <h3 style={{ margin: '0 0 5px', color: '#111827', fontSize: '18px', lineHeight: 1.2, fontWeight: 800 }}>{template.name}</h3>
          <p style={{ margin: 0, color: '#64748B', fontSize: '13px', fontWeight: 500 }}>{template.description}</p>
        </div>
        <button type="button" aria-label={`使用 ${template.name} 模板`} onClick={onUse} style={{ width: '42px', height: '42px', borderRadius: '50%', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowRight size={20} strokeWidth={2} />
        </button>
      </div>
    </article>
  )
}

const fullscreenButtonStyle = {
  height: '38px',
  padding: '0 16px',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.12)',
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: 800,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
}

const iconButtonStyle = {
  width: '30px',
  height: '30px',
  borderRadius: '8px',
  border: 'none',
  background: 'transparent',
  color: '#64748B',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}
