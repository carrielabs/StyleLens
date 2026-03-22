'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/storage/supabaseClient'
import { ChevronLeft } from 'lucide-react'

interface AuthOverlayProps {
  onClose: () => void
}

const systemFont = 'var(--font-sans)';

export default function AuthOverlay({ onClose }: AuthOverlayProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showTooltip, setShowTooltip] = useState<string | null>(null)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Google 登录失败' })
      setLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      triggerTooltip('请输入邮箱地址')
      return
    }
    
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })
      
      if (error) {
        if (error.message.includes('rate limit')) {
          setStep('otp')
          setMessage({ type: 'error', text: '发送频率过快。若您刚收到过验证码，请直接输入；否则请稍后再试。' })
          return
        }
        throw error
      }
      
      setStep('otp')
      setMessage({ type: 'success', text: '验证码已发送至您的邮箱。' })
    } catch (err: any) {
      const errorText = err.message || '发送失败，请稍后重试'
      const translated = errorText.includes('rate limit') 
        ? '发送频率超过限制，请稍后再试或检查最近邮件' 
        : errorText
      setMessage({ type: 'error', text: translated })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) {
      triggerTooltip('请输入验证码')
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      })
      if (error) throw error
      onClose()
    } catch (err: any) {
      setMessage({ type: 'error', text: '验证码错误或已失效' })
    } finally {
      setLoading(false)
    }
  }

  const triggerTooltip = (txt: string) => {
    setShowTooltip(txt)
    setTimeout(() => setShowTooltip(null), 3000)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      backgroundColor: '#FFFFFF',
      display: 'flex',
      fontFamily: systemFont,
      WebkitFontSmoothing: 'antialiased',
      animation: 'overlayFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes overlayFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tooltipPop { 
          0% { opacity: 0; transform: translateX(-50%) translateY(10px); } 
          100% { opacity: 1; transform: translateX(-50%) translateY(0); } 
        }
        input::placeholder { color: #C1C1C6; }
      `}} />

      {/* ── Branding Pane (37%) ── */}
      <div style={{
        flex: '0 0 37%',
        backgroundColor: '#FFFFFF',
        padding: '60px 80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        borderRight: '1px solid rgba(0,0,0,0.06)'
      }}>
        <div>
          <button 
            onClick={onClose}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', 
              background: 'none', border: 'none', color: '#B1B1B6', 
              fontSize: '13.5px', cursor: 'pointer', padding: 0,
              transition: 'color 0.2s', fontWeight: 500
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#1D1D1F'}
            onMouseLeave={e => e.currentTarget.style.color = '#B1B1B6'}
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
            返回
          </button>

          <div style={{ marginTop: '120px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '24px', letterSpacing: '-0.01em' }}>StyleLens</h1>
            <h2 style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: 1.15, maxWidth: '280px', letterSpacing: '-0.02em' }}>
              解构全球<br />顶级设计。
            </h2>
            <p style={{ marginTop: '40px', fontSize: '16px', color: '#8E8E93', lineHeight: 1.6, maxWidth: '260px', fontWeight: 500 }}>
              登录以同步你的分析记录，沉淀属于你的视觉灵感库。
            </p>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#C7C7CC', fontWeight: 500, letterSpacing: '0.01em' }}>
          Authentication engine v1.0.4
        </div>
      </div>

      {/* ── Form Pane (1/2) ── */}
      <div style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 40px',
        position: 'relative'
      }}>
        <div style={{ width: '100%', maxWidth: '380px', position: 'relative' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '40px', transition: 'margin 0.3s ease' }}>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1D1D1F', marginBottom: '16px', letterSpacing: '-0.02em', transition: 'all 0.3s' }}>
              欢迎回来
            </h3>
            <p style={{ fontSize: '15px', color: '#8E8E93', fontWeight: 400, transition: 'all 0.3s' }}>
              请选择登录方式
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Google Login remains visible in OTP step */}
            <div style={{
              transition: 'opacity 0.3s',
              opacity: step === 'otp' ? 0.4 : 1,
              pointerEvents: step === 'otp' ? 'none' : 'auto',
              marginBottom: '0px'
            }}>
              <button 
                onClick={handleGoogleLogin}
                disabled={loading || step === 'otp'}
                style={{
                  width: '100%', height: '48px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)',
                  backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '12px', fontSize: '14px', fontWeight: 600, color: '#1D1D1F', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F5F5F7'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
              >
                <svg width="18" height="18" viewBox="0 0 20 20">
                  <path fill="#4285F4" d="M19.6 10.23c0-.66-.06-1.3-.17-1.92H10v3.62h5.38c-.23 1.25-.94 2.3-2 3.12v2.6h3.24c1.9-1.75 3-4.32 3-7.42z"/>
                  <path fill="#34A853" d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.24-2.6c-.9.6-2.05.97-3.38.97-2.6 0-4.82-1.76-5.6-4.13H1.05v2.54A10 10 0 0010 20z"/>
                  <path fill="#FBBC05" d="M4.4 11.85a6.02 6.02 0 010-3.7V5.61H1.05a10 10 0 000 8.78l3.35-2.54z"/>
                  <path fill="#EA4335" d="M10 3.9c1.47 0 2.78.5 3.82 1.5L16.6 2.6A10 10 0 00.95 4.97l3.35 2.54C5.18 5.76 7.4 3.9 10 3.9z"/>
                </svg>
                Google 账号登录
              </button>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '20px',
              transition: 'opacity 0.3s',
              opacity: step === 'otp' ? 0.4 : 1,
              margin: '32px 0'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.06)' }} />
              <span style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 600, letterSpacing: '0.02em' }}>或</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.06)' }} />
            </div>

            {/* Email form stays on screen but acts as readonly when OTP is active */}
            <form onSubmit={step === 'email' ? handleSendOtp : handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email"
                  placeholder="邮箱地址"
                  value={email}
                  disabled={step === 'otp' || loading}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%', height: '48px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)',
                    padding: '0 16px', fontSize: '14px', fontWeight: 500, outline: 'none',
                    backgroundColor: step === 'otp' ? '#F5F5F7' : '#FFFFFF', 
                    color: step === 'otp' ? '#8E8E93' : '#1D1D1F',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; }}
                />
                
                {step === 'otp' && (
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setMessage(null); setOtp(''); }}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#515151', fontSize: '13px', fontWeight: 500,
                      cursor: 'pointer', padding: '4px 8px', borderRadius: '8px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    修改
                  </button>
                )}
                
                {showTooltip && step === 'email' && (
                  <div style={{
                    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                    marginBottom: '10px', backgroundColor: '#1D1D1F', color: '#FFFFFF', padding: '8px 12px',
                    borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: 'none',
                    fontSize: '12px', whiteSpace: 'nowrap', zIndex: 10, display: 'flex', alignItems: 'center', gap: '6px',
                    animation: 'tooltipPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}>
                    {showTooltip}
                  </div>
                )}
              </div>

              {/* OTP Input smoothly expands, same font size as email */}
              <div style={{
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: step === 'otp' ? 1 : 0,
                maxHeight: step === 'otp' ? '80px' : '0px',
                position: 'relative'
              }}>
                <input 
                  type="text"
                  placeholder="6 位验证码"
                  maxLength={6}
                  value={otp}
                  disabled={step === 'email' || loading}
                  onChange={e => setOtp(e.target.value)}
                  style={{
                    width: '100%', height: '48px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)',
                    padding: '0 16px', fontSize: '14px', fontWeight: 500, outline: 'none',
                    backgroundColor: '#FFFFFF', color: '#1D1D1F', transition: 'all 0.2s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; }}
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', height: '48px', borderRadius: '12px', border: 'none',
                  backgroundColor: '#111111', color: '#FFFFFF',
                  fontSize: '15px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s ease', marginTop: '8px',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? '请稍候...' : (step === 'email' ? '发送验证码' : '确认登录')}
              </button>
              
              <div style={{ 
                minHeight: '24px', marginTop: '12px', fontSize: '13px', 
                color: message?.type === 'error' ? '#FF3B30' : '#34C759', 
                textAlign: 'center', fontWeight: 500, transition: 'opacity 0.3s',
                opacity: message ? 1 : 0
              }}>
                {message?.text}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
