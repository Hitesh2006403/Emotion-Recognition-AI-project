import React, { useEffect, useRef, useState } from 'react';

const TOKENS = ['·', 'T', 'λ', '0', '1', 'ψ', 'α', ' sentiment '];

export function TextTokenCursor({ containerRef }) {
  const [tokens, setTokens] = useState([]);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleMouseMove = (e) => {
      const now = performance.now();
      // Emit a tiny token particle every 110ms
      if (now - lastTimeRef.current < 110) return;
      lastTimeRef.current = now;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const char = TOKENS[Math.floor(Math.random() * TOKENS.length)];

      const newToken = {
        id: now + Math.random(),
        x: x + (Math.random() * 10 - 5),
        y: y + (Math.random() * 10 - 5),
        char,
      };

      setTokens((prev) => [...prev.slice(-5), newToken]);
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [containerRef]);

  const removeToken = (id) => {
    setTokens((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
      {tokens.map((token) => (
        <span
          key={token.id}
          onAnimationEnd={() => removeToken(token.id)}
          className="absolute font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-400 select-none pointer-events-none"
          style={{
            left: `${token.x}px`,
            top: `${token.y}px`,
            animation: 'tokenFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {token.char}
        </span>
      ))}
    </div>
  );
}

export default TextTokenCursor;
