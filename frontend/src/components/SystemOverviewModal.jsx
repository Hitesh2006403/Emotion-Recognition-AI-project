import React from 'react';
import { X, ExternalLink, BarChart3, ShieldAlert, BookOpen, Layers } from 'lucide-react';
import { SpotlightCard } from './common/SpotlightCard';
import { InteractiveButton } from './common/InteractiveButton';

export function SystemOverviewModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <SpotlightCard 
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl animate-reveal-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <InteractiveButton
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 dark:bg-[#111622] text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm border border-slate-200 dark:border-slate-800"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </InteractiveButton>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 dark:bg-cyan-950/80 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
              System Architecture & Formal Evaluation Benchmarks
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
            Literature-review-driven comparative evaluation conducted across 840 standardized validation triplets.
          </p>
        </div>

        {/* Table 1: Baseline Comparison */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>1. Baseline Architecture Comparison</span>
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-[#111622] text-slate-700 dark:text-slate-300 font-heading font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Architecture</th>
                  <th className="p-3.5">Active Channels</th>
                  <th className="p-3.5">Accuracy</th>
                  <th className="p-3.5">Macro F1</th>
                  <th className="p-3.5">Key Strength</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold">Face Standalone (ResNet-18)</td>
                  <td className="p-3.5 text-slate-500">Visual Image Crop</td>
                  <td className="p-3.5 font-mono">68.10%</td>
                  <td className="p-3.5 font-mono">68.12%</td>
                  <td className="p-3.5 text-slate-500">High facial valence fidelity</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold">Speech Standalone (4-Block CNN)</td>
                  <td className="p-3.5 text-slate-500">Log-Mel Spectrogram</td>
                  <td className="p-3.5 font-mono">56.43%</td>
                  <td className="p-3.5 font-mono">51.26%</td>
                  <td className="p-3.5 text-slate-500">Vocal arousal & intensity detection</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold">Text Standalone (MiniLM Head)</td>
                  <td className="p-3.5 text-slate-500">Utterance Text</td>
                  <td className="p-3.5 font-mono">53.57%</td>
                  <td className="p-3.5 font-mono">53.85%</td>
                  <td className="p-3.5 text-slate-500">Lexicon sentiment semantics</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold">Phase 3: Gated Bimodal</td>
                  <td className="p-3.5 text-slate-500">Face + Speech</td>
                  <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-semibold">81.55%</td>
                  <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-semibold">81.44%</td>
                  <td className="p-3.5 text-slate-500">Sigmoid dynamic feature gate</td>
                </tr>
                <tr className="bg-cyan-500/10 dark:bg-cyan-950/30 font-bold text-cyan-900 dark:text-cyan-200 border-l-4 border-cyan-500 dark:border-cyan-400">
                  <td className="p-3.5">Phase 5: Cross-Modal Attention</td>
                  <td className="p-3.5">Face + Voice + Text</td>
                  <td className="p-3.5 font-mono text-cyan-600 dark:text-cyan-400 text-sm font-bold">83.57%</td>
                  <td className="p-3.5 font-mono text-cyan-600 dark:text-cyan-400 text-sm font-bold">83.47%</td>
                  <td className="p-3.5">Optimal synergy (+15.47% over Face)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Confusion Matrix Viewer */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>2. Standardized Validation Confusion Matrix (840 Samples)</span>
          </h4>
          <div className="p-4 rounded-xl bg-[#080B10] flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner">
            <img
              src="/api/assets/confusion_matrix.png"
              alt="Model Confusion Matrix"
              className="max-h-72 object-contain rounded-lg shadow-md"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <p className="text-[11px] text-slate-400 mt-3 text-center font-medium font-mono">
              Evaluated on 120 held-out samples per class across all 7 universal emotions.
            </p>
          </div>
        </div>

        {/* Scientific Disclosures Alert */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#111622] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 shadow-sm">
          <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
            <ShieldAlert className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Academic Rigor & Scientific Limitations</span>
          </div>
          <p className="leading-relaxed">
            This system utilizes late semantic pseudo-pairing across independently sampled FER2013, RAVDESS, TESS, and GoEmotions benchmarks rather than micro-temporally synchronized naturalistic audio-visual recordings. Full disclosures are preserved in <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#080B10] font-mono text-cyan-600 dark:text-cyan-400">LIMITATIONS.md</code>.
          </p>
        </div>

      </SpotlightCard>
    </div>
  );
}
