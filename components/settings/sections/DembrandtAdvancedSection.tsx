'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { Check, Info } from 'lucide-react'

type DembrandtSettings = {
  mobile: boolean
  slow: boolean
  wcag: boolean
  crawl: number
  sitemap: boolean
  compareWithLastUrl: boolean
  stealth: boolean
  keepAnimations: boolean
  includeRawColors: boolean
  darkMode: boolean
  cookie: string
}

const STORAGE_KEY = 'stylelens.dembrandtOptions'

const DEFAULTS: DembrandtSettings = {
  mobile: true,
  slow: true,
  wcag: true,
  crawl: 0,
  sitemap: false,
  compareWithLastUrl: false,
  stealth: false,
  keepAnimations: true,
  includeRawColors: true,
  darkMode: false,
  cookie: '',
}

function loadSettings(): DembrandtSettings {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return DEFAULTS
  }
}

export default function DembrandtAdvancedSection() {
  const [settings, setSettings] = useState<DembrandtSettings>(DEFAULTS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const save = (next: DembrandtSettings) => {
    setSettings(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  const setField = <K extends keyof DembrandtSettings>(key: K, value: DembrandtSettings[K]) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1D1D1F' }}>
          Dembrandt 高级参数
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#86868B', lineHeight: 1.5 }}>
          这些参数只影响网页 URL 提取。图片上传不会使用它们。
        </p>
      </div>

      <div style={{
        padding: '12px 16px',
        backgroundColor: '#F9F9F9',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}>
        <Info size={16} color="#1D1D1F" strokeWidth={2.5} />
        <span style={{ fontSize: '13px', color: '#1D1D1F', fontWeight: 500, lineHeight: 1.5 }}>
          官方 crawl / sitemap / mobile / dark / cookie 参数会直接传给 Dembrandt 原生引擎；也可以按开关把上一次 URL 结果当 baseline。
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
        {[
          ['mobile', 'Mobile'],
          ['slow', 'Slow'],
          ['wcag', 'WCAG'],
          ['sitemap', 'Sitemap'],
          ['compareWithLastUrl', 'Compare last URL'],
          ['stealth', 'Stealth'],
          ['keepAnimations', 'Keep animations'],
          ['includeRawColors', 'Raw colors'],
          ['darkMode', 'Dark mode'],
        ].map(([key, label]) => (
          <label key={key} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(0,0,0,0.08)',
            background: '#FFFFFF',
            fontSize: '13px',
            color: '#1D1D1F',
          }}>
            <input
              type="checkbox"
              checked={settings[key as keyof DembrandtSettings] as boolean}
              onChange={e => setField(key as keyof DembrandtSettings, e.target.checked as never)}
            />
            {label}
          </label>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: '#1D1D1F', fontWeight: 500 }}>Crawl 页数</span>
          <input
            type="number"
            min={0}
            max={20}
            value={settings.crawl}
            onChange={e => setField('crawl', Number.parseInt(e.target.value || '0', 10) || 0)}
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: '#1D1D1F', fontWeight: 500 }}>Cookie</span>
          <input
            type="text"
            value={settings.cookie}
            onChange={e => setField('cookie', e.target.value)}
            placeholder="session=..."
            style={inputStyle}
          />
        </label>
      </div>

      <div style={{
        padding: '12px 16px',
        backgroundColor: '#F9F9F9',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: '12px',
        fontSize: '13px',
        color: '#1D1D1F',
        lineHeight: 1.5,
      }}>
        开启后，下一次 URL 提取会自动拿上一次 URL 结果做 baseline，漂移会直接进报告审计。
      </div>

      <button
        onClick={() => save(settings)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          width: 'fit-content',
          border: 'none',
          borderRadius: '999px',
          padding: '10px 16px',
          background: '#1D1D1F',
          color: '#FFFFFF',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {saved ? <Check size={16} /> : null}
        {saved ? '已保存' : '保存参数'}
      </button>
    </section>
  )
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(0,0,0,0.1)',
  backgroundColor: '#FFFFFF',
  fontSize: '14px',
  outline: 'none',
}
