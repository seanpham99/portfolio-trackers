import { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Circle,
  Maximize2,
  ChevronRight,
  Command,
  Layout,
  Clock,
  Globe,
  Activity,
  Brain,
  X,
  PieChart,
  Target
} from 'lucide-react';

// --- Assets Data ---
const ASSET_CLASSES = [
  {
    id: 'equities',
    label: 'Equities',
    description: 'Public market growth & dividends',
    total: 142500,
    change: 5.4,
    color: 'bg-blue-500',
    items: [
      { name: 'Apple', symbol: 'AAPL', value: 45000, trend: [20, 40, 35, 50, 45, 60, 55], color: '#60a5fa' },
      { name: 'Microsoft', symbol: 'MSFT', value: 62000, trend: [30, 35, 45, 40, 55, 65, 70], color: '#3b82f6' },
      { name: 'Tesla', symbol: 'TSLA', value: 35500, trend: [80, 70, 75, 60, 50, 45, 40], color: '#ef4444' }
    ]
  },
  {
    id: 'crypto',
    label: 'Digital Assets',
    description: 'High volatility, high alpha',
    total: 84200,
    change: -12.4,
    color: 'bg-orange-500',
    items: [
      { name: 'Bitcoin', symbol: 'BTC', value: 65000, trend: [50, 45, 60, 55, 40, 30, 35], color: '#f59e0b' },
      { name: 'Ethereum', symbol: 'ETH', value: 19200, trend: [40, 45, 42, 38, 35, 30, 28], color: '#8b5cf6' }
    ]
  },
  {
    id: 'real-estate',
    label: 'Hard Assets',
    description: 'Physical stability & yield',
    total: 450000,
    change: 1.2,
    color: 'bg-emerald-500',
    items: [
      { name: 'Austin Loft', symbol: 'RE-TX', value: 450000, trend: [50, 51, 51.5, 52, 52.2, 52.8, 53], color: '#10b981' }
    ]
  }
];

// --- Analytics Mock Data ---
const ANALYTICS_DATA = {
  history: [620000, 635000, 630000, 645000, 670000, 660000, 680000, 675000, 690000, 710000, 705000, 676700],
  events: [
    { index: 3, type: 'buy', label: 'BTC Accumulation' },
    { index: 7, type: 'sell', label: 'TSLA Profit Take' },
    { index: 10, type: 'buy', label: 'REIT Entry' }
  ],
  insights: [
    "Portfolio volatility has decreased by 12% since reducing Crypto exposure.",
    "Correlation Alert: Tech Stocks and Bitcoin are moving in tandem (0.85).",
    "Cash drag is 15%. Recommend deploying capital into high-yield debt instruments."
  ]
};

// --- Sub-components ---

const Sparkline = ({ data, color, width = 100, height = 30, fillOpacity = 0 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((d - min) / range) * height
  }));

  const pathData = points.reduce((acc, p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");

  const areaPath = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fillOpacity > 0 && (
        <path d={areaPath} fill={`url(#grad-${color})`} stroke="none" />
      )}
      <path d={pathData} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const AnalyticsOverlay = ({ onClose, totalValue }) => {
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnalyzing(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Normalize history for the main chart
  const history = ANALYTICS_DATA.history;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min;
  const width = 800;
  const height = 300;

  const points = history.map((val, i) => ({
    x: (i / (history.length - 1)) * width,
    y: height - ((val - min) / range) * height,
    val
  }));

  const pathData = points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");
  const areaPath = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="fixed inset-0 z-[60] bg-[#0a0a0b]/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8 md:p-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black italic tracking-tighter text-white">Portfolio Intelligence</h2>
              <p className="text-zinc-500 text-sm font-medium">Deep dive analytics & AI Recommendations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full border border-zinc-800 hover:bg-white hover:text-black transition-colors flex items-center justify-center"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Chart Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="p-8 bg-zinc-900/30 border border-zinc-800/50 rounded-[32px] relative overflow-hidden group">
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Net Worth Trajectory</p>
                  <h3 className="text-4xl font-bold text-white">${totalValue.toLocaleString()}</h3>
                </div>
                <div className="flex gap-2">
                  {['1M', '3M', '6M', '1Y'].map(t => (
                    <button key={t} className={`px-3 py-1 rounded-full text-[10px] font-bold ${t === '6M' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'}`}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="relative h-[300px] w-full group-hover:scale-[1.01] transition-transform duration-500">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="chart-grad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map(offset => (
                    <line key={offset} x1="0" y1={height * offset} x2={width} y2={height * offset} stroke="#333" strokeDasharray="4 4" strokeWidth="1" opacity="0.3" />
                  ))}

                  <path d={areaPath} fill="url(#chart-grad)" />
                  <path d={pathData} fill="none" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Event Markers */}
                  {ANALYTICS_DATA.events.map((ev, i) => {
                    const point = points[ev.index];
                    return (
                      <g key={i} className="group/marker cursor-pointer">
                        <circle cx={point.x} cy={point.y} r="6" fill={ev.type === 'buy' ? '#10b981' : '#f43f5e'} stroke="#0a0a0b" strokeWidth="2" />
                        <line x1={point.x} y1={point.y} x2={point.x} y2={height} stroke={ev.type === 'buy' ? '#10b981' : '#f43f5e'} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />

                        {/* Tooltip */}
                        <g className="opacity-0 group-hover/marker:opacity-100 transition-opacity" transform={`translate(${point.x - 50}, ${point.y - 45})`}>
                          <rect width="100" height="30" rx="6" fill="white" />
                          <text x="50" y="19" textAnchor="middle" fontSize="10" fontWeight="bold" fill="black">{ev.label}</text>
                          <polygon points="50,30 45,35 55,35" fill="white" transform="translate(0, -5)" />
                        </g>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase">Best Performer</p>
                  <p className="text-lg font-bold text-white">NVIDIA Corp</p>
                  <p className="text-xs text-emerald-500">+142% YTD</p>
                </div>
              </div>
              <div className="p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <TrendingDown size={20} />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase">Top Drawdown</p>
                  <p className="text-lg font-bold text-white">Bitcoin</p>
                  <p className="text-xs text-rose-500">-12% (30D)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI & Allocation */}
          <div className="space-y-8">

            {/* AI Insight Card */}
            <div className="p-8 bg-gradient-to-b from-indigo-900/20 to-zinc-900/30 border border-indigo-500/20 rounded-[32px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

              <div className="flex items-center gap-3 mb-6">
                <Brain size={20} className="text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-300">Finsight AI Analysis</h3>
              </div>

              <div className="space-y-4 min-h-[160px]">
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 space-y-3">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-indigo-400 font-mono animate-pulse">Running Monte Carlo Simulations...</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {ANALYTICS_DATA.insights.map((insight, i) => (
                      <li key={i} className="flex gap-3 text-sm text-zinc-300 leading-relaxed animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 150}ms` }}>
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {!analyzing && (
                <button className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-indigo-900/20">
                  Generate Rebalancing Plan
                </button>
              )}
            </div>

            {/* Allocation */}
            <div className="p-8 bg-zinc-900/30 border border-zinc-800/50 rounded-[32px]">
              <div className="flex items-center gap-3 mb-6">
                <PieChart size={20} className="text-zinc-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Allocation Radar</h3>
              </div>

              <div className="space-y-4">
                {ASSET_CLASSES.map(asset => {
                  const percentage = Math.round((asset.total / totalValue) * 100);
                  return (
                    <div key={asset.id} className="group">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-white group-hover:text-indigo-400 transition-colors">{asset.label}</span>
                        <span className="text-zinc-500">{percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${asset.color} opacity-80 group-hover:opacity-100 transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 pt-6 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-500">
                <span>Target Deviation</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1"><Target size={12} /> Within 2%</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default function FinsightTracker() {
  const [activeStage, setActiveStage] = useState(0);
  const [focusedAsset, setFocusedAsset] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [timeframe, setTimeframe] = useState('1M');

  // --- Derived State ---
  const totalNetWorth = useMemo(() => ASSET_CLASSES.reduce((acc, curr) => acc + curr.total, 0), []);

  useEffect(() => setIsLoaded(true), []);

  // --- Keyboard Navigation ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (focusedAsset) {
        if (e.key === 'Escape') setFocusedAsset(null);
        return;
      }
      if (showAnalytics) {
        if (e.key === 'Escape') setShowAnalytics(false);
        return;
      }
      if (e.key === 'ArrowRight') setActiveStage((prev) => (prev + 1) % ASSET_CLASSES.length);
      if (e.key === 'ArrowLeft') setActiveStage((prev) => (prev - 1 + ASSET_CLASSES.length) % ASSET_CLASSES.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedAsset, showAnalytics]);

  const nextStage = () => setActiveStage((prev) => (prev + 1) % ASSET_CLASSES.length);
  const prevStage = () => setActiveStage((prev) => (prev - 1 + ASSET_CLASSES.length) % ASSET_CLASSES.length);

  return (
    <div className="h-screen w-full bg-[#0a0a0b] text-[#e4e4e7] overflow-hidden font-sans select-none relative">

      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Analytics Overlay */}
      {showAnalytics && <AnalyticsOverlay onClose={() => setShowAnalytics(false)} totalValue={totalNetWorth} />}

      {/* Persistent Top Bar */}
      <nav className="fixed top-0 left-0 w-full p-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setShowAnalytics(false)}>
          <div className="w-10 h-10 bg-white flex items-center justify-center rounded-full transition-transform group-hover:scale-110 shadow-lg shadow-white/10">
            <Command size={20} className="text-black" />
          </div>
          <span className="font-medium tracking-tight text-lg">Finsight</span>
        </div>

        <div className="flex items-center gap-8 text-sm font-medium text-zinc-500">
          <div className="hidden md:flex items-center gap-6 mr-4">
            <button
              onClick={() => setShowAnalytics(true)}
              className={`transition-colors flex items-center gap-2 ${showAnalytics ? 'text-white' : 'hover:text-white'}`}
            >
              {showAnalytics && <Circle size={6} className="fill-indigo-500 text-indigo-500" />}
              Portfolio Intelligence
            </button>
            <button className="hover:text-white transition-colors">Yields</button>
            <button className="hover:text-white transition-colors">Team</button>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800/50 backdrop-blur-md hover:border-zinc-700 transition-colors cursor-default">
            <Globe size={14} className="text-zinc-400" />
            <span className="text-zinc-300">Net Worth:</span>
            <span className="text-white font-bold tracking-tight">${(totalNetWorth / 1000).toFixed(0)}k</span>
          </div>
        </div>
      </nav>

      {/* Main Stage Slider - Hidden/Blurred when Analytics is open */}
      <main
        className={`h-full flex items-center transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${showAnalytics ? 'blur-2xl scale-95 opacity-50' : ''}`}
        style={{
          transform: `translateX(-${activeStage * 60}vw) ${showAnalytics ? 'scale(0.95)' : 'scale(1)'}`,
          paddingLeft: '10vw',
          width: `${ASSET_CLASSES.length * 60}vw`
        }}
      >
        {ASSET_CLASSES.map((stage, idx) => (
          <div
            key={stage.id}
            className={`w-[50vw] mr-[10vw] transition-all duration-700 ${activeStage === idx ? 'opacity-100 scale-100 blur-0' : 'opacity-20 scale-95 blur-sm'}`}
          >
            {/* Header Data */}
            <div className={`mb-12 transition-all duration-700 delay-100 ${activeStage === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <span className="text-zinc-500 uppercase tracking-[0.3em] text-[10px] font-bold mb-4 block flex items-center gap-2">
                {stage.description}
                <ChevronRight size={10} />
              </span>
              <div className="flex items-baseline gap-4">
                <h1 className="text-7xl font-light tracking-tighter italic">
                  {stage.label}
                </h1>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${stage.change > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {stage.change > 0 ? '+' : ''}{stage.change}%
                </div>
              </div>
              <p className="text-5xl font-bold mt-4 tracking-tight">
                ${stage.total.toLocaleString()}
              </p>
            </div>

            {/* Asset Blade List - Staggered Animation */}
            <div className="space-y-3">
              {stage.items.map((item, i) => (
                <div
                  key={i}
                  onClick={() => setFocusedAsset(item)}
                  className={`group relative flex items-center justify-between p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl backdrop-blur-sm cursor-pointer hover:bg-zinc-800/60 hover:border-zinc-700 transition-all duration-500 ease-out`}
                  style={{
                    transitionDelay: `${activeStage === idx ? (i + 2) * 100 : 0}ms`,
                    opacity: activeStage === idx ? 1 : 0,
                    transform: activeStage === idx ? 'translateY(0)' : 'translateY(20px)'
                  }}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 flex items-center justify-center bg-zinc-800 rounded-xl group-hover:bg-white group-hover:text-black transition-colors shadow-lg group-hover:shadow-white/20">
                      <Zap size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-xs text-zinc-500">{item.symbol}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                    <div className="opacity-40 group-hover:opacity-100 transition-opacity">
                      <Sparkline data={item.trend} color={item.color} />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl tracking-tight">${item.value.toLocaleString()}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Market Value</p>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-white text-black">
                      <Maximize2 size={12} />
                    </div>
                  </div>
                </div>
              ))}

              <button
                className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border border-dashed border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-all mt-4`}
                style={{
                  transitionDelay: `${activeStage === idx ? (stage.items.length + 2) * 100 : 0}ms`,
                  opacity: activeStage === idx ? 1 : 0,
                  transform: activeStage === idx ? 'translateY(0)' : 'translateY(20px)'
                }}
              >
                <Plus size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Allocate Capital</span>
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Asset Focus Layer */}
      {focusedAsset && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-8 backdrop-blur-2xl transition-all duration-500 animate-in fade-in"
          onClick={() => setFocusedAsset(null)}
        >
          <div
            className="w-full max-w-5xl bg-white text-black p-12 rounded-[40px] shadow-2xl flex flex-col md:flex-row gap-12 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Decorative Background inside modal */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gray-100 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="flex-1 z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-md">
                      {focusedAsset.symbol}
                    </span>
                    <span className="text-xs font-medium text-zinc-400">ISIN: US0378331005</span>
                  </div>
                  <h2 className="text-5xl font-black italic tracking-tighter">{focusedAsset.name}</h2>
                </div>
                <button
                  onClick={() => setFocusedAsset(null)}
                  className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center hover:scale-95 transition-transform hover:bg-zinc-200"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <span className="text-[10px] font-black uppercase text-zinc-400 block mb-2">Performance {timeframe}</span>
                  <div className="text-3xl font-bold text-emerald-600 flex items-center gap-2">
                    +22.4% <TrendingUp size={20} />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-zinc-400 block mb-2">Risk Rating</span>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    L-Medium <Shield size={20} className="text-zinc-300" />
                  </div>
                </div>
              </div>

              <div className="h-72 bg-zinc-50 rounded-3xl p-6 relative group overflow-hidden border border-zinc-100">
                <div className="absolute top-6 right-6 flex gap-2 z-20">
                  {['1D', '1W', '1M', 'YTD'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTimeframe(t)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${timeframe === t ? 'bg-black text-white' : 'bg-white text-zinc-400 hover:bg-zinc-200'
                        }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="w-full h-full relative flex items-end">
                  {/* Simulated Chart Grid */}
                  <div className="absolute inset-0 flex items-end justify-between px-2 opacity-10 pointer-events-none">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="w-[1px] bg-black" style={{ height: '100%' }} />
                    ))}
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="absolute w-full h-[1px] bg-black left-0" style={{ bottom: `${i * 20}%` }} />
                    ))}
                  </div>

                  {/* Enhanced Sparkline with Fill */}
                  <div className="absolute inset-0 flex items-center justify-center pt-8">
                    <Sparkline
                      data={focusedAsset.trend.map(v => v * (timeframe === '1D' ? 0.9 : 1))} // Slight mock data shift
                      color="#000"
                      width={450}
                      height={200}
                      fillOpacity={0.05}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-72 flex flex-col justify-between z-10 border-l border-zinc-100 pl-8 md:pl-12">
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 mb-3 block">Quick Actions</label>
                  <div className="grid gap-3">
                    <button className="p-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-between hover:bg-zinc-700 transition-colors shadow-xl shadow-zinc-200">
                      Buy / Add <ArrowRight size={16} />
                    </button>
                    <button className="p-4 bg-zinc-50 text-rose-600 rounded-2xl font-bold flex items-center justify-between hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all">
                      Liquidate <TrendingDown size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 mb-3 block">Recent Activity</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Plus size={12} />
                      </div>
                      <div>
                        <p className="font-bold">Bought $5k</p>
                        <p className="text-zinc-400">Today, 10:23 AM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-zinc-100 rounded-3xl text-center mt-8">
                <p className="text-xs text-zinc-500 mb-1 font-medium">Position Value</p>
                <p className="text-3xl font-bold tracking-tight">${focusedAsset.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="fixed bottom-12 left-0 w-full flex justify-center items-center gap-12 z-50 pointer-events-none">
        <button
          onClick={prevStage}
          className="w-16 h-16 rounded-full border border-zinc-800 bg-black/50 backdrop-blur-md flex items-center justify-center text-zinc-500 hover:bg-white hover:text-black transition-all pointer-events-auto"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="flex gap-4 pointer-events-auto">
          {ASSET_CLASSES.map((_, i) => (
            <div
              key={i}
              onClick={() => setActiveStage(i)}
              className={`h-1 rounded-full transition-all duration-500 cursor-pointer ${activeStage === i ? 'w-12 bg-white' : 'w-4 bg-zinc-800 hover:bg-zinc-600'}`}
            />
          ))}
        </div>

        <button
          onClick={nextStage}
          className="w-16 h-16 rounded-full border border-zinc-800 bg-black/50 backdrop-blur-md flex items-center justify-center text-zinc-500 hover:bg-white hover:text-black transition-all pointer-events-auto"
        >
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Bottom Footer Info */}
      <footer className="fixed bottom-8 left-12 flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
        <div className="flex items-center gap-2">
          <Circle size={8} className="fill-emerald-500 text-emerald-500 animate-pulse" />
          Live Market
        </div>
        <div className="flex items-center gap-2">
          <Clock size={12} />
          <span>Last Sync: 12:00 PM GMT</span>
        </div>
        <div className="h-px w-8 bg-zinc-800" />
        <div className="flex items-center gap-2">
          <Layout size={12} />
          <span>Use Arrow Keys</span>
        </div>
      </footer>
    </div>
  );
}