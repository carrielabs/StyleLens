import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StyleLens — 视觉风格提取工具',
  description: '提取设计系统的顶级工具',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={jakarta.variable}>
      <body style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
