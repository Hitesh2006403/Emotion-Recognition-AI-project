import React from 'react';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  Layers, 
  Camera, 
  Mic, 
  Type, 
  BarChart3,
  Activity
} from 'lucide-react';
import { InteractiveButton } from './common/InteractiveButton';

export function Navbar({ activeTab, setActiveTab, darkMode, setDarkMode, backendHealth, onOpenMetrics }) {
  const navItems = [
    { id: 'multimodal', label: 'Trimodal Studio', icon: Layers, badge: 'Flagship' },
    { id: 'face', label: 'Face Lab', icon: Camera },
    { id: 'audio', label: 'Voice Lab', icon: Mic },
    { id: 'text', label: 'Text Lab', icon: Type },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#080B10]/95 backdrop-blur-2xl transition-colors duration-300 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('multimodal')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="btn-press w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-cyan-400 dark:text-cyan-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                AffectAI
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#151C28] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                Trimodal Research
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Cross-Modal Affect Recognition Platform
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-[#0F141C] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`btn-press flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#1A2232] text-slate-950 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Status & Actions */}
        <div className="flex items-center gap-3">
          {/* Benchmarks modal trigger */}
          <InteractiveButton
            onClick={onOpenMetrics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F141C] hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 shadow-xs"
            title="View Neural Benchmarks & Metrics"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Metrics</span>
          </InteractiveButton>

          {/* Backend Status indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-800 font-mono">
            {backendHealth ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium hidden sm:inline text-[11px]">
                  CPU Online
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-700 dark:text-amber-400 font-medium hidden sm:inline text-[11px]">
                  Connecting...
                </span>
              </>
            )}
          </div>

          {/* Dark / Light Mode Toggle */}
          <InteractiveButton
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-amber-400 shadow-xs"
            aria-label="Toggle Theme"
            title={darkMode ? "Switch to Alabaster Light Mode" : "Switch to Deep Mineral Dark Mode"}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400 rotate-0 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-cyan-600 -rotate-12 transition-transform duration-300 hover:rotate-0" />
            )}
          </InteractiveButton>
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 dark:border-slate-800 px-3 py-2 bg-white/95 dark:bg-[#080B10]/95 backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive 
                  ? 'text-cyan-600 dark:text-cyan-400 scale-105 font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label.replace(' Studio', '').replace(' Lab', '')}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
