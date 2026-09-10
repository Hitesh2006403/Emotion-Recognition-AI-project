import React from 'react';
import { GalaxyStarfieldScene } from './GalaxyStarfieldScene';
import { AuroraIntelligenceScene } from './AuroraIntelligenceScene';

export function EmotionCoreScene({ isDark = true, reducedMotion = false }) {
  if (isDark) {
    return <GalaxyStarfieldScene reducedMotion={reducedMotion} />;
  }
  return <AuroraIntelligenceScene reducedMotion={reducedMotion} />;
}

export default EmotionCoreScene;
