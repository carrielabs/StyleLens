'use client'

import { useState } from 'react'
import { createClient } from '@/lib/storage/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/library')
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` }
        })
        if (error) throw error
        setError('注册成功！请检查您的邮箱进行激活。')
      }
    } catch (err: any) {
      setError(err.message || '认证失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Google 登录失败')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      
      <div style={{ 
        width: '100%', maxWidth: '380px', 
        display: 'flex', flexDirection: 'column'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', fontStyle: 'italic', textDecoration: 'none' }}>
            StyleLens Design Office
          </Link>
          <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '12px', letterSpacing: '0.02em' }}>
            {isLogin ? 'Sign in to access your aesthetic records' : 'Create an account'}
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px', background: 'rgba(201, 169, 110, 0.1)',
            border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)',
            color: 'var(--accent)', fontSize: '13px', marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'none', letterSpacing: '0.02em', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle as any}
              onFocus={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onBlur={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'none', letterSpacing: '0.02em', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle as any}
              onFocus={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onBlur={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: '56px', background: 'var(--text-primary)', color: 'var(--text-inverse)',
              border: 'none', borderRadius: '100px', fontSize: '15px', fontWeight: 600, letterSpacing: '0.02em',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '24px',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(0,0,0,0.15)'
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)' )}
            onMouseLeave={e => !loading && (e.currentTarget.style.transform = 'translateY(0)' )}
          >
            {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '0.02em', fontWeight: 600 }}>或</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            height: '56px', background: '#FFFFFF', color: 'var(--text-primary)',
            border: '1px solid var(--border-base)', borderRadius: '100px', 
            fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', 
            justifyContent: 'center', gap: '12px', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
          }}
          onMouseEnter={e => !loading && (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => !loading && (e.currentTarget.style.background = '#FFFFFF')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84a4.14 4.14 0 01-1.8 2.71v2.26h2.91a8.78 8.78 0 002.69-6.6z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.57-5.04-3.7H.95v2.32A9 9 0 009 18z"/>
            <path fill="#FBBC05" d="M3.96 10.71a5.41 5.41 0 010-3.42V4.97H.95a9 9 0 000 8.06l3.01-2.32z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15.02 2.3A9 9 0 00.95 4.97l3.01 2.32c.71-2.13 2.7-3.71 5.04-3.71z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {isLogin ? 'New to StyleLens?' : 'Already have an account?'}
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(null) }}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', marginLeft: '8px', cursor: 'pointer', fontWeight: 600, borderBottom: '1px solid var(--text-primary)', paddingBottom: '2px' }}
          >
            {isLogin ? 'Create one' : 'Sign in'}
          </button>
        </div>

      </div>

    </div>
  )
}

const inputStyle = {
  width: '100%', height: '56px', padding: '0 24px',
  background: 'var(--bg-surface)', border: 'none',
  borderRadius: '16px', color: 'var(--text-primary)', fontSize: '15px', outline: 'none',
  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
}
