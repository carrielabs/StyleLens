import React, { useState } from 'react';

// ==========================================
// 1. 类型定义 (TypeScript)
// ==========================================
type CSSState = React.CSSProperties;

interface ComponentStateStyles {
    base: CSSState;
    hover: CSSState;
    active: CSSState;
}

interface MockDataType {
    vibe: { description: string; tags: string[]; fingerprints: string[]; colorMode: string; density: string; };
    components: { [compType: string]: { [variantName: string]: ComponentStateStyles }; };
    colors: { hex: string; role: string; count: number; name: string }[];
    typographyDetailed: { family: string; name: string; size: string; weight: number; tracking: string; leading: string; count: number; previewText: string }[];
    radiusTokens: { value: string; count: number }[];
    shadowTokens: { value: string; count: number }[];
    spacing: { value: string; count: number }[];
    layoutTraits: string[];
    pageStructure: { name: string; type: string; wireframeId: string; domSelector: string }[];
    iconography: { style: string; stroke: number; isSharp: boolean; description: string };
    textures: { name: string; css: string; description: string }[];
    codeSnippets: { [lang: string]: string };
}

// ==========================================
// 2. 终极满血版 Mock Data (全维度数据)
// ==========================================
const MOCK_DATA: MockDataType = {
    vibe: {
        description: "该设计展现了简洁、现代且专业的视觉美学，以深邃的深蓝色与纯净的白色表面形成高对比度调色板。鲜明的点缀色突出关键元素，传递出一种面向生产力工具的专业属性。",
        tags: ["极简主义", "现代感", "高对比度", "网格布局", "结构化"],
        fingerprints: ["minimal", "professional", "bold", "energetic", "modern"],
        colorMode: "深色模式 (Dark)",
        density: "适中 (Medium)"
    },
    components: {
        button: {
            Primary: {
                base: { backgroundColor: '#5E6AD2', color: '#FFFFFF', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', fontWeight: 500, border: '1px solid transparent', fontFamily: '"Inter", sans-serif', transition: 'all 0.2s ease', cursor: 'pointer' },
                hover: { backgroundColor: '#4B55C4', boxShadow: '0 4px 12px rgba(94, 106, 210, 0.3)' },
                active: { transform: 'scale(0.96)' }
            },
            Secondary: {
                base: { backgroundColor: 'transparent', color: '#111', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', fontWeight: 500, border: '1px solid #EAEAEA', fontFamily: '"Inter", sans-serif', transition: 'all 0.2s ease', cursor: 'pointer' },
                hover: { backgroundColor: '#FAFAFA', border: '1px solid #CCC' },
                active: { transform: 'scale(0.96)', backgroundColor: '#F0F0F0' }
            },
            Ghost: {
                base: { backgroundColor: 'transparent', color: '#666', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', fontWeight: 500, border: '1px solid transparent', fontFamily: '"Inter", sans-serif', transition: 'all 0.2s ease', cursor: 'pointer' },
                hover: { backgroundColor: '#F5F5F5', color: '#111' },
                active: { transform: 'scale(0.96)' }
            }
        },
        input: {
            Standard: {
                base: { backgroundColor: '#FFFFFF', color: '#111', borderRadius: '6px', padding: '10px 16px', fontSize: '14px', border: '1px solid #EAEAEA', fontFamily: '"Inter", sans-serif', transition: 'all 0.2s ease', outline: 'none', width: '220px' },
                hover: { border: '1px solid #CCC' },
                active: { border: '1px solid #5E6AD2', boxShadow: '0 0 0 2px rgba(94, 106, 210, 0.1)' }
            },
            Underlined: {
                base: { backgroundColor: 'transparent', color: '#111', borderRadius: '0px', padding: '10px 0px', fontSize: '14px', border: '1px solid transparent', borderBottom: '1px solid #CCC', fontFamily: '"Inter", sans-serif', transition: 'all 0.2s ease', outline: 'none', width: '220px' },
                hover: { borderBottom: '1px solid #888' },
                active: { borderBottom: '1px solid #5E6AD2' }
            },
            Filled: {
                base: { backgroundColor: '#F3F3F4', color: '#111', borderRadius: '6px', padding: '10px 16px', fontSize: '14px', border: '1px solid transparent', fontFamily: '"Inter", sans-serif', transition: 'all 0.2s ease', outline: 'none', width: '220px' },
                hover: { backgroundColor: '#EAEAEA' },
                active: { backgroundColor: '#FFF', border: '1px solid #5E6AD2' }
            }
        },
        card: {
            Elevated: {
                base: { backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #EAEAEA', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', color: '#111', width: '240px', transition: 'all 0.3s ease', cursor: 'default' },
                hover: { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(0,0,0,0.08)' },
                active: {}
            },
            Outlined: {
                base: { backgroundColor: '#FAFAFA', borderRadius: '12px', padding: '24px', border: '1px solid #EAEAEA', color: '#111', width: '240px', transition: 'all 0.3s ease', cursor: 'default' },
                hover: { border: '1px solid #CCC', backgroundColor: '#FFFFFF' },
                active: {}
            },
            Flat: {
                base: { backgroundColor: '#F3F3F4', borderRadius: '12px', padding: '24px', border: 'none', color: '#111', width: '240px', transition: 'all 0.3s ease', cursor: 'default' },
                hover: { backgroundColor: '#EAEAEA' },
                active: {}
            }
        },
        tag: {
            Solid: {
                base: { backgroundColor: '#111', color: '#FFF', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', fontWeight: 600, border: '1px solid transparent', transition: 'all 0.15s ease', cursor: 'default' },
                hover: { backgroundColor: '#333' },
                active: {}
            },
            Subtle: {
                base: { backgroundColor: '#F0F4FF', color: '#5E6AD2', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', fontWeight: 600, border: '1px solid transparent', transition: 'all 0.15s ease', cursor: 'default' },
                hover: { backgroundColor: '#E0E8FF' },
                active: {}
            },
            Outline: {
                base: { backgroundColor: 'transparent', color: '#666', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', fontWeight: 500, border: '1px solid #CCC', transition: 'all 0.15s ease', cursor: 'default' },
                hover: { border: '1px solid #888', color: '#111' },
                active: {}
            }
        }
    },
    colors: [
        { name: 'Hero 背景', hex: '#000030', role: 'Background', count: 12 },
        { name: '页面背景', hex: '#FFFFFF', role: 'Background', count: 84 },
        { name: '主文字', hex: '#111111', role: 'Text', count: 142 },
        { name: '主动作色', hex: '#5E6AD2', role: 'Brand', count: 35 },
        { name: '次动作色', hex: '#E6F3FE', role: 'Accent', count: 18 },
    ],
    typographyDetailed: [
        { name: 'Display / Hero', family: '"Inter", sans-serif', previewText: 'Meet your new teammates.', size: '64px', weight: 700, tracking: '-2.125px', leading: '64px', count: 1 },
        { name: 'Heading 1', family: '"Inter", sans-serif', previewText: 'Automate repetitive work.', size: '54px', weight: 700, tracking: '-1.875px', leading: '56px', count: 1 },
        { name: 'Heading 3', family: '"Inter", sans-serif', previewText: 'Q&A agents instantly.', size: '22px', weight: 600, tracking: '-0.25px', leading: '28px', count: 9 },
        { name: 'Body / Paragraph', family: '"Inter", sans-serif', previewText: 'Answers questions instantly using knowledge you already have.', size: '16px', weight: 400, tracking: 'normal', leading: '24px', count: 45 },
    ],
    radiusTokens: [
        { value: '4px', count: 43 }, { value: '6px', count: 27 }, { value: '8px', count: 23 }, { value: '50%', count: 13 },
    ],
    shadowTokens: [
        { value: '0 4px 32px 0 rgba(8,9,10,0.06)', count: 3 }, { value: '0 4px 12px rgba(0,0,0,0.1), 0 0 0 2px rgba(0,0,0,0.02)', count: 2 },
        { value: 'inset 0 0 12px 0 rgba(0,0,0,0.04)', count: 2 }
    ],
    spacing: [
        { value: '4px', count: 43 }, { value: '8px', count: 152 }, { value: '16px', count: 57 }, { value: '32px', count: 47 }
    ],
    layoutTraits: ['CSS Grid (61×)', 'Flexbox (215×)', 'Sticky Nav (3×)', 'Multi-column (72×)'],
    pageStructure: [
        { name: 'Hero (Center Aligned)', type: 'flex-column', wireframeId: 'hero-center', domSelector: 'header' },
        { name: 'Feature Split (Left/Right)', type: '2-col-grid', wireframeId: 'split-lr', domSelector: 'section.features' },
        { name: 'Bento Box Features', type: 'complex-grid', wireframeId: 'bento', domSelector: 'section.bento' }
    ],
    iconography: {
        style: '线框 (Outlined)', stroke: 1.5, isSharp: true,
        description: '极细的 1.5px 线框体系，拐角锐利无圆滑处理，传递出精准、硬朗的专业产品属性。'
    },
    textures: [
        { name: '微边框 (Micro Borders)', css: '1px solid rgba(0,0,0,0.06)', description: '极低对比度的半透明边框，用于在白色背景中划分层级而不产生视觉干扰。' },
        { name: '浅景深模糊 (Subtle Glass)', css: 'backdrop-filter: blur(12px)', description: '克制的毛玻璃效果，通常伴随顶部导航栏或悬浮面板使用。' }
    ],
    codeSnippets: {
        Prompt: `你正在实现一个 UI 界面。以下是一份绑定性设计契约，不得偏离任何指定的值。\n\n设计契约 ---\n来源: target.com\n颜色模式: 深色/高对比\n\n## 1. 色彩契约\n- 主背景: #000030\n- 主动作色: #5E6AD2\n\n## 2. 空间与形态\n- 边框圆角: 主力 6px\n- 间距系统: 8px 网格基准\n`,
        Tailwind: `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        brand: '#5E6AD2',\n        heroBg: '#000030',\n      },\n      borderRadius: {\n        DEFAULT: '6px',\n      }\n    }\n  }\n}`
    }
};

// ==========================================
// 3. 顶级通用组件 & 交互体系
// ==========================================
const CopyToast = ({ show }: { show: boolean }) => (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#111', color: '#fff', fontSize: '12px', padding: '6px 12px', borderRadius: '100px', opacity: show ? 1 : 0, pointerEvents: 'none', transition: 'all 0.2s ease', zIndex: 10 }}>已复制</div>
);

const useCopy = (): [boolean, (text: string) => void] => {
    const [copied, setCopied] = useState(false);
    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return [copied, copy];
};

const SectionHeader = ({ title, tag }: { title: string, tag?: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em' }}>{title}</div>
        {tag && <div style={{ padding: '2px 8px', backgroundColor: '#F3F3F4', borderRadius: '6px', fontSize: '11px', color: '#555', fontWeight: 600 }}>{tag}</div>}
    </div>
);


// ==========================================
// 4. 全新：四种顶级字体排版视图 (Typography Views)
// ==========================================

// 工具：清洗字体名称 (例如将 '"Inter", sans-serif' 提取为 'Inter')
const getCleanFamily = (rawFamily: string) => rawFamily.split(',')[0].replace(/['"]/g, '').trim();

// 视图 1：极简瀑布流 (Waterfall)
function TypeViewWaterfall({ token }: { token: typeof MOCK_DATA.typographyDetailed[0] }) {
    const cleanFamily = getCleanFamily(token.family);
    return (
        <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{token.name}</div>
            <div style={{ fontFamily: token.family, fontSize: token.size, fontWeight: token.weight, letterSpacing: token.tracking, lineHeight: token.leading, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {token.previewText}
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#666', marginTop: '8px', flexWrap: 'wrap' }}>
                <span><span style={{ color: '#A1A1AA', marginRight: '6px' }}>Family</span><span style={{ fontWeight: 600, color: '#111' }}>{cleanFamily}</span></span>
                <span><span style={{ color: '#A1A1AA', marginRight: '6px' }}>Size</span><span style={{ fontWeight: 600, color: '#111' }}>{token.size}</span></span>
                <span><span style={{ color: '#A1A1AA', marginRight: '6px' }}>Weight</span><span style={{ fontWeight: 600, color: '#111' }}>{token.weight}</span></span>
                <span><span style={{ color: '#A1A1AA', marginRight: '6px' }}>Tracking</span><span style={{ fontWeight: 600, color: '#D97706' }}>{token.tracking}</span></span>
                <span><span style={{ color: '#A1A1AA', marginRight: '6px' }}>Leading</span><span style={{ fontWeight: 600, color: '#111' }}>{token.leading}</span></span>
                <span style={{ marginLeft: 'auto' }}><span style={{ color: '#A1A1AA', marginRight: '6px' }}>Usage</span><span style={{ fontWeight: 600, color: '#5E6AD2' }}>{token.count}×</span></span>
            </div>
        </div>
    );
}

// 视图 2：海报画廊 (Poster)
function TypeViewPoster({ token }: { token: typeof MOCK_DATA.typographyDetailed[0] }) {
    const cleanFamily = getCleanFamily(token.family);
    return (
        <div style={{
            position: 'relative', border: '1px solid #EAEAEA', borderRadius: '16px', padding: '32px 24px',
            backgroundColor: '#FAFAFA', overflow: 'hidden', flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px'
        }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '160px', fontWeight: 700, color: '#111', opacity: 0.03, lineHeight: 1, fontFamily: token.family, pointerEvents: 'none' }}>Aa</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: '#111', color: '#FFF', borderRadius: '100px', fontSize: '11px', fontWeight: 600, marginBottom: '24px' }}>
                    {token.name}
                </div>
                <div style={{ fontFamily: token.family, fontSize: token.size, fontWeight: token.weight, letterSpacing: token.tracking, lineHeight: token.leading, color: '#111', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {token.previewText}
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: 'auto', position: 'relative', zIndex: 1 }}>
                <div style={{ backgroundColor: '#FFF', border: '1px solid #EAEAEA', padding: '8px 12px', borderRadius: '8px' }}><div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>Family</div><div style={{ fontSize: '12px', fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cleanFamily}</div></div>
                <div style={{ backgroundColor: '#FFF', border: '1px solid #EAEAEA', padding: '8px 12px', borderRadius: '8px' }}><div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>Size</div><div style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{token.size}</div></div>
                <div style={{ backgroundColor: '#FFF', border: '1px solid #EAEAEA', padding: '8px 12px', borderRadius: '8px' }}><div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>Usage</div><div style={{ fontSize: '12px', fontWeight: 600, color: '#5E6AD2' }}>{token.count}×</div></div>
                <div style={{ backgroundColor: '#FFF', border: '1px solid #EAEAEA', padding: '8px 12px', borderRadius: '8px' }}><div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>Weight</div><div style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{token.weight}</div></div>
                <div style={{ backgroundColor: '#FFF', border: '1px solid #EAEAEA', padding: '8px 12px', borderRadius: '8px' }}><div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>Tracking</div><div style={{ fontSize: '12px', fontWeight: 600, color: '#D97706' }}>{token.tracking}</div></div>
                <div style={{ backgroundColor: '#FFF', border: '1px solid #EAEAEA', padding: '8px 12px', borderRadius: '8px' }}><div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>Leading</div><div style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{token.leading}</div></div>
            </div>
        </div>
    );
}

// 视图 3：蓝图透视 (Inspector/Blueprint)
function TypeViewBlueprint({ token }: { token: typeof MOCK_DATA.typographyDetailed[0] }) {
    const cleanFamily = getCleanFamily(token.family);
    return (
        <div style={{
            position: 'relative', padding: '48px 32px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px',
            backgroundImage: 'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)',
            backgroundSize: '24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0'
        }}>
            <div style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '11px', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{token.name}</div>
            <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '10px', color: '#5E6AD2', fontWeight: 600, backgroundColor: '#F0F4FF', padding: '2px 6px', borderRadius: '4px' }}>{token.count}× USAGE</div>

            <div style={{ position: 'relative', borderTop: '1px dashed #4F46E5', borderBottom: '1px dashed #4F46E5', display: 'inline-block' }}>
                <div style={{ position: 'absolute', left: '-32px', top: '0', bottom: '0', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', width: '1px', backgroundColor: '#4F46E5', top: '0', bottom: '0' }} />
                    <div style={{ position: 'absolute', width: '6px', height: '1px', backgroundColor: '#4F46E5', top: '0', right: '11px' }} />
                    <div style={{ position: 'absolute', width: '6px', height: '1px', backgroundColor: '#4F46E5', bottom: '0', right: '11px' }} />
                    <div style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '10px', fontWeight: 600, padding: '2px 4px', borderRadius: '4px', transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>
                        {token.leading}
                    </div>
                </div>

                <div style={{ position: 'absolute', bottom: '-30px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FFF', border: '1px solid #E2E8F0', padding: '4px 6px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <span style={{ fontSize: '10px', color: '#64748B' }}>Fam</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A' }}>{cleanFamily}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FFF', border: '1px solid #E2E8F0', padding: '4px 6px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <span style={{ fontSize: '10px', color: '#64748B' }}>Track</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#D97706' }}>{token.tracking}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FFF', border: '1px solid #E2E8F0', padding: '4px 6px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <span style={{ fontSize: '10px', color: '#64748B' }}>Size</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A' }}>{token.size}</span>
                    </div>
                </div>

                <div style={{ fontFamily: token.family, fontSize: token.size, fontWeight: token.weight, letterSpacing: token.tracking, lineHeight: token.leading, color: '#0F172A', whiteSpace: 'nowrap', padding: '0 12px' }}>
                    {token.previewText}
                </div>
            </div>
        </div>
    );
}

// 视图 4：编辑流 (Editorial/Article)
function TypeViewEditorial({ tokens }: { tokens: typeof MOCK_DATA.typographyDetailed }) {
    return (
        <div style={{ display: 'flex', gap: '48px', padding: '32px', backgroundColor: '#FFF', border: '1px solid #EAEAEA', borderRadius: '12px' }}>
            <div style={{ flex: 1, maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {tokens.map((token, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
                        <div style={{ flex: '0 0 120px', paddingTop: '6px', textAlign: 'right', borderRight: '1px solid #EAEAEA', paddingRight: '16px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: '#111', textTransform: 'uppercase', marginBottom: '4px' }}>{token.name}</div>
                            <div style={{ fontSize: '11px', color: '#111', fontWeight: 500, marginBottom: '2px' }}>{getCleanFamily(token.family)}</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>{token.size} / {token.leading}</div>
                            <div style={{ fontSize: '10px', color: '#D97706', marginTop: '2px' }}>{token.tracking}</div>
                            <div style={{ fontSize: '10px', color: '#5E6AD2', fontWeight: 600, marginTop: '8px', backgroundColor: '#F0F4FF', padding: '2px 4px', borderRadius: '4px', display: 'inline-block' }}>{token.count}×</div>
                        </div>
                        <div style={{ flex: 1, fontFamily: token.family, fontSize: token.size, fontWeight: token.weight, letterSpacing: token.tracking, lineHeight: token.leading, color: '#111' }}>
                            {token.previewText}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


// ==========================================
// 5. 其他特定渲染器：色彩、画廊、骨架屏、图标
// ==========================================

function MinimalColorSwatch({ token }: { token: typeof MOCK_DATA.colors[0] }) {
    const [copied, copy] = useCopy();
    return (
        <div
            onClick={() => copy(token.hex)}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '88px', cursor: 'pointer', transition: 'transform 0.2s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
            <div style={{ width: '100%', height: '88px', backgroundColor: token.hex, borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CopyToast show={copied} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '4px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{token.name}</div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#888' }}>{token.hex}</div>
            </div>
        </div>
    );
}

function IconographyVisualizer({ token }: { token: typeof MOCK_DATA.iconography }) {
    const linecap = token.isSharp ? 'square' : 'round';
    const linejoin = token.isSharp ? 'miter' : 'round';
    const SvgIcon = ({ children }: { children: React.ReactNode }) => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth={token.stroke} strokeLinecap={linecap} strokeLinejoin={linejoin}>
            {children}
        </svg>
    );

    return (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '8px', border: '1px solid #EAEAEA', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
                <SvgIcon><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></SvgIcon>
            </div>
            <div style={{ width: '56px', height: '56px', borderRadius: '8px', border: '1px solid #EAEAEA', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
                <SvgIcon><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></SvgIcon>
            </div>
            <div style={{ width: '56px', height: '56px', borderRadius: '8px', border: '1px solid #EAEAEA', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
                <SvgIcon><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></SvgIcon>
            </div>
        </div>
    );
}

function RadiusGalleryItem({ token }: { token: { value: string, count: number } }) {
    const [copied, copy] = useCopy();
    return (
        <div onClick={() => copy(`border-radius: ${token.value};`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', position: 'relative' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#F7F7F8', border: '1px solid #E5E5E5', borderRadius: token.value, display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#111'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E5E5'}>
                <CopyToast show={copied} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#111', fontWeight: 500 }}>{token.value}</span>
            </div>
        </div>
    );
}

function ShadowGalleryItem({ token }: { token: { value: string, count: number } }) {
    const [copied, copy] = useCopy();
    return (
        <div onClick={() => copy(`box-shadow: ${token.value};`)} style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '16px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s ease', position: 'relative' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9F9FA'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <CopyToast show={copied} />
            <div style={{ width: '80px', height: '80px', borderRadius: '8px', flexShrink: 0, background: 'radial-gradient(#E5E5E5 1px, transparent 1px)', backgroundSize: '8px 8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #F0F0F0', boxShadow: token.value }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{token.value}</span>
            </div>
        </div>
    );
}

function WireframePreview({ type, isHovered }: { type: string, isHovered: boolean }) {
    const containerStyle: React.CSSProperties = {
        width: '100%', height: '120px', backgroundColor: isHovered ? '#F0F4FF' : '#F9F9FA', borderRadius: '8px',
        border: isHovered ? '1px solid #5E6AD2' : '1px solid #EAEAEA', display: 'flex', boxSizing: 'border-box',
        overflow: 'hidden', transition: 'all 0.2s ease', boxShadow: isHovered ? '0 4px 12px rgba(94, 106, 210, 0.1)' : 'none'
    };
    const accentColor = isHovered ? '#5E6AD2' : '#D1D1D1';
    const secondaryColor = isHovered ? 'rgba(94, 106, 210, 0.2)' : '#E5E5E5';
    const blockColor = isHovered ? 'rgba(94, 106, 210, 0.1)' : '#EAEAEA';

    switch (type) {
        case 'hero-center': return (
            <div style={{ ...containerStyle, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px' }}>
                <div style={{ width: '60%', height: '16px', backgroundColor: accentColor, borderRadius: '4px', transition: 'all 0.2s' }} />
                <div style={{ width: '40%', height: '10px', backgroundColor: secondaryColor, borderRadius: '4px', transition: 'all 0.2s' }} />
                <div style={{ width: '80px', height: '24px', backgroundColor: isHovered ? '#5E6AD2' : '#A1A1AA', borderRadius: '4px', marginTop: '4px', transition: 'all 0.2s' }} />
            </div>
        );
        case 'split-lr': return (
            <div style={{ ...containerStyle, padding: '16px', gap: '16px', alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ width: '80%', height: '14px', backgroundColor: accentColor, borderRadius: '4px' }} />
                    <div style={{ width: '100%', height: '8px', backgroundColor: secondaryColor, borderRadius: '4px' }} />
                    <div style={{ width: '90%', height: '8px', backgroundColor: secondaryColor, borderRadius: '4px' }} />
                </div>
                <div style={{ flex: 1, height: '100%', backgroundColor: blockColor, borderRadius: '6px' }} />
            </div>
        );
        case 'bento': return (
            <div style={{ ...containerStyle, padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '8px' }}>
                <div style={{ gridRow: 'span 2', backgroundColor: blockColor, borderRadius: '6px' }} />
                <div style={{ backgroundColor: blockColor, borderRadius: '6px' }} />
                <div style={{ backgroundColor: blockColor, borderRadius: '6px' }} />
            </div>
        );
        default: return <div style={containerStyle} />;
    }
}

// ==========================================
// 6. 主面板：DesignInspector
// ==========================================
export default function DesignInspector({ onSectionSelect }: { onSectionSelect?: (selector: string | null) => void }) {
    const [activeTab, setActiveTab] = useState<'foundations' | 'playground' | 'layout' | 'export'>('foundations');
    const [activeComp, setActiveComp] = useState<string>('button');
    const [activeCodeTab, setActiveCodeTab] = useState<string>('Prompt');
    const [hoveredWireframe, setHoveredWireframe] = useState<string | null>(null);

    const [typeView, setTypeView] = useState<'waterfall' | 'poster' | 'inspector' | 'editorial'>('waterfall');

    const ComponentRenderer = ({ type, variant, compData }: any) => {
        const [state, setState] = useState<'base' | 'hover' | 'active'>('base');
        const style = { ...compData.base, ...(state === 'hover' ? compData.hover : {}), ...(state === 'active' ? compData.active : {}) };
        const binds = { onMouseEnter: () => setState('hover'), onMouseLeave: () => setState('base'), onMouseDown: () => setState('active'), onMouseUp: () => setState('hover'), onFocus: () => setState('active'), onBlur: () => setState('base') };

        if (type === 'button') return <button style={style} {...binds}>{variant} Action</button>;
        if (type === 'input') return <input style={style} placeholder={`Enter text...`} {...binds} />;
        if (type === 'tag') return <span style={style} {...binds}>{variant} Tag</span>;
        if (type === 'card') return (
            <div style={style} {...binds}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>{variant} Card</div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Style Preview</div>
                <div style={{ fontSize: '13px', color: '#AAA', lineHeight: 1.5 }}>Interact to feel boundaries.</div>
            </div>
        );
        return null;
    };

    return (
        <div style={{ width: '100%', minHeight: '800px', backgroundColor: '#FFFFFF', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '24px 32px 0 32px', borderBottom: '1px solid #EAEAEA' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#F3F3F4', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
                    {[{ id: 'foundations', label: '视觉体系' }, { id: 'playground', label: '交互游乐场' }, { id: 'layout', label: '空间布局' }, { id: 'export', label: '代码输出' }].map((tab) => (
                        <div key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                            style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '6px', color: activeTab === tab.id ? '#111' : '#666', backgroundColor: activeTab === tab.id ? '#FFF' : 'transparent', boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.04)' : 'none', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                            {tab.label}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

                {/* === Tab 1: 视觉体系 (Foundations) === */}
                {activeTab === 'foundations' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>

                        {/* 品牌指纹与 Vibe */}
                        <div>
                            <SectionHeader title="设计神韵 & 品牌指纹" tag="AI 提炼" />
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ padding: '12px 16px', backgroundColor: '#F9F9FA', borderRadius: '8px', flex: 1 }}>
                                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>色彩模式</div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{MOCK_DATA.vibe.colorMode}</div>
                                </div>
                                <div style={{ padding: '12px 16px', backgroundColor: '#F9F9FA', borderRadius: '8px', flex: 1 }}>
                                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>AI 内容密度印象</div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{MOCK_DATA.vibe.density}</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '14px', color: '#444', lineHeight: 1.7, marginBottom: '24px' }}>
                                {MOCK_DATA.vibe.description}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {MOCK_DATA.vibe.fingerprints.map((tag, i) => (
                                    <span key={tag} style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, color: i % 2 === 0 ? '#4F46E5' : '#D97706', backgroundColor: i % 2 === 0 ? '#EEF2FF' : '#FEF3C7' }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 色彩体系 */}
                        <div>
                            <SectionHeader title="色彩体系" tag="DOM 测量" />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
                                {MOCK_DATA.colors.map(t => <MinimalColorSwatch key={t.hex} token={t} />)}
                            </div>
                        </div>

                        {/* 字体排版 (支持 4 种顶级视图切换) */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#111', letterSpacing: '-0.02em' }}>字体标本排版 (Type Specimens)</div>
                                    <div style={{ padding: '2px 8px', backgroundColor: '#F3F3F4', borderRadius: '6px', fontSize: '11px', color: '#555', fontWeight: 600 }}>微排版测量</div>
                                </div>

                                <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F3F3F4', padding: '4px', borderRadius: '6px' }}>
                                    {[
                                        { id: 'waterfall', label: '瀑布流' },
                                        { id: 'poster', label: '海报画廊' },
                                        { id: 'inspector', label: '蓝图透视' },
                                        { id: 'editorial', label: '阅读流' }
                                    ].map((view) => (
                                        <div key={view.id} onClick={() => setTypeView(view.id as any)}
                                            style={{
                                                padding: '4px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '4px', cursor: 'pointer',
                                                color: typeView === view.id ? '#111' : '#666',
                                                backgroundColor: typeView === view.id ? '#FFF' : 'transparent',
                                                boxShadow: typeView === view.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                                transition: 'all 0.2s ease'
                                            }}>
                                            {view.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginTop: '16px' }}>
                                {typeView === 'waterfall' && (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {MOCK_DATA.typographyDetailed.map((t, i) => (
                                            <div key={i} style={{ borderBottom: i !== MOCK_DATA.typographyDetailed.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                                                <TypeViewWaterfall token={t} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {typeView === 'poster' && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                                        {MOCK_DATA.typographyDetailed.map((t, i) => <TypeViewPoster key={i} token={t} />)}
                                    </div>
                                )}
                                {typeView === 'inspector' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {MOCK_DATA.typographyDetailed.map((t, i) => <TypeViewBlueprint key={i} token={t} />)}
                                    </div>
                                )}
                                {typeView === 'editorial' && (
                                    <TypeViewEditorial tokens={MOCK_DATA.typographyDetailed} />
                                )}
                            </div>
                        </div>

                        {/* 边框圆角与阴影层级 */}
                        <div>
                            <SectionHeader title="边框圆角" tag="DOM 测量" />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
                                {MOCK_DATA.radiusTokens.map((t, i) => <RadiusGalleryItem key={i} token={t} />)}
                            </div>
                        </div>
                        <div>
                            <SectionHeader title="阴影层级 & 深度" />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {MOCK_DATA.shadowTokens.map((t, i) => <ShadowGalleryItem key={i} token={t} />)}
                            </div>
                        </div>

                        {/* 图标体系与视觉肌理 */}
                        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '320px' }}>
                                <SectionHeader title="图标系统 (Iconography)" tag="视觉解析" />
                                <div style={{ padding: '24px', backgroundColor: '#FAFAFA', border: '1px solid #EAEAEA', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
                                    <IconographyVisualizer token={MOCK_DATA.iconography} />
                                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111', marginBottom: '8px' }}>{MOCK_DATA.iconography.style}</div>
                                    <div style={{ fontSize: '13px', color: '#555', marginBottom: '12px', display: 'flex', gap: '16px' }}>
                                        <span>线条粗细: <b style={{ color: '#111' }}>{MOCK_DATA.iconography.stroke}px</b></span>
                                        <span>边角: <b style={{ color: '#111' }}>{MOCK_DATA.iconography.isSharp ? 'Sharp (锐利)' : 'Rounded (圆滑)'}</b></span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{MOCK_DATA.iconography.description}</div>
                                </div>
                            </div>

                            <div style={{ flex: 1, minWidth: '320px' }}>
                                <SectionHeader title="视觉肌理 (Textures)" tag="DOM 测量" />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {MOCK_DATA.textures.map((tex, i) => (
                                        <div key={i} style={{ padding: '16px', border: '1px solid #EAEAEA', borderRadius: '8px', backgroundColor: '#FAFAFA' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111', marginBottom: '8px' }}>{tex.name}</div>
                                            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#5E6AD2', padding: '6px 10px', backgroundColor: '#F0F4FF', borderRadius: '4px', display: 'inline-block', marginBottom: '12px' }}>{tex.css}</div>
                                            <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.5 }}>{tex.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* === Tab 2: 交互游乐场 (Playground) === */}
                {activeTab === 'playground' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <SectionHeader title="交互组件库" tag="多态对照" />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {Object.keys(MOCK_DATA.components).map(comp => (
                                <div key={comp} onClick={() => setActiveComp(comp)} style={{ padding: '6px 16px', fontSize: '13px', borderRadius: '20px', cursor: 'pointer', fontWeight: 500, border: activeComp === comp ? '1px solid #111' : '1px solid #EAEAEA', backgroundColor: activeComp === comp ? '#111' : '#FFF', color: activeComp === comp ? '#FFF' : '#666', textTransform: 'capitalize', transition: 'all 0.2s ease' }}>
                                    {comp}
                                </div>
                            ))}
                        </div>
                        <div style={{ width: '100%', minHeight: '320px', padding: '48px 24px', borderRadius: '12px', backgroundColor: '#18191B', border: '1px solid #EAEAEA', backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '48px' }}>
                            {Object.entries(MOCK_DATA.components[activeComp]).map(([variantName, compData]) => (
                                <div key={variantName} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                    <ComponentRenderer type={activeComp} variant={variantName} compData={compData} />
                                    <span style={{ fontSize: '12px', color: '#888', fontFamily: 'ui-monospace, monospace' }}>{variantName}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* === Tab 3: 空间布局 (Layout) === */}
                {activeTab === 'layout' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                        <div>
                            <SectionHeader title="布局参考画廊" tag="悬停联动" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                                {MOCK_DATA.pageStructure.map((section, idx) => {
                                    const isHovered = hoveredWireframe === section.wireframeId;
                                    return (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: '12px', transition: 'background 0.2s', backgroundColor: isHovered ? '#FAFAFA' : 'transparent' }}
                                            onMouseEnter={() => { setHoveredWireframe(section.wireframeId); if (onSectionSelect) onSectionSelect(section.domSelector); }}
                                            onMouseLeave={() => { setHoveredWireframe(null); if (onSectionSelect) onSectionSelect(null); }}>
                                            <WireframePreview type={section.wireframeId} isHovered={isHovered} />
                                            <div style={{ paddingLeft: '4px' }}>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: isHovered ? '#5E6AD2' : '#111', transition: 'color 0.2s' }}>{section.name}</div>
                                                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px', fontFamily: 'ui-monospace, monospace' }}>{section.type}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <SectionHeader title="宏观结构特征 (Technical Traits)" tag="DOM 验证" />
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {MOCK_DATA.layoutTraits.map(trait => (
                                    <span key={trait} style={{ padding: '8px 16px', backgroundColor: '#FAFAFA', borderRadius: '8px', fontSize: '13px', color: '#111', border: '1px solid #EAEAEA', fontWeight: 500 }}>
                                        {trait}
                                    </span>
                                ))}
                            </div>
                            <div style={{ fontSize: '12px', color: '#888', marginTop: '12px' }}>这些是构建该网页底层宏观框架时使用的核心 CSS 技术栈。</div>
                        </div>

                        <div>
                            <SectionHeader title="间距系统 (Spacing Scale)" tag="高频测量" />
                            <div style={{ border: '1px solid #EAEAEA', borderRadius: '12px', padding: '16px 24px' }}>
                                {MOCK_DATA.spacing.map(t => (
                                    <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0' }}>
                                        <div style={{ width: '40px', fontFamily: 'ui-monospace, monospace', fontSize: '13px', fontWeight: 500, color: '#111' }}>{t.value}</div>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ height: '16px', width: `${Math.min(parseInt(t.value) * 3, 160)}px`, backgroundColor: '#E0E0E0', borderRadius: '2px' }} />
                                            {t.count > 100 && <span style={{ fontSize: '10px', backgroundColor: '#FEF08A', color: '#854D0E', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>高频核心</span>}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>{t.count}× usage</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* === Tab 4: 代码输出 (Code Export) === */}
                {activeTab === 'export' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <SectionHeader title="代码输出" tag="直接喂给 AI" />
                        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #EAEAEA', marginBottom: '24px' }}>
                            {['Prompt', 'Tailwind', 'CSS', 'Tokens', 'Markdown'].map(lang => (
                                <div key={lang} onClick={() => setActiveCodeTab(lang)} style={{ paddingBottom: '12px', fontSize: '14px', cursor: 'pointer', fontWeight: activeCodeTab === lang ? 600 : 400, color: activeCodeTab === lang ? '#111' : '#888', borderBottom: activeCodeTab === lang ? '2px solid #111' : '2px solid transparent' }}>
                                    {lang}
                                </div>
                            ))}
                        </div>
                        <div style={{ flex: 1, backgroundColor: '#1A1B1E', borderRadius: '12px', padding: '24px', overflowY: 'auto', position: 'relative' }}>
                            <button onClick={() => navigator.clipboard.writeText(MOCK_DATA.codeSnippets[activeCodeTab] || '')} style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}>
                                复制代码
                            </button>
                            <pre style={{ margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: '13px', color: '#E6E6E6', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                {MOCK_DATA.codeSnippets[activeCodeTab] || '// 当前格式暂无数据输出...'}
                            </pre>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}