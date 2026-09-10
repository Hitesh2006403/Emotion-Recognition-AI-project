import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, Upload, RefreshCw, AlertCircle, Check, Sparkles } from 'lucide-react';

export function WebcamCapture({ onCapture, initialPreview = null, title = "Facial Input" }) {
  const [streamActive, setStreamActive] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState(initialPreview);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreamActive(true);
      setCapturedUrl(null);
    } catch (err) {
      console.error('Webcam error:', err);
      setCameraError('Camera access was denied or no video device was detected. Please allow camera permissions or upload an image file.');
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      setCapturedUrl(url);
      stopCamera();
      if (onCapture) {
        onCapture(blob, url);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    const url = URL.createObjectURL(file);
    setCapturedUrl(url);
    if (onCapture) {
      onCapture(file, url);
    }
  };

  const clearCapture = () => {
    setCapturedUrl(null);
    if (onCapture) {
      onCapture(null, null);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </label>
        <div className="flex items-center gap-2">
          {!streamActive ? (
            <button
              type="button"
              onClick={startCamera}
              className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 shadow-xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Use Webcam</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Turn Off</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Camera Error Alert */}
      {cameraError && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Media Viewport */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#090D14] border border-slate-200 dark:border-slate-800 shadow-inner flex items-center justify-center group">
        {streamActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-mono font-semibold flex items-center gap-1.5 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Live Video Stream</span>
            </div>
            <div className="absolute bottom-4 inset-x-0 flex justify-center">
              <button
                type="button"
                onClick={takeSnapshot}
                className="btn-press px-5 py-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-heading font-black shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Snapshot</span>
              </button>
            </div>
          </>
        ) : capturedUrl ? (
          <div className="relative w-full h-full group">
            <img
              src={capturedUrl}
              alt="Captured face preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 flex gap-1.5">
              <button
                type="button"
                onClick={clearCapture}
                className="btn-press p-2 rounded-xl bg-black/70 text-white hover:bg-rose-600 shadow-md cursor-pointer transition-colors"
                title="Remove photo"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-white text-xs font-mono font-semibold flex items-center gap-1.5 border border-slate-700">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Face Frame Ready</span>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500 group-hover:text-slate-300 transition-colors duration-200">
              <Camera className="w-7 h-7" />
            </div>
            <p className="text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
              No face frame loaded
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Click <strong>Use Webcam</strong> to preview & capture, or <strong>Upload</strong> an image.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
