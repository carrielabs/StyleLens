import { fetchLibrary } from '@/lib/storage/libraryStore'
import { createClient } from '@/lib/storage/supabaseServer'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: records, error } = await fetchLibrary('newest')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '52px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <Link href="/" style={{
          fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
          StyleLens
        </Link>
        <div style={{ display: 'flex', gap: '4px' }}>
          <Link href="/" className="nav-link" style={navLinkStyle(false)}>提取风格</Link>
          <Link href="/library" className="nav-link" style={navLinkStyle(true)}>素材库</Link>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          已登录
        </div>
      </nav>

      <main style={{ flex: 1, padding: '48px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: '8px' }}>
            我的视觉素材库
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            所有提取过的设计系统风格均保存在此。
          </p>
        </div>

        {error && (
          <div style={{ color: 'var(--error)', marginBottom: '24px' }}>读取库失败: {error}</div>
        )}

        {!records || records.length === 0 ? (
          <div style={{ 
            textAlign: 'center', padding: '64px 0', 
            border: '1px dashed var(--border-base)', borderRadius: 'var(--radius-base)' 
          }}>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '16px' }}>
              素材库还是空的
            </div>
            <Link href="/" style={btnSecondaryStyle}>去提取风格</Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {records.map(record => (
              <LibraryCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function LibraryCard({ record }: { record: any }) {
  const { style_data } = record
  
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-base)',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'border-color var(--duration-fast)'
    }}>
      {record.thumbnail_url ? (
        <div style={{ height: '160px', overflow: 'hidden', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
          <img 
            src={record.thumbnail_url} 
            alt={record.source_label} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ) : (
        <div style={{ 
          height: '160px', background: 'var(--bg-elevated)', 
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-tertiary)', fontSize: '12px'
        }}>
          [{record.source_type.toUpperCase()}] {record.source_label}
        </div>
      )}

      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {style_data.colors?.slice(0, 5).map((c: any, i: number) => (
            <div key={i} style={{ 
              width: '16px', height: '16px', borderRadius: '4px', 
              background: c.hex, border: '1px solid rgba(255,255,255,0.1)' 
            }} />
          ))}
        </div>
        
        <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.4 }}>
          {style_data.summary}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {new Date(record.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

const navLinkStyle = (active: boolean) => ({
  fontSize: '13px', textDecoration: 'none',
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  padding: '6px 12px', borderRadius: 'var(--radius-sm)',
  background: active ? 'var(--bg-hover)' : 'transparent',
  fontWeight: active ? 500 : 400
})

const btnSecondaryStyle = {
  background: 'transparent', color: 'var(--text-primary)', textDecoration: 'none',
  border: '1px solid var(--border-base)', display: 'inline-flex', alignItems: 'center',
  height: '32px', padding: '0 14px', borderRadius: 'var(--radius-base)',
  fontSize: '13px', fontWeight: 500
}
