import type { Metadata } from 'next'
import { Inter, Noto_Serif_SC } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const notoSerif = Noto_Serif_SC({
  subsets: ['latin'], // SC version includes Latin subsets
  weight: ['400', '500', '600'],
  variable: '--font-serif',
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
    <html lang="zh-CN" className={`${inter.variable} ${notoSerif.variable}`}>
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
