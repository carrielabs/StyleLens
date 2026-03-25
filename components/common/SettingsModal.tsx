'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, X, HelpCircle, Lock } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [geminiKey, setGeminiKey] = useState('')
  const [screenshotKey, setScreenshotKey] = useState('')
  const [showGemini, setShowGemini] = useState(false)
  const [showScreenshot, setShowScreenshot] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      setGeminiKey(localStorage.getItem('customGeminiKey') || '')
      setScreenshotKey(localStorage.getItem('customScreenshotKey') || '')
      setIsClosing(false)
    }
  }, [isOpen])

  if (!isOpen && !isClosing) return null

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200) // Match animation duration
  }

  const handleSave = () => {
    if (geminiKey.trim()) {
      localStorage.setItem('customGeminiKey', geminiKey.trim())
    } else {
      localStorage.removeItem('customGeminiKey')
    }

    if (screenshotKey.trim()) {
      localStorage.setItem('customScreenshotKey', screenshotKey.trim())
    } else {
      localStorage.removeItem('customScreenshotKey')
    }
    
    handleClose()
  }

  return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: isClosing ? 'fadeOut 0.2s ease-out forwards' : 'fadeIn 0.2s ease-out forwards',
        }}
      >
        <div 
          onClick={handleClose}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        />
        
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          animation: isClosing ? 'scaleDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '32px',
            height: '32px',
            borderRadius: '16px',
            border: 'none',
            background: 'rgba(0,0,0,0.04)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8E8E93',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = '#1D1D1F' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#8E8E93' }}
        >
          <X size={16} strokeWidth={2} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1D1D1F', letterSpacing: '-0.01em' }}>
            API Key 设置
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#8E8E93', lineHeight: 1.5 }}>
            StyleLens 默认提供公共的免费使用额度。<br/>若您需要更高频的使用，可配置专属的 API 密钥以解除额度限制。
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            marginTop: '12px', padding: '8px 14px', backgroundColor: 'rgba(245,158,11,0.12)',
            borderRadius: '16px', fontSize: '13px', color: '#92400E', fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            <Lock size={14} color="#92400E" />
            您的 Key 仅安全地存储在当前浏览器本地，不会上传至我们的服务器。
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Gemini Key */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#1D1D1F' }}>
                AI 解析引擎 (Gemini API)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }} className="tooltip-trigger">
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ fontSize: '12px', color: '#0066CC', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  获取 Key ↗
                </a>
                <HelpCircle size={14} color="#8E8E93" style={{ cursor: 'help' }} />
                <div className="tooltip-content" style={{
                    position: 'absolute', right: 0, bottom: '100%', marginBottom: '8px',
                    width: '240px', padding: '10px 12px', backgroundColor: '#1D1D1F',
                    color: '#FFFFFF', fontSize: '12px', borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10,
                    lineHeight: 1.5, pointerEvents: 'none'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px', color: 'rgba(255,255,255,0.9)' }}>如何获取：</div>
                  1. 登录 Google AI Studio (需代理)<br/>
                  2. 点击左侧 <b>Get API key</b><br/>
                  3. 点击 <b>Create API key</b> 并复制<br/>
                  <i style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px', display: 'block' }}>* 官方提供充足的免费日常额度</i>
                </div>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showGemini ? 'text' : 'password'}
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                placeholder="未配置（当前默认使用系统提供的免费日常额度）"
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  backgroundColor: 'rgba(0,0,0,0.02)',
                  fontSize: '14px',
                  color: '#1D1D1F',
                  outline: 'none',
                  transition: 'border-color 0.2s, background-color 0.2s',
                  fontFamily: 'var(--font-mono), monospace',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.3)'; e.currentTarget.style.backgroundColor = '#FFFFFF' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)' }}
              />
              <button
                tabIndex={-1}
                onClick={() => setShowGemini(!showGemini)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#AEAEB2',
                  display: 'flex'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#8E8E93'}
                onMouseLeave={e => e.currentTarget.style.color = '#AEAEB2'}
              >
                {showGemini ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#AEAEB2', paddingLeft: '4px' }}>
              * 官方提供充足的免费日常额度
            </div>
          </div>

          {/* ScreenshotOne Key */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#1D1D1F' }}>
                高清网页截图引擎 (ScreenshotOne API)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }} className="tooltip-trigger">
                <a 
                  href="https://screenshotone.com/" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ fontSize: '12px', color: '#0066CC', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  获取 Key ↗
                </a>
                <HelpCircle size={14} color="#8E8E93" style={{ cursor: 'help' }} />
                <div className="tooltip-content" style={{
                    position: 'absolute', right: 0, bottom: '100%', marginBottom: '8px',
                    width: '240px', padding: '10px 12px', backgroundColor: '#1D1D1F',
                    color: '#FFFFFF', fontSize: '12px', borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10,
                    lineHeight: 1.5, pointerEvents: 'none'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px', color: 'rgba(255,255,255,0.9)' }}>如何获取：</div>
                  1. 使用邮箱注册/登录 ScreenshotOne<br/>
                  2. 进入 <b>Dashboard</b> 控制台<br/>
                  3. 复制 <b>Access Key</b> (不是 Secret Key)<br/>
                  <i style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px', display: 'block' }}>* 官方每月提供 100 次免费调用额度</i>
                </div>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showScreenshot ? 'text' : 'password'}
                value={screenshotKey}
                onChange={e => setScreenshotKey(e.target.value)}
                placeholder="未配置（当前默认使用系统提供的免费调用额度）"
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  backgroundColor: 'rgba(0,0,0,0.02)',
                  fontSize: '14px',
                  color: '#1D1D1F',
                  outline: 'none',
                  transition: 'border-color 0.2s, background-color 0.2s',
                  fontFamily: 'var(--font-mono), monospace',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.3)'; e.currentTarget.style.backgroundColor = '#FFFFFF' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)' }}
              />
              <button
                tabIndex={-1}
                onClick={() => setShowScreenshot(!showScreenshot)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#AEAEB2',
                  display: 'flex'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#8E8E93'}
                onMouseLeave={e => e.currentTarget.style.color = '#AEAEB2'}
              >
                {showScreenshot ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#AEAEB2', paddingLeft: '4px' }}>
              * 官方每月提供 100 次免费调用额度
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          style={{
            marginTop: '8px',
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#1D1D1F',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'transform 0.1s, opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          保存设置
        </button>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
          @keyframes scaleUp { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          @keyframes scaleDown { from { opacity: 1; transform: scale(1) translateY(0); } to { opacity: 0; transform: scale(0.96) translateY(10px); } }
          
          .tooltip-content {
            opacity: 0;
            transform: translateY(4px);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .tooltip-trigger:hover .tooltip-content {
            opacity: 1;
            transform: translateY(0);
          }
        `}} />
      </div>
    </div>
  )
}
