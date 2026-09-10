import React, { useRef } from 'react';

export function SpotlightCard({ 
  children, 
  className = '', 
  hoverEffect = false,
  spotlightColor = null,
  onClick,
  ...props 
}) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
    cardRef.current.style.setProperty('--spotlight-opacity', '1');
    if (spotlightColor) {
      cardRef.current.style.setProperty('--spotlight-color', spotlightColor);
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--spotlight-opacity', '0');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`spotlight-card ${hoverEffect ? 'glass-card-hover' : 'glass-card'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default SpotlightCard;
