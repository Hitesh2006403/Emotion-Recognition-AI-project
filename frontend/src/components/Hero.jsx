import React, { Suspense, useMemo, useRef } from 'react';
import { Sparkles, Camera, Mic, Type, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { SpotlightCard } from './common/SpotlightCard';
import { InteractiveButton } from './common/InteractiveButton';
import { isWebGLAvailable } from '../utils/webglDetect';

// Lazy-load 3D WebGL components so initial page load isn't blocked
const EmotionCoreCanvas = React.lazy(() => import('./3d/EmotionCoreCanvas'));

function Hero2DFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none opacity-40">
      <div className="w-96 h-96 rounded-full border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center relative">
        <div className="w-72 h-72 rounded-full border border-dashed border-cyan-400/20" />
        <div className="w-48 h-48 rounded-full border border-cyan-400/30 flex items-center justify-center bg-cyan-400/5">
          <Sparkles className="w-10 h-10 text-cyan-400/40" />
        </div>
      </div>
    </div>
  );
}

export function Hero({ onStartDemo, onSelectTab }) {
  const heroRef = useRef(null);
  const hasWebGL = useMemo(() => isWebGLAvailable(), []);

  return (
    <div 
      ref={heroRef}
      className="relative overflow-hidden pt-10 pb-16 border-b border-slate-200/60 dark:border-slate-800/60 bg-transparent transition-colors duration-200"
    >
      {/* 1. True Background Layer: 3D AI Emotion Core (z-index 0) */}
      <div 
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
        style={{
          maskImage: 'radial-gradient(ellipse 90% 80% at 50% 45%, black 40%, rgba(0, 0, 0, 0.6) 70%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 45%, black 40%, rgba(0, 0, 0, 0.6) 70%, transparent 100%)',
        }}
      >
        {hasWebGL ? (
          <Suspense fallback={null}>
            <EmotionCoreCanvas eventSource={heroRef} className="w-full h-full" />
          </Suspense>
        ) : (
          <Hero2DFallback />
        )}
      </div>

      {/* 2. Interactive Foreground Content (z-index 10) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Centered Hero Header */}
        <div className="max-w-4xl mx-auto text-center space-y-6 mb-12">
          
          {/* Scientific Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-white/75 dark:bg-[#111622]/85 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              Affective Computing Lab
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-white/75 dark:bg-[#111622]/85 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              4-Head Cross-Modal Attention
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-white/75 dark:bg-[#111622]/85 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              51/51 Tests Passing
            </span>
          </div>

          {/* Main Headline with high contrast & legibility drop-shadow */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight text-slate-900 dark:text-white leading-[1.12] drop-shadow-xs dark:drop-shadow-[0_2px_20px_rgba(0,0,0,0.85)]">
            Decoding Human Affect across{' '}
            <span className="text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_24px_rgba(0,229,255,0.35)]">
              Vision, Voice & Language
            </span>
          </h1>

          {/* Subheadline with high legibility */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-700 dark:text-slate-200 leading-relaxed max-w-2xl mx-auto font-normal drop-shadow-xs dark:drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
            An affective computing architecture integrating ResNet-18 face encoding, 4-block Log-Mel spectrogram CNN, and MiniLM semantic text embeddings with bidirectional cross-modal attention.
          </p>

          {/* Launch CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <InteractiveButton
              onClick={onStartDemo}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-heading font-black text-sm shadow-lg shadow-cyan-500/25 group"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Launch Trimodal Studio</span>
              <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform duration-200" />
            </InteractiveButton>

            <div className="text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-[#080B10]/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>3D Synaptic Telemetry Active</span>
            </div>
          </div>

        </div>

        {/* Feature Cards / Modality Selectors with Magnetic Spotlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          
          {/* Card 1: Face */}
          <SpotlightCard 
            hoverEffect={true}
            onClick={() => onSelectTab('face')}
            className="p-6 cursor-pointer group border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white/75 dark:bg-[#0F141F]/75 backdrop-blur-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#182032] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-cyan-500 transition-colors">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111622] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                68.10% ACC
              </span>
            </div>
            <h3 className="font-heading font-bold text-slate-900 dark:text-white text-base mb-1.5 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              Facial Action Units
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              ResNet-18 vision encoder extracting 512-dim facial expressions with automated Haar cascade face cropping.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
              <span>Open Face Lab</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </SpotlightCard>

          {/* Card 2: Audio */}
          <SpotlightCard 
            hoverEffect={true}
            onClick={() => onSelectTab('audio')}
            className="p-6 cursor-pointer group border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white/75 dark:bg-[#0F141F]/75 backdrop-blur-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#182032] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-cyan-500 transition-colors">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111622] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                56.43% ACC
              </span>
            </div>
            <h3 className="font-heading font-bold text-slate-900 dark:text-white text-base mb-1.5 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              Speech Acoustics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              128-channel Log-Mel spectrogram CNN mapping vocal pitch, cadence, and acoustic arousal into 512 dimensions.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
              <span>Open Voice Lab</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </SpotlightCard>

          {/* Card 3: Text */}
          <SpotlightCard 
            hoverEffect={true}
            onClick={() => onSelectTab('text')}
            className="p-6 cursor-pointer group border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white/75 dark:bg-[#0F141F]/75 backdrop-blur-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#182032] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-cyan-500 transition-colors">
                <Type className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111622] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                53.57% ACC
              </span>
            </div>
            <h3 className="font-heading font-bold text-slate-900 dark:text-white text-base mb-1.5 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              Language Semantics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              all-MiniLM-L6-v2 transformer projection for Ekman 7-class sentiment and conversational affect mapping.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
              <span>Open Text Lab</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </SpotlightCard>

        </div>

      </div>
    </div>
  );
}
