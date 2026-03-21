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
        border: isDragging ? '1.5px dashed #1A1A1A' : '1.5px dashed #D8D8D8',
        backgroundColor: isDragging ? '#F8F8F8' : '#FAFAFA',
        borderRadius: '16px',
        padding: '36px 32px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.25s ease',
        opacity: disabled ? 0.5 : 1,
        gap: '12px',
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

      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        background: isDragging ? '#1A1A1A' : '#EBEBEB',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px',
        color: isDragging ? '#fff' : '#999',
        transition: 'all 0.25s ease',
      }}>+</div>

      <div>
        <div style={{ fontSize: '15px', color: '#1A1A1A', fontWeight: 600, textAlign: 'center', marginBottom: '4px', fontFamily: 'inherit' }}>
          拖拽设计图至此处
        </div>
        <div style={{ fontSize: '13px', color: '#BBBBBB', textAlign: 'center', fontFamily: 'inherit' }}>
          支持 JPG、PNG、WebP，最大 20MB
        </div>
      </div>
    </div>
  )
}
