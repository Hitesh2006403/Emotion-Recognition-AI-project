import React, { useState, useRef } from 'react';
import { Mic, Upload, Zap, Sparkles, AlertCircle, Volume2 } from 'lucide-react';
import { AudioInputControl } from './AudioInputControl';
import { EmotionChart } from './EmotionChart';
import { predictAudio } from '../services/api';
import { getEmotionMeta } from '../utils/emotionTheme';
import { SpotlightCard } from './common/SpotlightCard';
import { InteractiveButton } from './common/InteractiveButton';
import { VoiceWaveCursor } from './common/VoiceWaveCursor';

export function AudioStudio() {
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);

  const handleAudioReady = (blob, url) => {
    setAudioBlob(blob);
    setAudioUrl(url);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!audioBlob) {
      setError('Please record audio from your microphone or upload a .wav audio clip first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await predictAudio(audioBlob);
      setResult(res);
    } catch (err) {
      console.error('Audio analysis error:', err);
      setError(err.message || 'Audio analysis failed. Verify backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const meta = result ? getEmotionMeta(result.emotion) : null;

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 bg-voice-waves relative">
      <VoiceWaveCursor containerRef={containerRef} />
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1.5">
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
            Speech Emotion Acoustics Lab
          </h2>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#151C28] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
            Log-Mel Spectrogram CNN (Phase 2B)
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
          Extracts 128-channel Log-Mel Spectrogram features from 16kHz speech waveforms to classify vocal pitch, cadence, and acoustic arousal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Audio Input & Record with Magnetic Spotlight */}
        <div className="lg:col-span-6 space-y-4">
          <SpotlightCard className="p-6 sm:p-7 space-y-5">
            <AudioInputControl
              onAudioReady={handleAudioReady}
              initialPreview={audioUrl}
              title="Microphone Recording or WAV Upload"
            />

            <InteractiveButton
              onClick={handleAnalyze}
              disabled={loading || !audioBlob}
              className={`w-full py-3.5 rounded-xl font-heading font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 transition-colors duration-200 ${
                !audioBlob
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : loading
                  ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/20 cursor-wait'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-500/20 cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Computing Mel Spectrogram Features...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-950" />
                  <span>Analyze Speech Emotion</span>
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
                    <span>Acoustic Classifier Output</span>
                  </span>
                  <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#151C28] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    128-Mel FFT Window
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
                  title="Speech Emotion Probabilities"
                />
              </SpotlightCard>

            </div>
          ) : (
            <SpotlightCard className="p-14 text-center text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#111622] border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                <Mic className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="font-heading font-bold text-slate-800 dark:text-slate-200 text-sm">
                No Audio Speech Prediction Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Record a brief voice clip or upload a `.wav` file, then click <strong>Analyze Speech Emotion</strong>.
              </p>
            </SpotlightCard>
          )}
        </div>

      </div>

    </div>
  );
}
