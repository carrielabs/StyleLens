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
        width: '100%', maxWidth: '360px', 
        background: 'var(--bg-surface)', 
        border: '1px solid var(--border-subtle)', 
        borderRadius: 'var(--radius-base)',
        padding: '32px'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            StyleLens
          </Link>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            {isLogin ? '登录以访问素材库' : '创建新账号'}
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
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>邮箱地址</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>密码</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: '40px', background: 'var(--text-primary)', color: 'var(--text-inverse)',
              border: 'none', borderRadius: 'var(--radius-base)', fontSize: '14px', fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '8px'
            }}
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>

        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {isLogin ? '没有账号？' : '已有账号？'}
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(null) }}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', marginLeft: '8px', cursor: 'pointer', fontWeight: 500 }}
          >
            {isLogin ? '点击注册' : '返回登录'}
          </button>
        </div>

      </div>

    </div>
  )
}

const inputStyle = {
  width: '100%', height: '40px', padding: '0 12px',
  background: 'var(--bg-base)', border: '1px solid var(--border-base)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
}
