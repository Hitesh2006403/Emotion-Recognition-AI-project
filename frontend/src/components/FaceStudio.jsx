import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Zap, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { WebcamCapture } from './WebcamCapture';
import { EmotionChart } from './EmotionChart';
import { predictFace } from '../services/api';
import { getEmotionMeta } from '../utils/emotionTheme';
import { SpotlightCard } from './common/SpotlightCard';
import { InteractiveButton } from './common/InteractiveButton';
import { FaceScanCursor } from './common/FaceScanCursor';

export function FaceStudio() {
  const [imageBlob, setImageBlob] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const handleCapture = (blob, url) => {
    setImageBlob(blob);
    setImageUrl(url);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!imageBlob) {
      setError('Please take a webcam snapshot or upload a face image first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await predictFace(imageBlob);
      setResult(res);
    } catch (err) {
      console.error('Face analysis error:', err);
      setError(err.message || 'Face analysis failed. Verify backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Draw bounding box if returned by backend
  useEffect(() => {
    if (!result || !imageUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      if (result.bounding_box) {
        const { x, y, w, h } = result.bounding_box;
        ctx.lineWidth = Math.max(3, Math.round(canvas.width / 150));
        ctx.strokeStyle = '#F59E0B'; // Solar Amber
        ctx.strokeRect(x, y, w, h);

        // Draw tag
        ctx.fillStyle = '#F59E0B';
        const fontSize = Math.max(14, Math.round(canvas.width / 35));
        ctx.font = `bold ${fontSize}px sans-serif`;
        const text = `${result.emotion.toUpperCase()} (${(result.confidence * 100).toFixed(0)}%)`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(x, Math.max(0, y - fontSize - 8), textWidth + 12, fontSize + 8);
        ctx.fillStyle = '#080B10';
        ctx.fillText(text, x + 6, Math.max(fontSize, y - 6));
      }
    };
  }, [result, imageUrl]);

  const meta = result ? getEmotionMeta(result.emotion) : null;

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 bg-face-scan relative">
      <FaceScanCursor containerRef={containerRef} />
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1.5">
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
            Facial Emotion Recognition Lab
          </h2>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#151C28] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
            ResNet-18 (Phase 1)
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
          Extracts facial action unit cues using our 512-dim ResNet-18 convolutional backbone with automated Haar cascade face localization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Image Input & Capture with Magnetic Spotlight */}
        <div className="lg:col-span-6 space-y-4">
          <SpotlightCard className="p-6 sm:p-7 space-y-5">
            <WebcamCapture
              onCapture={handleCapture}
              initialPreview={imageUrl}
              title="Camera Capture or Upload"
            />

            <InteractiveButton
              onClick={handleAnalyze}
              disabled={loading || !imageBlob}
              className={`w-full py-3.5 rounded-xl font-heading font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 transition-colors duration-200 ${
                !imageBlob
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : loading
                  ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/20 cursor-wait'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-500/20 cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Classifying Facial Action Units...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-950" />
                  <span>Analyze Facial Emotion</span>
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

        {/* Right Column: Prediction & Bounding Box Overlay */}
        <div className="lg:col-span-6 space-y-6">
          {result ? (
            <div className="space-y-6 animate-reveal-spring">
              
              {/* Highlight Card */}
              <SpotlightCard className="p-6 border-2 shadow-xl relative overflow-hidden" style={{ borderColor: meta.color }}>
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" style={{ backgroundColor: `${meta.color}15` }} />

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Visual Classifier Output</span>
                  </span>
                  <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#151C28] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    {result.face_detected ? 'Face Detected & Cropped' : 'Full Image Evaluated'}
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

              {/* Bounding Box Visualizer Canvas */}
              {result.bounding_box && (
                <SpotlightCard className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                    <span>Haar Cascade Face Bounding Box</span>
                    <span className="text-[11px]">
                      x:{result.bounding_box.x}, y:{result.bounding_box.y}, {result.bounding_box.w}×{result.bounding_box.h}
                    </span>
                  </div>
                  <canvas ref={canvasRef} className="w-full max-h-64 object-contain rounded-xl bg-[#080B10] border border-slate-200 dark:border-slate-800" />
                </SpotlightCard>
              )}

              {/* 7-Class Probabilities */}
              <SpotlightCard className="p-6 shadow-md">
                <EmotionChart
                  probabilities={result.probabilities}
                  predictedEmotion={result.emotion}
                  confidence={result.confidence}
                  title="Facial Emotion Probabilities"
                />
              </SpotlightCard>

            </div>
          ) : (
            <SpotlightCard className="p-14 text-center text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#111622] border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                <Camera className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="font-heading font-bold text-slate-800 dark:text-slate-200 text-sm">
                No Facial Prediction Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Capture a photo using your webcam or upload a facial image, then click <strong>Analyze Facial Emotion</strong>.
              </p>
            </SpotlightCard>
          )}
        </div>

      </div>

    </div>
  );
}
