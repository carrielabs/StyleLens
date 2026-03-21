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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      
      <div style={{ 
        width: '100%', maxWidth: '380px', 
        display: 'flex', flexDirection: 'column'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', fontStyle: 'italic', textDecoration: 'none' }}>
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
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Email Address</label>
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
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Password</label>
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
