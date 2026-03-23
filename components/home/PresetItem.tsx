'use client'

import { useState } from 'react'
import { DisplayStyleReport } from '@/lib/types'

interface PresetItemProps {
  preset: DisplayStyleReport
  isActive: boolean
  onClick: () => void
  collapsed: boolean
}

export default function PresetItem({ preset, isActive, onClick, collapsed }: PresetItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Get a representative brand color (usually index 2 or the 'primary' role)
  const brandColor = preset.colors.find(c => c.role === 'primary')?.hex || '#000000'

  if (collapsed) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={preset.sourceLabel}
        style={{
          width: '100%',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          background: isActive ? 'rgba(0,0,0,0.05)' : (isHovered ? 'rgba(0,0,0,0.025)' : 'transparent'),
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s',
          padding: 0
        }}
      >
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: brandColor,
          boxShadow: `0 0 0 2px #FFFFFF, 0 0 0 3px ${brandColor}22`
        }} />
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        padding: '8px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        border: 'none',
        borderRadius: '8px',
        background: isActive ? 'rgba(0,0,0,0.05)' : (isHovered ? 'rgba(0,0,0,0.025)' : 'transparent'),
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
        fontFamily: 'var(--font-sans)'
      }}
    >
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: brandColor,
        flexShrink: 0,
        boxShadow: `0 0 0 2px #FFFFFF, 0 0 0 3px ${brandColor}11`
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: '14px',
          fontWeight: isActive ? 500 : 400,
          color: '#1D1D1F',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {preset.sourceLabel}
        </span>
      </div>
    </button>
  )
}
