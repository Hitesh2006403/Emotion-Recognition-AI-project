import React, { useEffect, useRef } from 'react';

export function FaceScanCursor({ containerRef }) {
  const lineRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (lineRef.current) {
          lineRef.current.style.transform = `translateY(${y}px)`;
          lineRef.current.style.opacity = '1';
        }
      });
    };

    const handleMouseLeave = () => {
      if (lineRef.current) {
        lineRef.current.style.opacity = '0';
      }
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [containerRef]);

  return (
    <div
      ref={lineRef}
      className="pointer-events-none absolute top-0 left-0 right-0 h-[1.5px] z-10 opacity-0 transition-opacity duration-300 will-change-transform"
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(0, 229, 255, 0.35) 50%, transparent 100%)',
        boxShadow: '0 0 12px 1px rgba(0, 229, 255, 0.25)',
      }}
    />
  );
}

export default FaceScanCursor;
