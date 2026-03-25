'use client'

import { useEffect, useRef } from 'react'

export default function MagicalHeroLogo() {
  const logoRef = useRef<HTMLImageElement>(null)
  
  useEffect(() => {
    let animationFrameId: number
    
    // Physics state
    const state = {
      mouseX: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
      mouseY: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
      currentX: 0,
      currentY: 0,
      currentRotateX: 0,
      currentRotateY: 0,
      lastMouseMoveTime: Date.now(),
      hasEverMoved: false
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      state.mouseX = e.clientX
      state.mouseY = e.clientY
      state.lastMouseMoveTime = Date.now()
      state.hasEverMoved = true
    }

    window.addEventListener('mousemove', handleMouseMove)
    
    const renderLoop = () => {
      if (!logoRef.current) return
      
      const logo = logoRef.current
      const rect = logo.getBoundingClientRect()
      
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const now = Date.now()
      const timeSinceMouseMoved = now - state.lastMouseMoveTime
      
      // Determine if idle: no mouse movement for 2.5 seconds or never moved
      const isIdle = timeSinceMouseMoved > 2500 || !state.hasEverMoved
      
      let targetX = 0
      let targetY = 0
      let targetRotateX = 0
      let targetRotateY = 0
      let targetScale = 1
      let influence = 0
      
      if (!isIdle) {
        // --- CURSOR TRACKING MODE ---
        const deltaX = state.mouseX - centerX
        const deltaY = state.mouseY - centerY
        
        const angle = Math.atan2(deltaY, deltaX)
        // Max distance to track (e.g. 600px radius)
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 600)
        const normalizedDistance = distance / 600
        
        influence = 1 - Math.pow(normalizedDistance, 2)
        
        targetX = Math.cos(angle) * (20 * influence)
        targetY = Math.sin(angle) * (20 * influence)
        
        targetRotateX = -(deltaY / rect.height) * 18 * influence
        targetRotateY = (deltaX / rect.width) * 18 * influence
        targetScale = 1 + 0.12 * influence
      }
      
      // --- IDLE "BREAK FREE" COMPUTE ---
      // We always compute this and smoothly blend to it when idle
      const time = now * 0.001
      
      // Base gentle floating (breathing in space)
      const floatX = Math.sin(time * 1.5) * 5
      const floatY = Math.cos(time * 2.1) * 7
      
      // "Break free" / Struggle effect (Triggers every ~4.5 seconds)
      const strugglePhase = (time % 4.5) / 4.5 
      let struggleX = 0
      let struggleY = 0
      let struggleRotateX = 0
      let struggleRotateY = 0
      
      if (strugglePhase > 0.82) {
        // Sharp fast sine waves to simulate a trembling/shaking struggle
        // Bell curve intensity: 0 -> 1 -> 0
        const shakeIntensity = Math.sin((strugglePhase - 0.82) * Math.PI * (1/0.18)) 
        
        // High frequency noise for "struggle"
        struggleX = Math.sin(time * 45) * 12 * shakeIntensity
        struggleY = Math.cos(time * 50) * 8 * shakeIntensity
        struggleRotateX = Math.sin(time * 35) * 15 * shakeIntensity
        struggleRotateY = Math.cos(time * 40) * 15 * shakeIntensity
      }
      
      if (isIdle) {
        // Switch completely to idle physics
        targetX = floatX + struggleX
        targetY = floatY + struggleY
        targetRotateX = (floatY * 0.5) + struggleRotateX
        targetRotateY = (floatX * 0.5) + struggleRotateY
        targetScale = 1 + Math.sin(time * 2) * 0.03 // Gentle breathing scale
        
        // Pulse shadow slightly during struggle
        influence = 0.2 + (Math.abs(struggleX) / 12) * 0.2 
      }
      
      // --- LERP PHYSICS ---
      // Smoothly interpolate current values towards targets
      const smoothing = isIdle ? 0.06 : 0.15 // Slower, driftier return to idle; faster tracking
      state.currentX += (targetX - state.currentX) * smoothing
      state.currentY += (targetY - state.currentY) * smoothing
      state.currentRotateX += (targetRotateX - state.currentRotateX) * smoothing
      state.currentRotateY += (targetRotateY - state.currentRotateY) * smoothing
      
      // --- APPLY TRANSFORMS ---
      logo.style.transform = `translate3d(${state.currentX}px, ${state.currentY}px, 0) perspective(400px) rotateX(${state.currentRotateX}deg) rotateY(${state.currentRotateY}deg) scale(${targetScale})`
      
      // Shadow responds to orientation (always points "away" from tilt)
      const shadowX = -state.currentX * 1.2
      const shadowY = -state.currentY * 1.2 + 12
      logo.style.filter = `drop-shadow(${shadowX}px ${shadowY}px ${15 + 10*influence}px rgba(0,0,0,${0.08 + 0.1*influence}))`
      
      animationFrameId = requestAnimationFrame(renderLoop)
    }
    
    // Start loop
    animationFrameId = requestAnimationFrame(renderLoop)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img 
        ref={logoRef}
        src="/logo-graphic.png" 
        alt="StyleLens Logo" 
        style={{ 
          width: '72px', 
          height: '72px', 
          cursor: 'pointer',
          transformStyle: 'preserve-3d',
          zIndex: 10
        }} 
      />
      {/* Subtle glowing ambient behind the logo for energy */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '130%',
        height: '130%',
        background: 'radial-gradient(circle, rgba(0,0,0,0.04) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        zIndex: 1,
        pointerEvents: 'none'
      }} />
    </div>
  )
}
