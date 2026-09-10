import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, RefreshCw, Volume2, Check, AlertCircle } from 'lucide-react';
import { AudioRecorder } from '../utils/audioRecorder';

export function AudioInputControl({ onAudioReady, initialPreview = null, title = "Acoustic / Voice Input" }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(initialPreview);
  const [error, setError] = useState(null);

  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      stopRecording();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const recorder = new AudioRecorder();
      await recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);
      setAudioUrl(null);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 10) {
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);

      // Start live canvas visualizer
      visualizeWaveform(recorder.getAnalyser());
    } catch (err) {
      console.error('Audio recording failed:', err);
      setError('Microphone access denied or unavailable. Please check system permissions or upload a .wav file.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (recorderRef.current && isRecording) {
      const wavBlob = await recorderRef.current.stop();
      recorderRef.current = null;
      setIsRecording(false);

      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
      if (onAudioReady) {
        onAudioReady(wavBlob, url);
      }
    }
  };

  const visualizeWaveform = (analyser) => {
    if (!analyser || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#080B10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#00F2FE';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00F2FE';
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopRecording();
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    if (onAudioReady) {
      onAudioReady(file, url);
    }
  };

  const clearAudio = () => {
    setAudioUrl(null);
    if (onAudioReady) {
      onAudioReady(null, null);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </label>
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 shadow-xs cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Record Mic</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop ({recordSeconds}s)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Upload WAV</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/wav,audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Visualizer / Playback Viewport */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#090D14] border border-slate-200 dark:border-slate-800 shadow-inner flex items-center justify-center p-4 group">
        {isRecording ? (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
            <canvas ref={canvasRef} width={400} height={140} className="w-full h-28 rounded-xl" />
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800/60 text-rose-300 text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Recording Speech: {recordSeconds}s / 10s max</span>
            </div>
          </div>
        ) : audioUrl ? (
          <div className="w-full text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-300">
              <Volume2 className="w-6 h-6" />
            </div>
            <audio src={audioUrl} controls className="w-full max-w-xs mx-auto h-10 rounded-lg shadow-sm" />
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-200 text-xs font-mono font-semibold flex items-center gap-1.5 border border-slate-700">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> 16kHz WAV Audio Ready
              </span>
              <button
                type="button"
                onClick={clearAudio}
                className="btn-press p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Remove audio clip"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500 group-hover:text-slate-300 transition-colors duration-200">
              <Mic className="w-7 h-7" />
            </div>
            <p className="text-xs font-bold text-slate-300 mb-1">
              No audio speech loaded
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Click <strong>Record Mic</strong> to speak aloud, or <strong>Upload WAV</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
