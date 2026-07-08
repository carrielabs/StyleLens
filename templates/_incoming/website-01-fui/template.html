<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FUI - 未来界面风格</title>
    
    <!-- Tailwind CSS (CDN, 无构建) -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- 字体: Rajdhani (主视觉/标题) 和 JetBrains Mono (数据/微缩文本) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet">

    <style>
        /* =========================================
           FUI 核心变量与全局样式
           ========================================= */
        :root {
            --bg-base: #030303;
            --border-light: rgba(255, 255, 255, 0.15);
            --border-heavy: rgba(255, 255, 255, 0.8);
            --text-main: #ffffff;
            --text-dim: rgba(255, 255, 255, 0.5);
        }

        body {
            background-color: var(--bg-base);
            color: var(--text-main);
            font-family: 'Rajdhani', sans-serif;
            background-image: 
                linear-gradient(var(--border-light) 1px, transparent 1px),
                linear-gradient(90deg, var(--border-light) 1px, transparent 1px);
            background-size: 50px 50px;
            background-position: center center;
            background-attachment: fixed;
            overflow-x: hidden;
            box-shadow: inset 0 0 300px rgba(0,0,0,0.95);
        }

        .font-mono { font-family: 'JetBrains Mono', monospace; }

        /* =========================================
           FUI 特效组件
           ========================================= */
        .scanlines {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
            background-size: 100% 4px;
            pointer-events: none;
            z-index: 9999;
        }

        .fui-box {
            position: relative;
            border: 1px solid var(--border-light);
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
        }
        .fui-box::before, .fui-box::after {
            content: '';
            position: absolute;
            width: 10px; height: 10px;
            border: 1px solid var(--border-heavy);
            pointer-events: none;
        }
        .fui-box::before { top: -1px; left: -1px; border-bottom: none; border-right: none; }
        .fui-box::after { bottom: -1px; right: -1px; border-top: none; border-left: none; }

        .fui-clip {
            clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
            border: 1px solid var(--border-light);
            position: relative;
        }

        .fui-btn {
            display: inline-block;
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--border-heavy);
            padding: 0.75rem 2rem;
            text-transform: uppercase;
            letter-spacing: 2px;
            transition: all 0.2s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        .fui-btn:hover {
            background: var(--text-main);
            color: var(--bg-base);
        }
        .fui-btn::after {
            content: '';
            position: absolute;
            top: 0; left: -100%; width: 50%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transform: skewX(-20deg);
            transition: 0.5s;
        }
        .fui-btn:hover::after { left: 150%; }

        .blink { animation: blinker 1s steps(2, start) infinite; }
        @keyframes blinker { to { visibility: hidden; } }
        
        .spin-slow { animation: spin 20s linear infinite; }
        .spin-reverse { animation: spin 30s linear infinite reverse; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .dot-bg {
            background-image: radial-gradient(var(--border-light) 1px, transparent 1px);
            background-size: 12px 12px;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--bg-base); }
        ::-webkit-scrollbar-thumb { background: var(--border-heavy); }
    </style>
</head>
<body class="text-sm md:text-base leading-relaxed antialiased">
    <!-- 全局扫描线 -->
    <div class="scanlines"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        <!-- Header -->
        <header data-section="header" class="flex flex-wrap justify-between items-end border-b border-white/20 pb-4 mb-16 relative">
            <div class="absolute -bottom-[1px] left-0 w-32 h-[1px] bg-white"></div>
            
            <div class="flex items-center gap-6">
                <div class="font-bold text-3xl tracking-[0.15em]" data-editable="true">FUI 2.0</div>
                <div class="font-mono text-[10px] text-white/50 hidden sm:block border-l border-white/20 pl-4">
                    <div data-editable="true">SYSTEM.ONLINE</div>
                    <div data-editable="true">VERSION_2.0.4</div>
                </div>
            </div>
            
            <div class="hidden md:flex gap-10 font-mono text-xs tracking-widest text-white/60 uppercase">
                <span class="hover:text-white cursor-pointer transition-colors" data-editable="true">Overview</span>
                <span class="hover:text-white cursor-pointer transition-colors" data-editable="true">Systems</span>
                <span class="hover:text-white cursor-pointer transition-colors" data-editable="true">Analytics</span>
                <span class="hover:text-white cursor-pointer transition-colors" data-editable="true">Config</span>
            </div>

            <div class="text-right font-mono">
                <div class="text-[10px] text-white/40 mb-1" data-editable="true">2085 / 05 / 20</div>
                <div class="text-white text-lg tracking-wider" data-editable="true">14:35:42<span class="blink inline-block w-2 h-4 bg-white align-middle ml-1"></span></div>
            </div>
        </header>

        <!-- Hero -->
        <section data-section="hero" class="relative min-h-[55vh] flex flex-col justify-center items-center text-center mb-20">
            <!-- 坐标与状态数据装饰 -->
            <div class="absolute top-0 left-0 font-mono text-[10px] text-white/40 text-left hidden sm:block">
                <div data-editable="true">[+] COORD_SYNC</div>
                <div data-editable="true">LAT: 22.5726° N</div>
                <div data-editable="true">LON: 88.3639° E</div>
            </div>
            <div class="absolute bottom-0 right-0 font-mono text-[10px] text-white/40 text-right hidden sm:block">
                <div data-editable="true">DATA STREAM <span class="blink text-white">● LIVE</span></div>
                <div data-editable="true">TX_RATE: 2.45 TB/s</div>
            </div>

            <!-- 全息雷达占位 -->
            <div class="absolute inset-0 flex justify-center items-center opacity-30 pointer-events-none">
                <div class="w-[400px] h-[400px] border border-white/20 rounded-full spin-slow relative flex justify-center items-center">
                    <div class="w-[320px] h-[320px] border-[2px] border-dashed border-white/40 rounded-full spin-reverse absolute"></div>
                    <div class="w-[240px] h-[240px] border border-white/10 rounded-full absolute"></div>
                    <div class="w-[120%] h-[1px] bg-white/20 absolute"></div>
                    <div class="w-[1px] h-[120%] bg-white/20 absolute"></div>
                </div>
            </div>

            <!-- 核心标题区 -->
            <div class="relative z-20">
                <div class="font-mono text-[10px] text-white/60 mb-6 tracking-[0.4em] uppercase flex items-center justify-center gap-3">
                    <span class="w-8 h-[1px] bg-white/30"></span>
                    <span data-editable="true"># 探索未来界面设计语言</span>
                    <span class="w-8 h-[1px] bg-white/30"></span>
                </div>
                <h1 class="font-bold text-6xl md:text-8xl lg:text-9xl tracking-tight mb-4 uppercase leading-none drop-shadow-2xl" data-editable="true">
                    Future UI
                </h1>
                <h2 class="text-2xl md:text-3xl tracking-[0.3em] text-white/80 mb-10 font-medium uppercase" data-editable="true">
                    构建高阶系统界面
                </h2>
                
                <!-- 新增：Hero 区域的核心操作按钮 -->
                <div class="mt-8 flex flex-wrap justify-center gap-6 relative z-20">
                    <a href="#" class="fui-btn text-sm font-bold flex items-center gap-2" data-editable="true">
                        <span class="w-2 h-2 bg-white rounded-full blink inline-block"></span>
                        启动终端 (LIVE DEMO)
                    </a>
                    <a href="#" class="border border-white/30 px-6 py-[0.75rem] hover:bg-white/10 transition-colors font-mono text-sm tracking-widest flex items-center gap-3 group">
                        <span class="text-white/50 group-hover:text-white transition-colors">[GIT]</span>
                        <span data-editable="true">SOURCE CODE</span>
                    </a>
                </div>
            </div>
        </section>

        <!-- 01 痛点模块 (恢复自第一次新增) -->
        <section data-section="pain-points" class="fui-box p-8 mb-20 border-red-500/20 bg-red-900/5 relative">
            <div class="absolute top-0 right-0 p-2 font-mono text-[10px] text-red-500/50 blink">
                [!] ANOMALY_DETECTED
            </div>
            <div class="font-mono text-[10px] text-red-400/60 border-b border-red-500/20 pb-3 mb-6 uppercase tracking-wider flex justify-between items-end">
                <span data-editable="true">01 / 当前系统劣势 (Pain Points)</span>
                <span class="flex gap-1 mb-1">
                    <span class="w-2 h-2 bg-red-500/80"></span>
                    <span class="w-2 h-2 bg-red-500/20"></span>
                </span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="border-l-2 border-red-500/50 pl-4 py-2">
                    <div class="font-mono text-[9px] text-red-400/50 mb-1" data-editable="true">ERR_CODE: 0x1A</div>
                    <h3 class="font-bold text-lg text-white mb-2 tracking-wide" data-editable="true">界面过于平庸</h3>
                    <p class="font-mono text-[11px] text-white/50" data-editable="true">传统大圆角和弥散阴影设计已产生视觉疲劳，无法体现硬核科技产品的专业度与前沿感。</p>
                </div>
                <div class="border-l-2 border-red-500/50 pl-4 py-2">
                    <div class="font-mono text-[9px] text-red-400/50 mb-1" data-editable="true">ERR_CODE: 0x2B</div>
                    <h3 class="font-bold text-lg text-white mb-2 tracking-wide" data-editable="true">信息密度不足</h3>
                    <p class="font-mono text-[11px] text-white/50" data-editable="true">常规留白过多，导致关键数据分散，高级用户/极客群体无法在同一屏幕获取足够的决策参数。</p>
                </div>
                <div class="border-l-2 border-red-500/50 pl-4 py-2">
                    <div class="font-mono text-[9px] text-red-400/50 mb-1" data-editable="true">ERR_CODE: 0x3C</div>
                    <h3 class="font-bold text-lg text-white mb-2 tracking-wide" data-editable="true">缺乏沉浸体验</h3>
                    <p class="font-mono text-[11px] text-white/50" data-editable="true">普通网页缺乏动态响应与系统级反馈，无法建立起“正在操作高级仪器”的心流状态。</p>
                </div>
            </div>
        </section>

        <!-- 02/03 原版核心概念与特征组合 -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
            <!-- 侧边栏 -->
            <aside data-section="status" class="lg:col-span-4 flex flex-col gap-8">
                <div class="fui-box p-6 relative">
                    <div class="absolute top-0 right-0 p-2 font-mono text-[10px] text-white/30">MODULE_02</div>
                    <div class="font-mono text-[10px] text-white/50 border-b border-white/20 pb-3 mb-5 uppercase tracking-wider" data-editable="true">
                        02 / 核心定义 (Definition)
                    </div>
                    <p class="text-white/85 text-lg leading-relaxed font-medium" data-editable="true">
                        FUI (Future User Interface) 并非追求传统的“用户友好”，而是通过高密度的信息流、精密的线框和硬核的排版，呈现人类在未来操作高级系统时的“秩序感与先进性”。
                    </p>
                </div>

                <div class="fui-box p-6">
                    <div class="font-mono text-[10px] text-white/50 border-b border-white/20 pb-3 mb-5 uppercase tracking-wider flex justify-between">
                        <span data-editable="true">SYSTEM_LOAD (负载)</span>
                        <span class="blink">_</span>
                    </div>
                    <ul class="font-mono text-[11px] space-y-5">
                        <li>
                            <div class="flex justify-between mb-2"><span class="text-white/60 tracking-wider">NEURAL CORE</span><span class="text-white">100%</span></div>
                            <div class="h-[3px] w-full bg-white/10 flex gap-[2px]"><div class="h-full bg-white w-[100%]"></div></div>
                        </li>
                        <li>
                            <div class="flex justify-between mb-2"><span class="text-white/60 tracking-wider">ENERGY GRID</span><span class="text-white">92%</span></div>
                            <div class="h-[3px] w-full bg-white/10 flex gap-[2px]"><div class="h-full bg-white w-[92%]"></div></div>
                        </li>
                    </ul>
                </div>
            </aside>

            <!-- 核心网格 -->
            <section data-section="features" class="lg:col-span-8 fui-box p-8">
                <div class="font-mono text-[10px] text-white/50 border-b border-white/20 pb-3 mb-8 flex justify-between items-end uppercase tracking-wider">
                    <span data-editable="true">03 / 视觉特征矩阵 (Visual Features)</span>
                    <span class="flex gap-1 mb-1"><span class="w-3 h-1 bg-white/20"></span><span class="w-3 h-1 bg-white/60"></span><span class="w-3 h-1 bg-white"></span></span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="border border-white/15 p-6 hover:border-white/50 transition-colors group relative bg-black/30">
                        <div class="absolute top-3 right-3 font-mono text-[9px] text-white/30 group-hover:text-white/70 transition-colors">F_001</div>
                        <div class="h-14 w-14 border border-white/30 flex items-center justify-center mb-5 group-hover:bg-white/10 transition-colors relative">
                            <div class="w-6 h-[1px] bg-white absolute"></div><div class="w-[1px] h-6 bg-white absolute"></div><div class="w-full h-full border border-white/20 absolute rotate-45"></div>
                        </div>
                        <h3 class="font-bold text-xl mb-2 tracking-wide" data-editable="true">精密线框 HUD</h3>
                        <p class="font-mono text-[11px] text-white/50 leading-relaxed" data-editable="true">摒弃大色块填充，完全使用线条、边框和十字标构建严密的视觉矩阵，强调“瞄准”与“锁定”的战术感。</p>
                    </div>

                    <div class="border border-white/15 p-6 hover:border-white/50 transition-colors group relative bg-black/30">
                        <div class="absolute top-3 right-3 font-mono text-[9px] text-white/30 group-hover:text-white/70 transition-colors">F_002</div>
                        <div class="h-14 w-14 border border-white/30 flex items-center justify-center mb-5 group-hover:bg-white/10 transition-colors dot-bg">
                            <div class="flex items-end gap-[2px] w-8 h-6">
                                <div class="w-full bg-white h-[30%]"></div><div class="w-full bg-white h-[70%]"></div><div class="w-full bg-white h-[100%]"></div><div class="w-full bg-white h-[50%]"></div>
                            </div>
                        </div>
                        <h3 class="font-bold text-xl mb-2 tracking-wide" data-editable="true">数据扫描波形</h3>
                        <p class="font-mono text-[11px] text-white/50 leading-relaxed" data-editable="true">大量使用正弦波、点阵列、跳动的频段柱状图，暗示后台正在进行庞大且复杂的数据流计算。</p>
                    </div>

                    <div class="border border-white/15 p-6 hover:border-white/50 transition-colors group relative bg-black/30">
                        <div class="absolute top-3 right-3 font-mono text-[9px] text-white/30 group-hover:text-white/70 transition-colors">F_003</div>
                        <div class="h-14 w-14 border border-white/30 flex items-center justify-center mb-5 group-hover:bg-white/10 transition-colors">
                            <div class="text-[10px] font-mono leading-none tracking-tighter text-white">SYS<br>ERR<br>OK</div>
                        </div>
                        <h3 class="font-bold text-xl mb-2 tracking-wide" data-editable="true">微缩文本修饰</h3>
                        <p class="font-mono text-[11px] text-white/50 leading-relaxed" data-editable="true">在界面的边角塞满极小字号的纯大写等宽字符，极大提升专业质感。</p>
                    </div>
                    
                    <div class="border border-white/15 p-6 hover:border-white/50 transition-colors group relative bg-black/30 flex flex-col justify-center text-center">
                        <div class="absolute top-3 left-3 font-mono text-[9px] text-white/30">CRITICAL_METRIC</div>
                        <div class="text-5xl font-bold text-white mb-2 tracking-tighter" data-editable="true">99.9%</div>
                        <div class="font-mono text-[10px] text-white/50 uppercase tracking-widest" data-editable="true">界面指令响应率</div>
                    </div>
                </div>
            </section>
        </div>

        <!-- 04 界面展示 (恢复自第二次新增) -->
        <section data-section="showcase" class="fui-box p-8 mb-20">
            <div class="font-mono text-[10px] text-white/50 border-b border-white/20 pb-3 mb-8 flex justify-between items-end uppercase tracking-wider">
                <span data-editable="true">04 / 终端映射 (Interface Projection)</span>
                <span class="flex gap-1 mb-1"><span class="w-1 h-3 bg-white/20"></span><span class="w-1 h-3 bg-white/60"></span></span>
            </div>
            
            <div class="w-full aspect-video border border-white/20 p-2 sm:p-6 dot-bg relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 pointer-events-none z-10"></div>
                <div class="h-full border border-white/10 flex flex-col bg-black/40 backdrop-blur-sm p-4 relative z-0 shadow-2xl">
                    <div class="flex justify-between border-b border-white/10 pb-2 mb-4 font-mono text-[8px] sm:text-[10px] text-white/40">
                        <span>SYS_OVERVIEW // MAIN_DASHBOARD</span>
                        <span>NODE: 192.168.1.1</span>
                    </div>
                    <div class="flex-1 grid grid-cols-3 gap-4">
                        <div class="col-span-1 border border-white/10 flex flex-col gap-2 p-2">
                            <div class="h-1/3 border border-white/10 flex items-center justify-center font-mono text-white/20 text-xs">MODULE_A</div>
                            <div class="h-1/3 border border-white/10 flex items-center justify-center font-mono text-white/20 text-xs">MODULE_B</div>
                            <div class="h-1/3 border border-white/10 flex items-center justify-center font-mono text-white/20 text-xs">MODULE_C</div>
                        </div>
                        <div class="col-span-2 border border-white/10 relative flex justify-center items-center overflow-hidden">
                            <div class="w-32 h-32 sm:w-64 sm:h-64 border border-dashed border-white/20 rounded-full spin-slow relative flex justify-center items-center">
                                <div class="w-16 h-16 sm:w-32 sm:h-32 border border-white/10 rounded-full"></div>
                                <div class="w-full h-[1px] bg-white/10 absolute"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="absolute inset-0 z-20 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md">
                    <a href="#" class="fui-btn text-sm" data-editable="true">进入系统体验 (ENTER SYSTEM)</a>
                </div>
            </div>
        </section>

        <!-- 05 核心功能简介 (恢复自第二次新增) -->
        <section data-section="functions" class="mb-20">
            <div class="font-mono text-[10px] text-white/50 border-b border-white/20 pb-3 mb-8 uppercase tracking-wider">
                <span data-editable="true">05 / 战术引擎 (Core Engines)</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="fui-clip bg-white/5 border border-white/20 p-6 hover:bg-white/10 hover:border-white/50 transition-colors">
                    <div class="font-mono text-2xl text-white mb-4 opacity-70">01.</div>
                    <h4 class="font-bold text-lg mb-2" data-editable="true">全息数据渲染</h4>
                    <p class="font-mono text-[10px] text-white/50 leading-relaxed" data-editable="true">毫秒级响应，将海量原始数据转化为直观的科技可视化图表与波形。</p>
                </div>
                <div class="fui-clip bg-white/5 border border-white/20 p-6 hover:bg-white/10 hover:border-white/50 transition-colors">
                    <div class="font-mono text-2xl text-white mb-4 opacity-70">02.</div>
                    <h4 class="font-bold text-lg mb-2" data-editable="true">神经元级权限</h4>
                    <p class="font-mono text-[10px] text-white/50 leading-relaxed" data-editable="true">基于多重哈希验证的权限系统，确保战术指令下达的绝对安全。</p>
                </div>
                <div class="fui-clip bg-white/5 border border-white/20 p-6 hover:bg-white/10 hover:border-white/50 transition-colors">
                    <div class="font-mono text-2xl text-white mb-4 opacity-70">03.</div>
                    <h4 class="font-bold text-lg mb-2" data-editable="true">自适应拓扑网</h4>
                    <p class="font-mono text-[10px] text-white/50 leading-relaxed" data-editable="true">动态重组网络节点，在极端环境下依然保持底层连接协议的稳定。</p>
                </div>
                <div class="fui-clip bg-white/5 border border-white/20 p-6 hover:bg-white/10 hover:border-white/50 transition-colors">
                    <div class="font-mono text-2xl text-white mb-4 opacity-70">04.</div>
                    <h4 class="font-bold text-lg mb-2" data-editable="true">跨频段通讯</h4>
                    <p class="font-mono text-[10px] text-white/50 leading-relaxed" data-editable="true">无缝集成各种外部 API 协议，实现系统间的超低延迟数据握手。</p>
                </div>
            </div>
        </section>

        <!-- 06 业务逻辑 (恢复自第一次新增，改名数据流拓扑) -->
        <section data-section="business-logic" class="mb-20">
            <div class="font-mono text-[10px] text-white/50 border-b border-white/20 pb-3 mb-6 uppercase tracking-wider">
                <span data-editable="true">06 / 数据流拓扑 (Data Pipeline)</span>
            </div>
            <div class="flex flex-col md:flex-row justify-between items-center gap-4 relative py-4">
                <div class="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-white/20 border-t border-dashed border-white/30 -z-10"></div>
                
                <div class="fui-clip bg-black border border-white/30 p-4 w-full md:w-1/4 text-center z-10 hover:bg-white/5 transition-colors">
                    <div class="font-mono text-[9px] text-white/40 mb-2">STEP_01</div>
                    <h4 class="font-bold text-sm text-white mb-1 tracking-wider" data-editable="true">数据采集接入</h4>
                    <p class="font-mono text-[10px] text-white/50" data-editable="true">API & 传感器流同步</p>
                </div>
                <div class="text-white/30 md:hidden">↓</div>
                
                <div class="fui-clip bg-black border border-white/30 p-4 w-full md:w-1/4 text-center z-10 hover:bg-white/5 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    <div class="font-mono text-[9px] text-white/40 mb-2">STEP_02</div>
                    <h4 class="font-bold text-sm text-white mb-1 tracking-wider" data-editable="true">神经网络解析</h4>
                    <p class="font-mono text-[10px] text-white/50" data-editable="true">核心算法实时处理</p>
                </div>
                <div class="text-white/30 md:hidden">↓</div>
                
                <div class="fui-clip bg-black border border-white/30 p-4 w-full md:w-1/4 text-center z-10 hover:bg-white/5 transition-colors">
                    <div class="font-mono text-[9px] text-white/40 mb-2">STEP_03</div>
                    <h4 class="font-bold text-sm text-white mb-1 tracking-wider" data-editable="true">FUI 协议封装</h4>
                    <p class="font-mono text-[10px] text-white/50" data-editable="true">界面元素高维映射</p>
                </div>
                <div class="text-white/30 md:hidden">↓</div>
                
                <div class="fui-clip bg-white text-black border border-white p-4 w-full md:w-1/4 text-center z-10">
                    <div class="font-mono text-[9px] text-black/60 mb-2">STEP_04</div>
                    <h4 class="font-bold text-sm mb-1 tracking-wider" data-editable="true">终端全息呈现</h4>
                    <p class="font-mono text-[10px] text-black/70" data-editable="true">所见即所得输出</p>
                </div>
            </div>
        </section>

        <!-- 07 架构逻辑 (恢复自第二次新增，改名架构层级) -->
        <section data-section="architecture" class="mb-20">
            <div class="font-mono text-[10px] text-white/50 border-b border-white/20 pb-3 mb-8 uppercase tracking-wider flex justify-between">
                <span data-editable="true">07 / 架构层级 (Architecture)</span>
                <span class="text-white/30">SYS_LAYERS</span>
            </div>
            <div class="flex flex-col md:flex-row justify-between items-center gap-4 relative py-6">
                <div class="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-white/20 border-t border-dashed border-white/30 -z-10"></div>
                
                <div class="fui-box p-5 w-full md:w-1/4 text-center z-10 hover:border-white/80 transition-colors">
                    <div class="font-mono text-[9px] text-white/40 mb-3">LAYER_01</div>
                    <h4 class="font-bold text-sm text-white mb-1 tracking-widest" data-editable="true">感知层 (SENSORY)</h4>
                </div>
                <div class="text-white/30 md:hidden font-mono text-xs">|</div>
                
                <div class="fui-box p-5 w-full md:w-1/4 text-center z-10 hover:border-white/80 transition-colors">
                    <div class="font-mono text-[9px] text-white/40 mb-3">LAYER_02</div>
                    <h4 class="font-bold text-sm text-white mb-1 tracking-widest" data-editable="true">运算网 (COMPUTE)</h4>
                </div>
                <div class="text-white/30 md:hidden font-mono text-xs">|</div>
                
                <div class="fui-box p-5 w-full md:w-1/4 text-center z-10 hover:border-white/80 transition-colors">
                    <div class="font-mono text-[9px] text-white/40 mb-3">LAYER_03</div>
                    <h4 class="font-bold text-sm text-white mb-1 tracking-widest" data-editable="true">转换栈 (PROTOCOL)</h4>
                </div>
                <div class="text-white/30 md:hidden font-mono text-xs">|</div>
                
                <div class="fui-box p-5 w-full md:w-1/4 text-center z-10 bg-white text-black hover:bg-white/90 transition-colors border-white">
                    <div class="font-mono text-[9px] text-black/60 mb-3">LAYER_04</div>
                    <h4 class="font-bold text-sm mb-1 tracking-widest" data-editable="true">表现层 (DISPLAY)</h4>
                </div>
            </div>
        </section>

        <!-- 08 核心卖点 (恢复自第一次新增) -->
        <section data-section="core-selling-points" class="mb-20">
            <div class="font-mono text-[10px] text-white/50 border-b border-white/20 pb-3 mb-6 uppercase tracking-wider">
                <span data-editable="true">08 / 核心战术能力 (Core Capabilities)</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="border border-white/20 p-6 flex flex-col justify-between hover:border-white/60 transition-all">
                    <div>
                        <div class="font-mono text-[24px] text-white/20 font-bold mb-4">01.</div>
                        <h3 class="font-bold text-xl text-white mb-3 tracking-wide" data-editable="true">零外部依赖环境</h3>
                        <p class="font-mono text-[11px] text-white/50 leading-relaxed mb-6" data-editable="true">纯粹的 HTML + Tailwind + 少量原生 CSS，即可还原顶级科幻特效，保证系统的极简与绝对稳定。</p>
                    </div>
                    <div class="h-1 w-full bg-white/10"><div class="h-full bg-white w-full"></div></div>
                </div>
                
                <div class="border border-white/20 p-6 flex flex-col justify-between hover:border-white/60 transition-all">
                    <div>
                        <div class="font-mono text-[24px] text-white/20 font-bold mb-4">02.</div>
                        <h3 class="font-bold text-xl text-white mb-3 tracking-wide" data-editable="true">高度模块化槽位</h3>
                        <p class="font-mono text-[11px] text-white/50 leading-relaxed mb-6" data-editable="true">所有界面区块均被严格封装。结构扁平，支持通过 AI 进行精准的 DOM 正则替换与数据注入。</p>
                    </div>
                    <div class="h-1 w-full bg-white/10"><div class="h-full bg-white w-[85%]"></div></div>
                </div>

                <div class="border border-white/20 p-6 flex flex-col justify-between hover:border-white/60 transition-all bg-white/5">
                    <div>
                        <div class="font-mono text-[24px] text-white/40 font-bold mb-4">03.</div>
                        <h3 class="font-bold text-xl text-white mb-3 tracking-wide" data-editable="true">极致的性能优化</h3>
                        <p class="font-mono text-[11px] text-white/50 leading-relaxed mb-6" data-editable="true">摒弃视频背景与高清晰度图片，雷达、十字标全部由 GPU 加速的纯代码绘制。帧率稳定，功耗极低。</p>
                    </div>
                    <div class="h-1 w-full bg-white/10"><div class="h-full bg-white w-[96%]"></div></div>
                </div>
            </div>
        </section>

        <!-- 09 产品价值 (恢复自第一次新增) -->
        <section data-section="product-value" class="fui-box p-8 mb-24 dot-bg">
            <div class="font-mono text-[10px] text-white/50 border-b border-white/20 pb-3 mb-8 uppercase tracking-wider">
                <span data-editable="true">09 / 效能指标 (Performance Metrics)</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center md:text-left">
                <div class="border-l border-white/20 pl-6">
                    <div class="font-bold text-5xl md:text-6xl text-white tracking-tighter mb-2" data-editable="true">+300<span class="text-3xl text-white/50">%</span></div>
                    <div class="font-mono text-xs text-white/60" data-editable="true">产品科技感转化率提升</div>
                </div>
                <div class="border-l border-white/20 pl-6">
                    <div class="font-bold text-5xl md:text-6xl text-white tracking-tighter mb-2" data-editable="true">-80<span class="text-3xl text-white/50">%</span></div>
                    <div class="font-mono text-xs text-white/60" data-editable="true">前端视觉开发耗时降低</div>
                </div>
                <div class="border-l border-white/20 pl-6">
                    <div class="font-bold text-5xl md:text-6xl text-white tracking-tighter mb-2" data-editable="true">0<span class="text-3xl text-white/50">.kb</span></div>
                    <div class="font-mono text-xs text-white/60" data-editable="true">图片资源与外部依赖占用</div>
                </div>
                <div class="border-l border-white/20 pl-6">
                    <div class="font-bold text-5xl md:text-6xl text-white tracking-tighter mb-2" data-editable="true">99<span class="text-3xl text-white/50">.9%</span></div>
                    <div class="font-mono text-xs text-white/60" data-editable="true">AI 代码注入解析成功率</div>
                </div>
            </div>
        </section>
        
        <!-- 10 Analytics & CTA -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <!-- Analytics -->
            <section data-section="analytics" class="fui-box p-8">
                <div class="font-mono text-[10px] text-white/50 border-b border-white/20 pb-3 mb-8 flex justify-between uppercase tracking-wider">
                    <span data-editable="true">System Analytics (Live Stream)</span>
                    <span class="text-white">NODE: ALPHA-7</span>
                </div>
                
                <div class="h-40 mb-6 border-b border-white/15 pb-6 relative dot-bg flex flex-col justify-end">
                    <div class="absolute top-0 right-0 bg-white/10 px-2 py-1 font-mono text-[9px] border border-white/30">
                        MAX: <span class="text-white" data-editable="true">4,285 MB/s</span>
                    </div>
                    <div class="w-full h-full flex items-end justify-between gap-[2px] opacity-80 pt-8">
                        <div class="w-full bg-white/40 h-[20%]"></div><div class="w-full bg-white/60 h-[35%]"></div>
                        <div class="w-full bg-white/30 h-[50%]"></div><div class="w-full bg-white h-[85%]"></div>
                        <div class="w-full bg-white/70 h-[60%]"></div><div class="w-full bg-white/50 h-[30%]"></div>
                        <div class="w-full bg-white/90 h-[75%]"></div><div class="w-full bg-white/60 h-[40%]"></div>
                        <div class="w-full bg-white/40 h-[25%]"></div><div class="w-full bg-white/50 h-[45%]"></div>
                        <div class="w-full bg-white/80 h-[90%]"></div><div class="w-full bg-white/30 h-[20%]"></div>
                        <div class="w-full bg-white/50 h-[55%]"></div><div class="w-full bg-white/70 h-[70%]"></div>
                        <div class="w-full bg-white/90 h-[100%]"></div><div class="w-full bg-white/40 h-[30%]"></div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 font-mono text-[10px] text-white/60">
                    <div>
                        <div class="mb-1" data-editable="true">PACKETS SENT</div>
                        <div class="text-lg text-white" data-editable="true">1,245,892</div>
                    </div>
                    <div>
                        <div class="mb-1" data-editable="true">LATENCY (MS)</div>
                        <div class="text-lg text-white" data-editable="true">12.4</div>
                    </div>
                </div>
            </section>

            <!-- Terminal -->
            <section data-section="cta" class="fui-box p-8 flex flex-col justify-between">
                <div>
                    <div class="font-mono text-[10px] text-white/50 border-b border-white/20 pb-3 mb-8 uppercase tracking-wider flex justify-between">
                        <span data-editable="true">Command Terminal</span>
                        <span class="text-white">INPUT_REQ</span>
                    </div>
                    
                    <div class="font-mono text-xs text-white/70 mb-8 space-y-3 leading-relaxed">
                        <div><span class="text-white/40">C:\SYS></span> INITIALIZING FUI PROTOCOL... <span class="text-white">[OK]</span></div>
                        <div><span class="text-white/40">C:\SYS></span> LOADING NEURAL ASSETS... <span class="text-white">[OK]</span></div>
                        <div class="text-white" data-editable="true"><span class="text-white/40">C:\SYS></span> 准备就绪。是否将此界面风格应用至您的前端项目？</div>
                        <div class="pt-2"><span class="text-white/40">C:\SYS></span> <span class="blink inline-block w-2 h-[14px] bg-white align-middle"></span></div>
                    </div>
                </div>

                <div class="flex gap-4">
                    <button class="fui-btn flex-1 text-center font-bold text-sm" data-editable="true">
                        执行部署 (DEPLOY NOW)
                    </button>
                    <button class="border border-white/30 px-5 hover:bg-white/10 transition-colors text-white/70 hover:text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </button>
                </div>
            </section>
        </div>

        <!-- 11 社媒信息 (恢复自第一次新增) -->
        <section data-section="social-media" class="border-t border-white/20 pt-8 pb-4">
            <div class="font-mono text-[10px] text-white/40 mb-4 uppercase tracking-wider">
                <span data-editable="true">EXT_COMMS_LINK // 外部通讯频段建立</span>
            </div>
            <div class="flex flex-wrap gap-4 font-mono text-xs">
                <a href="#" class="border border-white/30 px-4 py-2 hover:bg-white hover:text-black transition-colors flex items-center gap-2">
                    <span class="text-[10px] opacity-50">[TW]</span> <span data-editable="true">X / Twitter</span>
                </a>
                <a href="#" class="border border-white/30 px-4 py-2 hover:bg-white hover:text-black transition-colors flex items-center gap-2">
                    <span class="text-[10px] opacity-50">[GIT]</span> <span data-editable="true">GitHub Repos</span>
                </a>
                <a href="#" class="border border-white/30 px-4 py-2 hover:bg-white hover:text-black transition-colors flex items-center gap-2">
                    <span class="text-[10px] opacity-50">[DIS]</span> <span data-editable="true">Discord Server</span>
                </a>
                <a href="#" class="border border-white/30 px-4 py-2 hover:bg-white hover:text-black transition-colors flex items-center gap-2">
                    <span class="text-[10px] opacity-50">[DOC]</span> <span data-editable="true">API Docs</span>
                </a>
            </div>
        </section>

        <!-- Footer -->
        <footer data-section="footer" class="border-t border-white/20 pt-6 mt-12 flex flex-col md:flex-row justify-between items-center font-mono text-[9px] text-white/40 uppercase tracking-[0.2em] gap-6">
            <div class="flex gap-6">
                <span data-editable="true">MODE: ADMIN</span>
                <span data-editable="true">OPERATOR: ROOT_USER</span>
            </div>
            
            <div class="flex items-center gap-4">
                <span class="hidden md:inline" data-editable="true">SYS_UPTIME: 256d 14h 32m</span>
                <span class="w-[1px] h-3 bg-white/20 hidden md:block"></span>
                <span data-editable="true">HASH: 0x8F9A2B</span>
            </div>
            
            <div class="flex gap-2 items-center">
                <span>CONN_SIGNAL</span>
                <div class="flex gap-[2px] items-end h-3">
                    <div class="w-[3px] h-1 bg-white/30"></div>
                    <div class="w-[3px] h-2 bg-white/50"></div>
                    <div class="w-[3px] h-3 bg-white"></div>
                </div>
            </div>
        </footer>

    </div>
</body>
</html>