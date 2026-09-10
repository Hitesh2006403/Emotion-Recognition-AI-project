import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Camera, 
  Mic, 
  Type,
  Activity,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { WebcamCapture } from './WebcamCapture';
import { AudioInputControl } from './AudioInputControl';
import { EmotionChart } from './EmotionChart';
import { AttentionWeightsGauge } from './AttentionWeightsGauge';
import { predictMultimodal, resetContext } from '../services/api';
import { getEmotionMeta, CLASS_NAMES } from '../utils/emotionTheme';
import { SpotlightCard } from './common/SpotlightCard';
import { InteractiveButton } from './common/InteractiveButton';

export function MultimodalStudio() {
  // Input states
  const [faceBlob, setFaceBlob] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [textVal, setTextVal] = useState('');
  const [useContext, setUseContext] = useState(false);

  // Analysis states
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Text presets for rapid demonstration
  const presets = [
    { label: 'Happy', text: 'I am so incredibly happy and proud of our breakthrough!' },
    { label: 'Angry', text: 'This is completely unacceptable and infuriating!' },
    { label: 'Fear', text: 'I have a terrifying feeling that everything is about to collapse.' },
    { label: 'Surprise', text: 'Wait, what?! I had no idea that was possible!' },
    { label: 'Neutral', text: 'The scheduled project report was submitted on time.' },
    { label: 'Sad', text: 'I feel completely heartbroken and sorrowful today.' },
  ];

  // Modality count calculation
  const activeCount = (faceBlob ? 1 : 0) + (audioBlob ? 1 : 0) + (textVal.trim() ? 1 : 0);

  const handleAnalyze = async () => {
    if (activeCount === 0) {
      setError('Please provide at least ONE modality (Face image/camera, Audio clip/recording, or Text utterance).');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await predictMultimodal({
        face: faceBlob,
        audio: audioBlob,
        text: textVal,
        useContext: useContext,
      });

      setResult(res);

      // Trigger celebratory confetti if high confidence
      if (res.confidence > 0.85) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } catch (err) {
      console.error('Multimodal prediction error:', err);
      setError(err.message || 'Failed to analyze multimodal affect. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetContext = async () => {
    try {
      await resetContext();
      alert('Temporal affect history buffer has been reset to equilibrium.');
    } catch (e) {
      console.error(e);
    }
  };

  const clearAll = () => {
    setFaceBlob(null);
    setAudioBlob(null);
    setTextVal('');
    setResult(null);
    setError(null);
  };

  const emotionMeta = result ? getEmotionMeta(result.emotion) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 bg-multimodal-composite relative">
      
      {/* Header & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
              Trimodal Cross-Modal Studio
            </h2>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#151C28] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
              Interactive Lab
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
            Simultaneously evaluates Vision (Face), Acoustics (Voice), and Semantics (Text) with graceful single-modality fallback.
          </p>
        </div>

        {/* Active Modalities Counter Pill */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#0F141C] border border-slate-200 dark:border-slate-800 shadow-xs text-xs font-semibold">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-slate-800 dark:text-slate-200 font-mono">{activeCount} / 3 Active</span>
          </div>
          {result && (
            <button
              onClick={clearAll}
              className="btn-press p-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#0F141C] border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer"
              title="Reset all inputs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Input Panels Grid (Calm Neutral Chrome with Magnetic Spotlight) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Panel 1: Face */}
        <SpotlightCard className="p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-heading font-bold text-sm">
            <Camera className="w-4 h-4 text-slate-400" />
            <span>1. Visual Modality (Face)</span>
          </div>
          <WebcamCapture
            onCapture={(blob) => setFaceBlob(blob)}
            title="Webcam or Photo"
          />
        </SpotlightCard>

        {/* Panel 2: Voice */}
        <SpotlightCard className="p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-heading font-bold text-sm">
            <Mic className="w-4 h-4 text-slate-400" />
            <span>2. Acoustic Modality (Speech)</span>
          </div>
          <AudioInputControl
            onAudioReady={(blob) => setAudioBlob(blob)}
            title="Microphone or WAV File"
          />
        </SpotlightCard>

        {/* Panel 3: Text */}
        <SpotlightCard className="p-6 sm:p-7 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-heading font-bold text-sm">
                <Type className="w-4 h-4 text-slate-400" />
                <span>3. Language Modality (Text)</span>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-400">
                {textVal.length} chars
              </span>
            </div>

            <textarea
              rows={4}
              value={textVal}
              onChange={(e) => setTextVal(e.target.value)}
              placeholder="Type or paste a spoken utterance / conversational phrase..."
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-[#090D14] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner resize-none font-normal"
            />

            {/* Presets */}
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick Sample Presets:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setTextVal(p.text)}
                    className="btn-press px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-[#151C28] hover:bg-slate-200 dark:hover:bg-[#1C2536] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Temporal buffer toggle */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useContext}
                onChange={(e) => setUseContext(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 cursor-pointer"
              />
              <span>Temporal Affect Smoothing (EMA)</span>
            </label>
            {useContext && (
              <button
                type="button"
                onClick={handleResetContext}
                className="text-[11px] font-mono font-semibold text-slate-400 hover:text-cyan-400 underline cursor-pointer"
              >
                Reset EMA
              </button>
            )}
          </div>
        </SpotlightCard>

      </div>

      {/* Central Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
        <InteractiveButton
          onClick={handleAnalyze}
          disabled={loading || activeCount === 0}
          className={`w-full sm:w-auto px-10 py-4 rounded-xl font-heading font-black text-sm shadow-md flex items-center justify-center gap-3 transition-colors duration-200 ${
            activeCount === 0
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-700'
              : loading
              ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/20 cursor-wait'
              : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-500/20 cursor-pointer'
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              <span>Cross-Modal Attention Computing...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-slate-950" />
              <span>Analyze Multimodal Affect ({activeCount} / 3 Modalities Active)</span>
            </>
          )}
        </InteractiveButton>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-8 mt-12 pt-10 border-t border-slate-200 dark:border-slate-800 animate-reveal-spring">
          
          {/* Main Fused Prediction Card with Magnetic Spotlight */}
          <SpotlightCard 
            className="p-6 sm:p-8 border-2 relative overflow-hidden shadow-xl" 
            style={{ borderColor: emotionMeta.color }}
          >
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" style={{ backgroundColor: `${emotionMeta.color}15` }} />
            
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Emotion Callout */}
              <div className="lg:col-span-5 text-center lg:text-left space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-slate-100 dark:bg-[#151C28] border border-slate-200 dark:border-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Fused Multimodal Prediction</span>
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-5">
                  <span className="text-7xl sm:text-8xl drop-shadow-sm transition-transform duration-200 cursor-default">
                    {emotionMeta.emoji}
                  </span>
                  <div>
                    <h3 className="text-3xl sm:text-5xl font-heading font-black capitalize text-slate-900 dark:text-white tracking-tight">
                      {emotionMeta.label}
                    </h3>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                      Confidence: <strong className="text-slate-900 dark:text-white text-lg font-black font-mono">{(result.confidence * 100).toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {emotionMeta.description}
                </p>

                {/* Modality pill tags */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
                  <span className="text-xs text-slate-400 font-mono font-semibold mr-1">Active:</span>
                  {result.modalities_present.map((m) => (
                    <span
                      key={m}
                      className="text-xs uppercase font-mono font-semibold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-[#151C28] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                    >
                      {m}
                    </span>
                  ))}
                  {result.context_active && (
                    <span className="text-xs uppercase font-mono font-semibold px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      EMA Context Active
                    </span>
                  )}
                </div>
              </div>

              {/* Center Column: Attention Weights */}
              <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 lg:pl-6">
                <AttentionWeightsGauge
                  weights={result.modality_weights}
                  attentionMatrix={result.cross_attention_matrix}
                  modalitiesPresent={result.modalities_present}
                />
              </div>

              {/* Right Column: 7-Class Probabilities */}
              <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 lg:pl-6">
                <EmotionChart
                  probabilities={result.probabilities}
                  predictedEmotion={result.emotion}
                  confidence={result.confidence}
                  title="Trimodal Probability Distribution"
                />
              </div>

            </div>
          </SpotlightCard>

          {/* Individual Modalities Breakdown Grid */}
          {result.individual_predictions && Object.keys(result.individual_predictions).length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Individual Modality Standalone Predictions (Prior to Cross-Modal Attention)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['face', 'audio', 'text'].map((mod) => {
                  const pred = result.individual_predictions[mod];
                  if (!pred) {
                    return (
                      <SpotlightCard key={mod} className="p-5 text-center text-slate-400 opacity-60">
                        <span className="text-xs font-medium capitalize">{mod} Channel: Inactive</span>
                      </SpotlightCard>
                    );
                  }
                  const meta = getEmotionMeta(pred.emotion);
                  return (
                    <SpotlightCard key={mod} hoverEffect={true} className="p-5 space-y-2 border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="capitalize flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          {mod === 'face' && <Camera className="w-4 h-4 text-slate-400" />}
                          {mod === 'audio' && <Mic className="w-4 h-4 text-slate-400" />}
                          {mod === 'text' && <Type className="w-4 h-4 text-slate-400" />}
                          <span>{mod} Standalone</span>
                        </span>
                        <span className="text-slate-900 dark:text-white font-mono font-bold">
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{meta.emoji}</span>
                        <span className="font-heading font-bold text-sm capitalize text-slate-900 dark:text-white">
                          {meta.label}
                        </span>
                      </div>
                      {pred.bounding_box && (
                        <div className="text-[11px] text-slate-400 font-mono bg-slate-100 dark:bg-[#090D14] p-1.5 rounded">
                          Face BBox: [{pred.bounding_box.x}, {pred.bounding_box.y}, {pred.bounding_box.w}, {pred.bounding_box.h}]
                        </div>
                      )}
                    </SpotlightCard>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
