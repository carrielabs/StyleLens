'use client'

import { useEffect, useRef, useState } from 'react'

export default function ColorHighlighter({ src, targetHex }: { src: string, targetHex: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [isReady, setIsReady] = useState(false)

  // 1. Load image only once
  useEffect(() => {
    if (!src) return
    const img = new Image()
    img.crossOrigin = 'anonymous' // Set before src
    img.src = src
    img.onload = () => {
      imageRef.current = img
      setIsReady(true)
    }
  }, [src])

  // 2. Draw and process pixels when targetHex changes
  useEffect(() => {
    if (!isReady || !imageRef.current || !canvasRef.current || !targetHex) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const img = imageRef.current
    
    // PERF FIX: Downscale the canvas dramatically to avoid lagging on 8000px length screenshots
    const MAX_CANVAS_WIDTH = 400
    const scaleFactor = img.width > MAX_CANVAS_WIDTH ? MAX_CANVAS_WIDTH / img.width : 1
    
    canvas.width = img.width * scaleFactor
    canvas.height = img.height * scaleFactor

    // Draw original image downscaled
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    try {
      // Get pixels on the much smaller canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Parse target hex
      const targetR = parseInt(targetHex.slice(1, 3), 16)
      const targetG = parseInt(targetHex.slice(3, 5), 16)
      const targetB = parseInt(targetHex.slice(5, 7), 16)

      // A generous tolerance because of compression, anti-aliasing, and shadows
      const TOLERANCE = 45
      let minY = Infinity

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i+1]
        const b = data[i+2]
        
        const dist = Math.sqrt(
          Math.pow(r - targetR, 2) + Math.pow(g - targetG, 2) + Math.pow(b - targetB, 2)
        )

        if (dist < TOLERANCE) {
          // Keep pixel original, fully opaque
          data[i+3] = 255
          
          // Track the highest Y coordinate to scroll there
          const pixelIdx = i / 4
          const y = Math.floor(pixelIdx / canvas.width)
          if (y < minY) minY = y

        } else {
          // Dim and grayscale non-matching pixels for extreme contrast
          const gray = r * 0.299 + g * 0.587 + b * 0.114
          data[i] = gray * 0.5 // darken
          data[i+1] = gray * 0.5
          data[i+2] = gray * 0.5
          data[i+3] = 40 // very transparent
        }
      }

      ctx.putImageData(imageData, 0, 0)
      
      // Auto-scroll logic inside the try block
      if (minY !== Infinity) {
        const parentList = canvasRef.current?.closest('.no-scrollbar')
        if (parentList) {
          const displayHeight = canvasRef.current.offsetHeight
          const scale = displayHeight / canvas.height
          const targetScrollTop = (minY * scale) - 100
          
          parentList.scrollTo({
            top: targetScrollTop > 0 ? targetScrollTop : 0,
            behavior: 'smooth'
          })
        }
      }
    } catch (err) {
      console.warn('ColorHighlighter: Canvas access failed (likely CORS). Using simple highlight fallback.', err)
      // Fallback: Just draw a semi-transparent overlay indicating highlight is unavailable for this image
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = targetHex
      ctx.font = 'bold 12px sans-serif'
      ctx.fillText('像素高亮由于跨域限制暂不可用', 10, 20)
    }

  }, [targetHex, isReady])

  if (!targetHex) return null

  return (
    <canvas 
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        pointerEvents: 'none',
        borderRadius: '8px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    />
  )
}
