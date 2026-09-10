import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EmotionCoreScene } from './EmotionCoreScene';
import { isReducedMotionPreferred } from '../../utils/webglDetect';

export function EmotionCoreCanvas({ className = '', eventSource = null }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.documentElement.classList.contains('dark');
  });

  const [reducedMotion, setReducedMotion] = useState(() => isReducedMotionPreferred());

  // Watch for theme changes on <html> class
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Watch for reduced-motion media changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return (
    <div className={`w-full h-full relative select-none bg-transparent ${className}`}>
      <Canvas
        eventSource={eventSource || undefined}
        camera={{ position: [0, 0, 5.2], fov: 45 }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0); // Pure transparent clear color
        }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.8} />
        <EmotionCoreScene isDark={isDark} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}

export default EmotionCoreCanvas;
