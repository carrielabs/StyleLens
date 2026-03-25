'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Info, Check, HelpCircle } from 'lucide-react'

export default function ApiKeysSection() {
  const [geminiKey, setGeminiKey] = useState('')
  const [screenshotKey, setScreenshotKey] = useState('')
  const [savedGeminiKey, setSavedGeminiKey] = useState('')
  const [savedScreenshotKey, setSavedScreenshotKey] = useState('')
  const [showGemini, setShowGemini] = useState(false)
  const [showScreenshot, setShowScreenshot] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const g = localStorage.getItem('customGeminiKey') || ''
    const s = localStorage.getItem('customScreenshotKey') || ''
    setGeminiKey(g)
    setScreenshotKey(s)
    setSavedGeminiKey(g)
    setSavedScreenshotKey(s)
  }, [])

  // Dirty check: user has changed at least one field
  const isDirty = geminiKey !== savedGeminiKey || screenshotKey !== savedScreenshotKey

  const handleSave = () => {
    const gTrim = geminiKey.trim()
    const sTrim = screenshotKey.trim()
    
    if (gTrim) localStorage.setItem('customGeminiKey', gTrim)
    else localStorage.removeItem('customGeminiKey')

    if (sTrim) localStorage.setItem('customScreenshotKey', sTrim)
    else localStorage.removeItem('customScreenshotKey')
    
    setSavedGeminiKey(gTrim)
    setSavedScreenshotKey(sTrim)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', fontFamily: 'var(--font-sans)' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .tooltip-trigger { position: relative; }
        .tooltip-content {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          width: 280px;
          padding: 16px;
          background: #FFFFFF;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          z-index: 100;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          color: #1D1D1F;
          font-size: 13px;
          font-weight: 400;
          line-height: 1.6;
        }
        .tooltip-trigger:hover .tooltip-content {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(-2px);
        }
        .tooltip-content::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: #FFFFFF transparent transparent transparent;
        }
      `}} />

      {/* Header Section - No horizontal line as requested */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '15px', 
          fontWeight: 600, 
          color: '#1D1D1F',
          lineHeight: '1.2', /* Standard line height for 15px */
        }}>
          API 配置 (API Keys)
        </h2>
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          color: '#86868B', 
          lineHeight: 1.5,
        }}>
          StyleLens 默认提供公共的免费使用额度。若您由于高频使用遇到额度限制，可在此配置您的专属 API 密钥。配置后，系统将优先使用您的私有密钥进行处理。
        </p>

        {/* Claude Style Security Callout - Box style like Screenshot 3 */}
        <div style={{
          marginTop: '8px',
          padding: '12px 16px',
          backgroundColor: '#F9F9F9',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Info size={16} color="#1D1D1F" strokeWidth={2.5} />
          <span style={{ fontSize: '13px', color: '#1D1D1F', fontWeight: 500 }}>
            您的密钥仅安全地存储在本地浏览器中，绝不会上传至我们的服务器。
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Gemini API Section */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#1D1D1F' }}>
                AI 解析引擎 (Gemini API)
              </label>
              <div className="tooltip-trigger" style={{ cursor: 'help', display: 'flex', alignItems: 'center', color: '#8E8E93' }}>
                <HelpCircle size={14} />
                <div className="tooltip-content">
                  <strong style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>如何获取：</strong>
                  <ol style={{ paddingLeft: '18px', margin: 0 }}>
                    <li>登录 Google AI Studio (需代理)</li>
                    <li>点击左侧导航栏 Get API key</li>
                    <li>点击 Create API key 并复制该字符串</li>
                  </ol>
                  <p style={{ marginTop: '10px', color: '#6E6E73', fontSize: '12px' }}>* 官方提供充足的免费日常额度</p>
                </div>
              </div>
            </div>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer"
              style={{ fontSize: '13px', color: '#0066CC', textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              获取密钥 ↗
            </a>
          </div>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type={showGemini ? 'text' : 'password'}
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
              placeholder="未配置（当前使用系统公共额度）"
              style={{
                width: '100%',
                padding: '12px 40px 12px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.1)',
                backgroundColor: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.15s ease',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#1D1D1F';
                e.currentTarget.style.boxShadow = '0 0 0 1px #1D1D1F';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={() => setShowGemini(!showGemini)}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#8E8E93',
                display: 'flex', padding: '4px'
              }}
            >
              {showGemini ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        </section>

        {/* Screenshot API Section */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#1D1D1F' }}>
                网页截图引擎 (ScreenshotOne)
              </label>
              <div className="tooltip-trigger" style={{ cursor: 'help', display: 'flex', alignItems: 'center', color: '#8E8E93' }}>
                <HelpCircle size={14} />
                <div className="tooltip-content">
                  <strong style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>如何获取：</strong>
                  <ol style={{ paddingLeft: '18px', margin: 0 }}>
                    <li>使用邮箱注册/登录 ScreenshotOne</li>
                    <li>进入 Dashboard 控制台</li>
                    <li>复制排在前面的 Access Key</li>
                  </ol>
                  <p style={{ marginTop: '10px', color: '#6E6E73', fontSize: '12px' }}>* 官方每月提供 100 次免费调用额度</p>
                </div>
              </div>
            </div>
            <a 
              href="https://screenshotone.com/" 
              target="_blank" 
              rel="noreferrer"
              style={{ fontSize: '13px', color: '#0066CC', textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              获取密钥 ↗
            </a>
          </div>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type={showScreenshot ? 'text' : 'password'}
              value={screenshotKey}
              onChange={e => setScreenshotKey(e.target.value)}
              placeholder="未配置（当前使用系统公共额度）"
              style={{
                width: '100%',
                padding: '12px 40px 12px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.1)',
                backgroundColor: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.15s ease',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#1D1D1F';
                e.currentTarget.style.boxShadow = '0 0 0 1px #1D1D1F';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={() => setShowScreenshot(!showScreenshot)}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#8E8E93',
                display: 'flex', padding: '4px'
              }}
            >
              {showScreenshot ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        </section>
      </div>

      {/* Footer / Save Button Section */}
      <div style={{ 
        marginTop: '12px', 
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 24px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: isSaved ? '#34C759' : isDirty ? '#1D1D1F' : '#E8E8ED',
            color: isSaved || isDirty ? '#FFFFFF' : '#8E8E93',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isDirty ? 'pointer' : 'default',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            width: 'fit-content',
          }}
          onMouseEnter={e => { if (isDirty && !isSaved) e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={e => { if (isDirty && !isSaved) e.currentTarget.style.opacity = '1' }}
          onMouseDown={e => { if (isDirty && !isSaved) e.currentTarget.style.transform = 'scale(0.98)' }}
          onMouseUp={e => { if (isDirty && !isSaved) e.currentTarget.style.transform = 'scale(1)' }}
        >
          {isSaved ? (
            <>
              <Check size={16} strokeWidth={3} />
              已保存并应用
            </>
          ) : (
            '更新设置'
          )}
        </button>
        {!isDirty && !isSaved && (
          <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
            修改任意密钥字段后即可保存
          </p>
        )}
      </div>
    </div>
  )
}
