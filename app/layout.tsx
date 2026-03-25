import type { Metadata } from 'next'
import { Figtree, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const figtree = Figtree({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900']
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StyleLens — 解构全球顶级网页设计',
  description: '专业的视觉风格提取与方案生成工具，沉淀你的设计灵感。',
  icons: {
    icon: '/logo-graphic.png',
    apple: '/logo-graphic.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${figtree.variable} ${jetbrainsMono.variable}`}>
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
