'use client'

import React, { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { ArrowLeft, FileText, Maximize, PanelRightClose, UploadCloud } from 'lucide-react'
import type { GeneratedPageResult, GeneratedPageType } from '@/hooks/usePublisher'
import { isDataUpload, isTextUpload } from '@/lib/publisher/inputIntent'
import { DASHBOARD_TEMPLATES, WEBSITE_TEMPLATES, type PublisherTemplate } from './templates'

type TemplateCategory = 'product-website' | 'dashboard'
type QueuedFile = { file: File; kind: 'text' | 'data' }

interface PublisherWorkspaceProps {
  isGenerating: boolean
  generatePage: (sourceText: string, templateId: string, pageType?: GeneratedPageType, backgroundColor?: string) => Promise<GeneratedPageResult>
  generateDashboardFromFile: (file: File, templateId?: string, backgroundColor?: string) => Promise<GeneratedPageResult>
  error: string | null
  setError: (error: string | null) => void
  styleBackgroundColor?: string
}

export default function PublisherWorkspace({
  isGenerating,
  generatePage,
  generateDashboardFromFile,
  error,
  setError,
  styleBackgroundColor,
}: PublisherWorkspaceProps) {
  const [category, setCategory] = useState<TemplateCategory>('product-website')
  const [previewTemplate, setPreviewTemplate] = useState<PublisherTemplate | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<PublisherTemplate | null>(null)
  const [sourceText, setSourceText] = useState('')
  const [queuedFile, setQueuedFile] = useState<QueuedFile | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const templates = category === 'product-website' ? WEBSITE_TEMPLATES : DASHBOARD_TEMPLATES
  const drawerError = drawerOpen ? error : null
  const drawerProgressStep = isGenerating ? 3 : (sourceText.trim() || queuedFile) ? 2 : 1

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

  function openPreview(template: PublisherTemplate) {
    setPreviewLoaded(false)
    setPreviewTemplate(template)
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
        await generateDashboardFromFile(queuedFile.file, selectedTemplate.id, styleBackgroundColor)
        closeDrawer()
        return
      }

      const text = queuedFile?.kind === 'text' ? await queuedFile.file.text() : sourceText.trim()
      if (!text) {
        setError('请先输入文本或上传文档')
        return
      }
      await generatePage(text, selectedTemplate.id, category, styleBackgroundColor)
      setSourceText('')
      setQueuedFile(null)
      closeDrawer()
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试')
    }
  }

  return (
    <main data-testid="publisher-shell" style={{ flex: 1, minHeight: 0, display: 'flex', position: 'relative', overflow: 'hidden', background: '#FFFFFF' }}>
      <style>{`
        .publisher-template-card {
          transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 180ms ease, border-color 180ms ease;
          will-change: transform;
        }
        .publisher-template-card:hover,
        .publisher-template-card:focus-within {
          transform: translateY(-4px);
          border-color: rgba(0, 0, 0, 0.18) !important;
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.10), 0 0 0 1px rgba(0, 0, 0, 0.08);
        }
        .publisher-template-card:hover .publisher-card-actions,
        .publisher-template-card:focus-within .publisher-card-actions {
          opacity: 1;
        }
      `}</style>

      <div data-testid="publisher-gallery-pane" style={{ flex: '1 1 0%', minWidth: 0, height: '100%', overflowY: 'auto', padding: '64px 32px 72px', transition: 'flex 240ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          {error && !drawerOpen && (
            <div role="alert" style={{ margin: '0 auto 18px', maxWidth: '520px', border: '1px solid rgba(255,59,48,0.18)', background: '#FFF2F1', color: '#B42318', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div data-testid="publisher-gallery-toolbar" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', marginBottom: '42px' }}>
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ margin: '0 0 12px', fontSize: '32px', lineHeight: 1.15, fontWeight: 800, color: '#111827', letterSpacing: 0 }}>
                探索模板
              </h2>
              <p style={{ margin: 0, color: '#6E6E73', fontSize: '15px', fontWeight: 500 }}>
                选择一个起点，然后注入您的数据。
              </p>
            </div>
            <div data-testid="publisher-category-switcher" style={{ display: 'inline-flex', gap: '4px', padding: '4px', borderRadius: '10px', background: 'rgba(0,0,0,0.04)', flexShrink: 0 }}>
              <CategoryButton active={category === 'product-website'} onClick={() => setCategory('product-website')}>
                网站官网
              </CategoryButton>
              <CategoryButton active={category === 'dashboard'} onClick={() => setCategory('dashboard')}>
                数据看板
              </CategoryButton>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={() => openPreview(template)}
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
              <button type="button" onClick={usePreviewTemplate} style={fullscreenPrimaryButtonStyle}>
                立即使用此模板
              </button>
            </div>
          </div>
          {!previewLoaded && (
            <div
              role="status"
              aria-label="模板预览加载中"
              style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0D', color: 'rgba(255,255,255,0.72)', fontSize: '14px', fontWeight: 700 }}
            >
              正在载入模板预览...
            </div>
          )}
          <iframe
            title={`${previewTemplate.name} 全屏模板预览`}
            src={`/api/template-preview/${previewTemplate.id}`}
            sandbox="allow-scripts"
            onLoad={() => setPreviewLoaded(true)}
            style={{ width: '100%', height: '100%', border: 0, background: '#0B0B0D', opacity: previewLoaded ? 1 : 0, transition: 'opacity 160ms ease' }}
          />
        </div>
      )}

      {drawerOpen && selectedTemplate && (
          <aside
            role="dialog"
            aria-modal="false"
            aria-label="配置数据源"
            style={{ width: '420px', maxWidth: '44vw', height: '100%', background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(18px)', borderLeft: '1px solid rgba(0,0,0,0.08)', display: 'grid', gridTemplateRows: '56px 1fr auto', boxShadow: '-18px 0 48px rgba(0,0,0,0.08)', flexShrink: 0 }}
          >
            <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #F1F5F9' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>配置数据源</h3>
              <button type="button" onClick={closeDrawer} aria-label="关闭配置数据源" style={iconButtonStyle}>
                <PanelRightClose size={16} strokeWidth={2} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: '22px' }}>
              <div style={{ marginBottom: '22px' }}>
                <div style={{ marginBottom: '10px', color: '#8A8A8E', fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Selected Template
                </div>
                <TemplateDrawerPreview template={selectedTemplate} />
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px', marginBottom: '18px', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 800 }}>目标进度</span>
                  <span style={{ fontSize: '12px', color: '#0F172A', fontWeight: 800 }}>第 {drawerProgressStep}/3 步</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[1, 2, 3].map(step => (
                    <div
                      key={step}
                      style={{
                        height: '5px',
                        borderRadius: '999px',
                        background: step <= drawerProgressStep ? '#0F172A' : '#E2E8F0',
                        transition: 'background 140ms ease',
                      }}
                    />
                  ))}
                </div>
              </div>

              {drawerError && (
                <div role="alert" style={{ marginBottom: '14px', border: '1px solid rgba(220,38,38,0.18)', background: '#FEF2F2', color: '#B91C1C', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', fontWeight: 700 }}>
                  {drawerError}
                </div>
              )}

              <label htmlFor="publisher-source-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
                输入文本内容
                <span style={{ fontSize: '12px', color: '#94A3B8', background: '#F1F5F9', borderRadius: '6px', padding: '2px 7px' }}>支持 Markdown</span>
              </label>
              <textarea
                id="publisher-source-text"
                value={sourceText}
                onChange={event => setSourceText(event.target.value)}
                placeholder="例如：这是我们的新产品，它具有以下特性..."
                style={{ width: '100%', height: '210px', resize: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '10px', background: 'rgba(250,250,250,0.86)', padding: '14px', outline: 'none', color: '#111827', fontSize: '14px', fontFamily: 'var(--font-sans)' }}
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
                style={{ minHeight: '140px', border: '1.5px dashed rgba(0,0,0,0.14)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', background: queuedFile ? 'rgba(248,248,248,0.9)' : 'rgba(255,255,255,0.72)', color: '#4A4A4A' }}
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
              {drawerError && (
                <div role="alert" style={{ marginBottom: '10px', border: '1px solid rgba(220,38,38,0.18)', background: '#FEF2F2', color: '#B91C1C', borderRadius: '10px', padding: '9px 11px', fontSize: '13px', fontWeight: 700 }}>
                  {drawerError}
                </div>
              )}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{ width: '100%', height: '46px', border: 'none', borderRadius: '10px', background: '#111111', color: '#FFFFFF', fontSize: '15px', fontWeight: 800, cursor: isGenerating ? 'wait' : 'pointer', boxShadow: '0 10px 28px rgba(0,0,0,0.12)' }}
              >
                {isGenerating ? '正在生成...' : '立即生成 HTML'}
              </button>
            </div>
          </aside>
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
        color: active ? '#111827' : '#6E6E73',
        fontSize: '14px',
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
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
    <article
      className="publisher-template-card"
      data-testid={`template-card-${template.id}`}
      data-preview-card="true"
      data-portrait-card="true"
      style={{ position: 'relative', aspectRatio: '3 / 4', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <TemplatePreviewFrame template={template} title={`${template.name} 模板缩略图`} scale={0.24} frameHeight={1700} />
      <div
        className="publisher-card-actions"
        data-testid={`template-card-actions-${template.id}`}
        style={{ position: 'absolute', left: '12px', right: '12px', bottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', opacity: 0, transition: 'opacity 160ms ease', zIndex: 2 }}
      >
        <button type="button" aria-label={`预览 ${template.name}`} onClick={onPreview} style={glassTextButtonStyle}>
          <Maximize size={14} strokeWidth={2} />
          预览
        </button>
        <button type="button" aria-label={`使用模板 ${template.name}`} onClick={onUse} style={{ ...glassTextButtonStyle, background: 'rgba(17,17,17,0.88)', color: '#FFFFFF', border: '1px solid rgba(17,17,17,0.88)' }}>
          使用模板
        </button>
      </div>
    </article>
  )
}

function TemplatePreviewFrame({
  template,
  title,
  scale,
  frameHeight,
}: {
  template: PublisherTemplate
  title: string
  scale: number
  frameHeight: number
}) {
  const scaledSize = `${100 / scale}%`

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#FFFFFF' }}>
      <iframe
        title={title}
        src={`/api/template-preview/${template.id}`}
        loading="lazy"
        sandbox="allow-scripts"
        tabIndex={-1}
        data-real-template-thumbnail="true"
        data-preview-fit="cover-width"
        style={{ position: 'absolute', top: 0, left: 0, width: scaledSize, height: `${frameHeight}px`, minHeight: scaledSize, border: 0, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none', background: '#FFFFFF' }}
      />
    </div>
  )
}

function TemplateDrawerPreview({ template }: { template: PublisherTemplate }) {
  return (
    <div style={{ width: '100%', aspectRatio: '3 / 4', borderRadius: '10px', overflow: 'hidden', background: '#FFFFFF', position: 'relative', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
      <TemplatePreviewFrame template={template} title={`${template.name} 当前模板预览`} scale={0.3} frameHeight={1700} />
    </div>
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

const fullscreenPrimaryButtonStyle = {
  ...fullscreenButtonStyle,
  background: '#FFFFFF',
  borderColor: '#FFFFFF',
  color: '#111111',
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

const glassTextButtonStyle = {
  height: '36px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.58)',
  background: 'rgba(255,255,255,0.72)',
  color: '#111111',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  cursor: 'pointer',
  backdropFilter: 'blur(14px)',
  fontSize: '13px',
  fontWeight: 800,
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
}
