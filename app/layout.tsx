import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StyleLens — 解构全球顶级网页设计',
  description: '专业的视觉风格提取与方案生成工具，沉淀你的设计灵感。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={jakarta.variable}>
      <body style={{ 
        fontFamily: 'var(--font-sans)', 
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
        margin: 0
      }}>
        {children}
      </body>
    </html>
  )
}
