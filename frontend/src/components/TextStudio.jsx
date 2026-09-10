import React, { useState, useRef } from 'react';
import { Type, Zap, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { EmotionChart } from './EmotionChart';
import { predictText } from '../services/api';
import { getEmotionMeta } from '../utils/emotionTheme';
import { SpotlightCard } from './common/SpotlightCard';
import { InteractiveButton } from './common/InteractiveButton';
import { TextTokenCursor } from './common/TextTokenCursor';

export function TextStudio() {
  const [text, setText] = useState('I am incredibly thrilled and proud of our breakthrough today!');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);

  const presets = [
    { label: 'Happy', text: 'I am overjoyed and so grateful for this marvelous news!' },
    { label: 'Angry', text: 'This blatant injustice is absolutely unacceptable and infuriating!' },
    { label: 'Fear', text: 'I have a terrifying feeling that everything is about to collapse.' },
    { label: 'Surprise', text: 'Are you serious?! I never in a million years imagined this!' },
    { label: 'Neutral', text: 'The documentation files were updated in the repository.' },
    { label: 'Sad', text: 'I feel deeply exhausted, helpless, and sorrowful.' },
    { label: 'Disgust', text: 'That repulsive smell made me completely nauseous.' },
  ];

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter a sentence or utterance to analyze.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await predictText(text);
      setResult(res);
    } catch (err) {
      console.error('Text analysis error:', err);
      setError(err.message || 'Text analysis failed. Verify backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const meta = result ? getEmotionMeta(result.emotion) : null;

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 bg-text-grid relative">
      <TextTokenCursor containerRef={containerRef} />
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1.5">
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
            Natural Language Emotion Lab
          </h2>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#151C28] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
            all-MiniLM-L6-v2 + MLP (Phase 4)
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
          Encodes conversational utterances and sentences into 512-dim affect embeddings using distilled self-attention transformers trained on GoEmotions Ekman mappings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Text Input & Presets with Magnetic Spotlight */}
        <div className="lg:col-span-6 space-y-4">
          <SpotlightCard className="p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Utterance Input
              </label>
              <span className="text-xs font-mono font-semibold text-slate-400">
                {text.length} characters
              </span>
            </div>

            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type an emotional phrase, exclamation, or conversational sentence..."
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-[#090D14] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner resize-none font-normal leading-relaxed"
            />

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                One-Click Emotion Prompts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setText(p.text)}
                    className="btn-press px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-[#151C28] hover:bg-slate-200 dark:hover:bg-[#1C2536] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <InteractiveButton
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
              className={`w-full py-3.5 rounded-xl font-heading font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 transition-colors duration-200 ${
                !text.trim()
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : loading
                  ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/20 cursor-wait'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-500/20 cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Computing MiniLM Transformer Embeddings...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-950" />
                  <span>Analyze Text Emotion</span>
                </>
              )}
            </InteractiveButton>
          </SpotlightCard>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Column: Prediction Results */}
        <div className="lg:col-span-6 space-y-6">
          {result ? (
            <div className="space-y-6 animate-reveal-spring">
              
              {/* Highlight Card */}
              <SpotlightCard className="p-6 border-2 shadow-xl relative overflow-hidden" style={{ borderColor: meta.color }}>
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" style={{ backgroundColor: `${meta.color}15` }} />

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Language Classifier Output</span>
                  </span>
                  <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#151C28] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    all-MiniLM-L6-v2
                  </span>
                </div>

                <div className="flex items-center gap-5 mb-4">
                  <span className="text-6xl sm:text-7xl drop-shadow-md transition-transform duration-200 cursor-default">
                    {meta.emoji}
                  </span>
                  <div>
                    <h3 className="text-3xl sm:text-4xl font-heading font-black capitalize text-slate-900 dark:text-white tracking-tight">
                      {meta.label}
                    </h3>
                    <p className="text-sm font-bold text-slate-500 mt-1">
                      Confidence: <strong className="text-slate-900 dark:text-white text-base font-black font-mono">{(result.confidence * 100).toFixed(1)}%</strong>
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {meta.description}
                </p>
              </SpotlightCard>

              {/* 7-Class Probabilities */}
              <SpotlightCard className="p-6 shadow-md">
                <EmotionChart
                  probabilities={result.probabilities}
                  predictedEmotion={result.emotion}
                  confidence={result.confidence}
                  title="Text Emotion Probabilities"
                />
              </SpotlightCard>

            </div>
          ) : (
            <SpotlightCard className="p-14 text-center text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#111622] border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                <Type className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="font-heading font-bold text-slate-800 dark:text-slate-200 text-sm">
                No Text Prediction Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Type or select a sample emotional phrase, then click <strong>Analyze Text Emotion</strong>.
              </p>
            </SpotlightCard>
          )}
        </div>

      </div>

    </div>
  );
}
