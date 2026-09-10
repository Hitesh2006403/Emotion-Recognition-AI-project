import React, { useRef, useState } from 'react';

export function InteractiveButton({
  children,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  tiltEnabled = true,
  rippleEnabled = true,
  ...props
}) {
  const buttonRef = useRef(null);
  const rafRef = useRef(null);
  const [ripples, setRipples] = useState([]);

  const handleMouseMove = (e) => {
    if (!tiltEnabled || disabled || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    // Snappy subtle tilt: max ~3.5 degrees
    const rotX = -y * 6.5;
    const rotY = x * 6.5;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      if (!buttonRef.current) return;
      // Instant reaction during movement (no transition delay fighting cursor)
      buttonRef.current.style.transition = 'none';
      buttonRef.current.style.transform = `perspective(400px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    if (!tiltEnabled || !buttonRef.current) return;
    // Spring damped return only on exit
    buttonRef.current.style.transition = 'transform 0.28s var(--ease-spring)';
    buttonRef.current.style.transform = 'perspective(400px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  const handleClick = (e) => {
    if (disabled) return;

    if (rippleEnabled && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;
      const newRipple = {
        id: Date.now() + Math.random(),
        x: x - size / 2,
        y: y - size / 2,
        size
      };
      setRipples((prev) => [...prev.slice(-3), newRipple]);
    }

    if (onClick) {
      onClick(e);
    }
  };

  const removeRipple = (id) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`btn-tilt ripple-container btn-press cursor-pointer relative select-none ${className}`}
      {...props}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          onAnimationEnd={() => removeRipple(ripple.id)}
          className="ripple-effect"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
          }}
        />
      ))}
      <span className="relative z-1 flex items-center justify-center gap-2 pointer-events-none w-full h-full">
        {children}
      </span>
    </button>
  );
}

export default InteractiveButton;
