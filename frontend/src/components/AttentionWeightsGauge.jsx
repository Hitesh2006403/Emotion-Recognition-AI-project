import React from 'react';
import { Camera, Mic, Type, HelpCircle, Sparkles } from 'lucide-react';

export function AttentionWeightsGauge({ weights = { face: 0.33, audio: 0.33, text: 0.34 }, attentionMatrix = null, modalitiesPresent = [] }) {
  const facePct = Math.round((weights.face || 0) * 100);
  const audioPct = Math.round((weights.audio || 0) * 100);
  const textPct = Math.round((weights.text || 0) * 100);

  // Determine dominant modality
  const entries = Object.entries(weights);
  const dominant = entries.reduce((a, b) => (b[1] > a[1] ? b : a), entries[0]);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Synaptic Attention Weights (β)
          </h4>
          <span 
            title="The 4-head cross-modal attention network dynamically weights modalities based on channel signal clarity and affect saliency."
            className="cursor-help text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#182032] text-slate-700 dark:text-cyan-300 border border-slate-200 dark:border-cyan-800/50 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Dominant: <strong className="text-cyan-600 dark:text-cyan-400 capitalize">{dominant[0]} ({Math.round(dominant[1] * 100)}%)</strong></span>
        </span>
      </div>

      {/* 3 Weight Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        
        {/* Face */}
        <div className={`p-3.5 rounded-xl border text-center transition-all duration-200 ${
          dominant[0] === 'face' 
            ? 'bg-cyan-500/10 border-cyan-400 dark:border-cyan-400/80 ring-1 ring-cyan-400/30' 
            : 'bg-slate-50 dark:bg-[#0F141C] border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-center gap-1 text-xs font-heading font-bold text-slate-600 dark:text-slate-400 mb-1">
            <Camera className="w-3.5 h-3.5" />
            <span>Face</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white">
            {facePct}%
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-600 ease-out" 
              style={{ 
                width: `${facePct}%`,
                backgroundColor: dominant[0] === 'face' ? '#00E5FF' : '#64748B'
              }} 
            />
          </div>
        </div>

        {/* Voice */}
        <div className={`p-3.5 rounded-xl border text-center transition-all duration-200 ${
          dominant[0] === 'audio' 
            ? 'bg-cyan-500/10 border-cyan-400 dark:border-cyan-400/80 ring-1 ring-cyan-400/30' 
            : 'bg-slate-50 dark:bg-[#0F141C] border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-center gap-1 text-xs font-heading font-bold text-slate-600 dark:text-slate-400 mb-1">
            <Mic className="w-3.5 h-3.5" />
            <span>Voice</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white">
            {audioPct}%
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-600 ease-out" 
              style={{ 
                width: `${audioPct}%`,
                backgroundColor: dominant[0] === 'audio' ? '#00E5FF' : '#64748B'
              }} 
            />
          </div>
        </div>

        {/* Text */}
        <div className={`p-3.5 rounded-xl border text-center transition-all duration-200 ${
          dominant[0] === 'text' 
            ? 'bg-cyan-500/10 border-cyan-400 dark:border-cyan-400/80 ring-1 ring-cyan-400/30' 
            : 'bg-slate-50 dark:bg-[#0F141C] border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-center gap-1 text-xs font-heading font-bold text-slate-600 dark:text-slate-400 mb-1">
            <Type className="w-3.5 h-3.5" />
            <span>Text</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white">
            {textPct}%
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-600 ease-out" 
              style={{ 
                width: `${textPct}%`,
                backgroundColor: dominant[0] === 'text' ? '#00E5FF' : '#64748B'
              }} 
            />
          </div>
        </div>

      </div>

      {/* Cross-attention heatmap */}
      {attentionMatrix && attentionMatrix.length === 3 && (
        <div className="mt-2 p-3.5 rounded-xl bg-slate-100/90 dark:bg-[#111622] border border-slate-200 dark:border-cyan-900/40">
          <div className="text-[11px] font-heading font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center justify-between">
            <span>Inter-Modality Attention Map (Q × Kᵀ / √d):</span>
            <span className="text-[10px] text-cyan-500 dark:text-cyan-400 font-mono">[Face, Voice, Text]</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
            {attentionMatrix.map((row, rIdx) =>
              row.map((val, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 font-bold transition-all hover:scale-105 cursor-default"
                  style={{
                    backgroundColor: `rgba(2, 132, 199, ${Math.max(0.12, val * 0.95)})`,
                    color: val > 0.35 ? '#ffffff' : undefined,
                  }}
                  title={`Attention from ${['Face', 'Voice', 'Text'][rIdx]} to ${['Face', 'Voice', 'Text'][cIdx]}: ${(val * 100).toFixed(1)}%`}
                >
                  {(val * 100).toFixed(0)}%
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
