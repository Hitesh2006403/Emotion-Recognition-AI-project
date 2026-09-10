import React from 'react';
import { Sparkles, Camera, Mic, Type, ArrowRight, ShieldCheck, Zap, Cpu } from 'lucide-react';
import { SpotlightCard } from './common/SpotlightCard';
import { InteractiveButton } from './common/InteractiveButton';

export function Hero({ onStartDemo, onSelectTab }) {
  return (
    <div className="relative overflow-hidden pt-12 pb-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-[#080B10]/40 backdrop-blur-md transition-colors duration-200">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6 font-mono text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-slate-100 dark:bg-[#111622] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            Affective Computing Research
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-slate-100 dark:bg-[#111622] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
            <Zap className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            4-Head Cross-Modal Attention
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-slate-100 dark:bg-[#111622] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            51/51 Tests Verified
          </span>
        </div>

        {/* Headline */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
            Decoding Human Affect across{' '}
            <span className="text-cyan-600 dark:text-cyan-400">
              Vision, Voice & Language
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
            An affective computing architecture integrating ResNet-18 face encoding, 4-block Log-Mel spectrogram CNN, and MiniLM semantic text embeddings with bidirectional cross-modal attention.
          </p>
        </div>

        {/* Feature Cards / Modality Selectors with Magnetic Spotlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          
          {/* Card 1: Face */}
          <SpotlightCard 
            hoverEffect={true}
            onClick={() => onSelectTab('face')}
            className="p-6 cursor-pointer group border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
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
            className="p-6 cursor-pointer group border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
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
            className="p-6 cursor-pointer group border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
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

        {/* Single Hero Accent CTA with 3D Tilt & Ripple */}
        <div className="flex justify-center">
          <InteractiveButton
            onClick={onStartDemo}
            className="px-8 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-heading font-black text-sm shadow-md shadow-cyan-500/20 group"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Launch Trimodal Studio</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform duration-200" />
          </InteractiveButton>
        </div>

      </div>
    </div>
  );
}
