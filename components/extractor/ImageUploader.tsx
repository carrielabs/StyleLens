'use client'

import { useState, useRef } from 'react'
import type { StyleReport } from '@/lib/types'

interface ImageUploaderProps {
  onStart: () => void
  onSuccess: (report: StyleReport) => void
  onError: (error: string) => void
  disabled?: boolean
}

export default function ImageUploader({ onStart, onSuccess, onError, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true)
    } else if (e.type === 'dragleave') {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) processFile(file)
        break
      }
    }
  }

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError('不支持的文件格式，请上传图片 (JPG/PNG/WebP/GIF)')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      onError('图片过大，请上传 20MB 以内的文件')
      return
    }

    onStart()

    // 转换为 Base64
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            sourceType: 'image',
            sourceLabel: file.name
          })
        })

        const data = await res.json()
        if (data.success) {
          onSuccess(data.report)
        } else {
          onError(data.error || '提取失败')
        }
      } catch (err: any) {
        onError(err.message || '网络请求失败，请稍后重试')
      }
    }
    reader.onerror = () => {
      onError('读取文件失败')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div 
      style={{
        border: `1px dashed ${isDragging ? 'var(--border-strong)' : 'var(--border-base)'}`,
        backgroundColor: isDragging ? 'var(--bg-hover)' : 'transparent',
        borderRadius: 'var(--radius-base)',
        padding: '40px 24px',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: disabled ? 0.5 : 1
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onPaste={handlePaste}
      onClick={() => !disabled && fileInputRef.current?.click()}
      tabIndex={0}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/jpeg, image/png, image/webp, image/gif, image/svg+xml"
        onChange={handleChange}
        disabled={disabled}
      />
      <div style={{ fontSize: '28px', marginBottom: '12px', opacity: isDragging ? 0.8 : 0.4 }}>
        ↗
      </div>
      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
        <strong style={{ color: 'var(--text-primary)' }}>拖拽图片到此处</strong> / 点击选择 / 或是直接粘贴 (Ctrl+V)
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
        支持 JPG、PNG、WebP、GIF · 最大 20MB
      </div>
    </div>
  )
}
