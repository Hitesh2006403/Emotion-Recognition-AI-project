import React, { useEffect, useRef, useState } from 'react';

export function VoiceWaveCursor({ containerRef }) {
  const [waves, setWaves] = useState([]);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleMouseMove = (e) => {
      const now = performance.now();
      // Throttle wave creation to every 90ms for gentle ripple rhythm
      if (now - lastTimeRef.current < 90) return;
      lastTimeRef.current = now;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newWave = {
        id: now + Math.random(),
        x,
        y,
      };

      setWaves((prev) => [...prev.slice(-4), newWave]);
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [containerRef]);

  const removeWave = (id) => {
    setWaves((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
      {waves.map((wave) => (
        <span
          key={wave.id}
          onAnimationEnd={() => removeWave(wave.id)}
          className="absolute rounded-full border border-cyan-400/25 animate-ping-once pointer-events-none"
          style={{
            left: `${wave.x - 30}px`,
            top: `${wave.y - 30}px`,
            width: '60px',
            height: '60px',
            animation: 'acousticRipple 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
          }}
        />
      ))}
    </div>
  );
}

export default VoiceWaveCursor;
