import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MultimodalStudio } from './components/MultimodalStudio';
import { FaceStudio } from './components/FaceStudio';
import { AudioStudio } from './components/AudioStudio';
import { TextStudio } from './components/TextStudio';
import { SystemOverviewModal } from './components/SystemOverviewModal';
import { getHealth } from './services/api';
import { Sparkles, Layers, Cpu } from 'lucide-react';

import { AnimatePresence, motion } from 'framer-motion';

export function App() {
  const [activeTab, setActiveTab] = useState('multimodal');
  
  // Persistent dark mode with system fallback
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('affectai_theme');
    if (saved !== null) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [backendHealth, setBackendHealth] = useState(null);
  const [showMetrics, setShowMetrics] = useState(false);

  // Synchronize dark mode class on <html> and localStorage
  useEffect(() => {
    localStorage.setItem('affectai_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Check backend health on mount & periodically
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const h = await getHealth();
      if (mounted) {
        setBackendHealth(h);
      }
    };
    check();
    const interval = setInterval(check, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#080B10] text-slate-900 dark:text-slate-100 transition-colors duration-300 antialiased selection:bg-indigo-500 selection:text-white dark:selection:bg-cyan-400 dark:selection:text-slate-950 font-sans ambient-mesh ambient-dot-grid ambient-vignette ambient-noise relative overflow-x-hidden">
      
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        backendHealth={backendHealth}
        onOpenMetrics={() => setShowMetrics(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative">
        {/* Show Hero only when in Trimodal Studio */}
        {activeTab === 'multimodal' && (
          <Hero
            onStartDemo={() => {
              const el = document.getElementById('studio-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onSelectTab={(tabId) => setActiveTab(tabId)}
          />
        )}

        {/* Framer Motion Animated Tab Transition */}
        <AnimatePresence mode="wait">
          <motion.div 
            id="studio-section" 
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'multimodal' && <MultimodalStudio />}
            {activeTab === 'face' && <FaceStudio />}
            {activeTab === 'audio' && <AudioStudio />}
            {activeTab === 'text' && <TextStudio />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Metrics & Architecture Modal */}
      <SystemOverviewModal
        isOpen={showMetrics}
        onClose={() => setShowMetrics(false)}
      />

      {/* Modern Frosted Translucent Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#080B10]/70 backdrop-blur-2xl py-8 text-xs text-slate-500 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-slate-900 dark:text-white">
              Multimodal AffectAI
            </span>
            <span>•</span>
            <span className="text-slate-600 dark:text-slate-400">Trimodal Emotion Recognition (Face + Speech + Text)</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111622] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">PyTorch 2.0+</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111622] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">ResNet-18</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111622] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">MiniLM-L6</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111622] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">4-Head Attention</span>
          </div>

          <div className="text-[11px] text-slate-400 font-medium font-mono">
            Academic Research Capstone Project
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
