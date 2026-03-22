import React from 'react'

/**
 * Solar terms mapping (Approximate for 2024-2026)
 * Format: 'MM-DD': { name: string, subtext: string }
 */
const SOLAR_TERMS: Record<string, { name: string; subtext: string }> = {
  '01-05': { name: '小寒', subtext: '月初寒尚小，待向此中生' },
  '01-20': { name: '大寒', subtext: '大寒虽寒，春晓渐近' },
  '02-04': { name: '立春', subtext: '风和日暖，万物生辉' },
  '02-19': { name: '雨水', subtext: '随风潜入夜，润物细无声' },
  '03-05': { name: '惊蛰', subtext: '春雷始鸣，万物复苏' },
  '03-20': { name: '春分', subtext: '春色正中分，灵感如新' },
  '04-04': { name: '清明', subtext: '万物皆洁齐，而谓之清明' },
  '04-19': { name: '谷雨', subtext: '雨生百谷，万物更新' },
  '05-05': { name: '立夏', subtext: '火云满山翠，晚步绿阴间' },
  '05-20': { name: '小满', subtext: '小满物生长，将熟未熟时' },
  '06-05': { name: '芒种', subtext: '收获与播种，皆有时节' },
  '06-21': { name: '夏至', subtext: '昼之最长，夏之极致' },
  '07-06': { name: '小暑', subtext: '温风忽至，盛夏开篇' },
  '07-22': { name: '大暑', subtext: '萤火照空，繁暑之巅' },
  '08-07': { name: '立秋', subtext: '晨起凉风至，一叶已知秋' },
  '08-22': { name: '处暑', subtext: '秋意渐浓，暑气将尽' },
  '09-07': { name: '白露', subtext: '蒹葭苍苍，白露为霜' },
  '09-22': { name: '秋分', subtext: '金气秋分，万物清明' },
  '10-08': { name: '寒露', subtext: '露气寒冷，将凝结也' },
  '10-23': { name: '霜降', subtext: '秋收冬藏，霜降初始' },
  '11-07': { name: '立冬', subtext: '水始冰，地始冻，冬之伊始' },
  '11-22': { name: '小雪', subtext: '小雪飘飘，万物冬眠' },
  '12-07': { name: '大雪', subtext: '满目皆银装，静谧如雪' },
  '12-21': { name: '冬至', subtext: '天时人事日相催，冬至阳生春又来' },
}

/**
 * Standard Hour Ranges for Chinese Greetings
 */
const TIME_MESSAGES = [
  { start: 0, end: 5, label: 'Good night', sub: '安静的夜晚，更适合捕捉灵感' },
  { start: 5, end: 11.5, label: 'Good morning', sub: '新的一天，设计更有活力' },
  { start: 11.5, end: 13.5, label: 'Good afternoon', sub: '稍事休息，静候佳作' },
  { start: 13.5, end: 18, label: 'Good afternoon', sub: '啜一口茶，细品设计之美' },
  { start: 18, end: 24, label: 'Good evening', sub: '华灯初上，记录流光时刻' },
]

export interface GreetingData {
  prefix: string
  name: string
  subtext: string
  illustration: React.ReactNode
}

/**
 * Custom SVG Illustrations (Google Doodle Style)
 * Minimalist, high-quality vector paths.
 */
const Illustrations = {
  Night: () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="rgba(88, 86, 214, 0.05)" />
      <path d="M26 22.79A9 9 0 1116.21 13 7 7 0 0026 22.79z" fill="#5856D6" opacity="0.8" />
      <circle cx="12" cy="14" r="1" fill="#5856D6" />
      <circle cx="18" cy="8" r="0.5" fill="#5856D6" opacity="0.5" />
      <circle cx="28" cy="15" r="0.7" fill="#5856D6" />
    </svg>
  ),
  Morning: () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="rgba(255, 149, 0, 0.05)" />
      <circle cx="20" cy="20" r="6" fill="#FF9500" />
      <g opacity="0.6">
        <path d="M20 8V5M20 35V32M8 20H5M35 20H32M11.5 11.5L9.5 9.5M30.5 30.5L28.5 28.5M11.5 28.5L9.5 30.5M30.5 11.5L28.5 9.5" stroke="#FF9500" strokeWidth="2" strokeLinecap="round"/>
      </g>
    </svg>
  ),
  Noon: () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="rgba(52, 199, 89, 0.05)" />
      <path d="M20 12V20L25 23" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="20" cy="20" r="11" stroke="#34C759" strokeWidth="1.5" strokeDasharray="3 3" />
    </svg>
  ),
  Afternoon: () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="rgba(0, 122, 255, 0.05)" />
      <path d="M26 15H28C29.1046 15 30 15.8954 30 17V19C30 20.1046 29.1046 21 28 21H26M10 15H26V26C26 28.2091 24.2091 30 22 30H14C11.7909 30 10 28.2091 10 26V15Z" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 8V11M20 8V11" stroke="#007AFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  SolarGeneric: () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="rgba(0, 0, 0, 0.03)" />
      <path d="M20 10V30M10 20H30" stroke="#1D1D1F" strokeWidth="1" opacity="0.1" />
      <path d="M13 13L27 27M27 13L13 27" stroke="#1D1D1F" strokeWidth="1" opacity="0.1" />
      <circle cx="20" cy="20" r="8" stroke="#1D1D1F" strokeWidth="1.5" fill="white" />
      <path d="M20 15V20L23 21.5" stroke="#1D1D1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Spring: () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="rgba(52, 199, 89, 0.08)" />
      <path d="M20 32V18M20 18C20 18 24 12 28 12C32 12 30 18 20 18ZM20 18C20 18 16 12 12 12C8 12 10 18 20 18Z" fill="#34C759" fillOpacity="0.6" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 26C16 26 18 24 20 24C22 24 24 26 24 26" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

/**
 * Main Greeting Logic
 */
export function getGreeting(userEmail?: string | null): GreetingData {
  // 1. Get Beijing Time (CST/UTC+8)
  const now = new Date()
  const beijingTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))
  const hour = beijingTime.getHours() + beijingTime.getMinutes() / 60
  const monthDay = `${String(beijingTime.getMonth() + 1).padStart(2, '0')}-${String(beijingTime.getDate()).padStart(2, '0')}`

  // 2. Guest Mode (Not logged in)
  if (!userEmail) {
    return {
      prefix: 'Welcome to',
      name: 'StyleLens...',
      subtext: '每一张截图，都是通往设计灵魂的钥匙',
      illustration: <Illustrations.SolarGeneric />
    }
  }

  // 3. User Name Parsing
  const userName = userEmail.split('@')[0] || 'User'

  // 4. Check for Solar Term (Highest priority)
  const solarTerm = SOLAR_TERMS[monthDay]
  if (solarTerm) {
    return {
      prefix: `今日${solarTerm.name}`,
      name: userName,
      subtext: solarTerm.subtext,
      illustration: <Illustrations.Spring />
    }
  }

  // 5. Time-based Greeting
  const match = TIME_MESSAGES.find(m => hour >= m.start && hour < m.end) || TIME_MESSAGES[4]
  
  let Icon = Illustrations.Afternoon
  if (match.label === '夜深了') Icon = Illustrations.Night
  if (match.label === '早上好') Icon = Illustrations.Morning
  if (match.label === '中午好') Icon = Illustrations.Noon
  if (match.label === '晚上好') Icon = Illustrations.Night // Reuse night for evening

  return {
    prefix: match.label,
    name: userName,
    subtext: match.sub,
    illustration: <Icon />
  }
}
