export type PublisherTemplate = {
  id: string
  name: string
  description: string
  tone: string
}

export const WEBSITE_TEMPLATES: PublisherTemplate[] = [
  { id: 'website-01-fui', name: 'FUI', description: '极简科技感产品介绍', tone: '#1D1D1F' },
  { id: 'website-02-soft-surrealism', name: 'Soft Surrealism', description: '柔和 3D 品牌官网', tone: '#E8B4C8' },
  { id: 'website-03-red-clay', name: 'Red Clay', description: '艺术与内容型产品页', tone: '#B85C38' },
  { id: 'website-04-premium-midnight', name: 'Premium Midnight', description: '高端深色官网', tone: '#111827' },
  { id: 'website-05-voltflow-cyber-saas', name: 'Voltflow Cyber SaaS', description: '科技 SaaS', tone: '#D9EB26' },
  { id: 'website-07-blueprint-agent-platform', name: 'Blueprint Agent', description: '平台型产品', tone: '#2563EB' },
  { id: 'website-08-editorial-apple-tech', name: 'Editorial Apple Tech', description: '编辑感科技页', tone: '#A3A3A3' },
  { id: 'website-09-blue-shift-portfolio', name: 'Blue Shift Portfolio', description: '作品集 / 品牌展示', tone: '#38BDF8' },
]

export const DASHBOARD_TEMPLATES: PublisherTemplate[] = [
  { id: 'dashboard-01-blue-business', name: 'Blue Business', description: '经营分析 / KPI', tone: '#2563EB' },
  { id: 'dashboard-02-premium-dark', name: 'Premium Dark', description: '深色数据大屏', tone: '#18181B' },
  { id: 'dashboard-03-lean-cyber-analytics', name: 'Lean Cyber Analytics', description: '科技监控', tone: '#A3E635' },
  { id: 'dashboard-04-premium-midnight', name: 'Premium Midnight', description: '高级深色报告', tone: '#312E81' },
  { id: 'dashboard-05-premium-cyber-dark', name: 'Premium Cyber Dark', description: '安全 / 系统指标', tone: '#22D3EE' },
  { id: 'dashboard-06-warm-paper-analytics', name: 'Warm Paper Analytics', description: '温和汇报页', tone: '#D97706' },
  { id: 'dashboard-07-dark-bento-analytics', name: 'Dark Bento Analytics', description: '模块化分析', tone: '#DC2626' },
  { id: 'dashboard-08-saas-executive-analytics', name: 'SaaS Executive', description: 'SaaS 高管看板', tone: '#7C3AED' },
  { id: 'dashboard-09-editorial-corporate-analytics', name: 'Editorial Corporate', description: '企业分析报告', tone: '#0F172A' },
  { id: 'dashboard-10-executive-logic-report', name: 'Executive Logic', description: '管理层决策', tone: '#0284C7' },
  { id: 'dashboard-11-saas-growth-health-report', name: 'SaaS Growth Health', description: '增长健康度', tone: '#16A34A' },
  { id: 'dashboard-12-atomic-bento-strategy-report', name: 'Atomic Bento Strategy', description: '战略复盘', tone: '#F97316' },
  { id: 'dashboard-13-corporate-blue-analytics-report', name: 'Corporate Blue', description: '蓝色企业报告', tone: '#1D4ED8' },
  { id: 'dashboard-14-financial-blue-analytics-report', name: 'Financial Blue', description: '财务分析', tone: '#0EA5E9' },
  { id: 'dashboard-15-consulting-data-report', name: 'Consulting Data', description: '咨询数据报告', tone: '#0F2C59' },
]
