import React from 'react';
import { EMOTIONS, CLASS_NAMES, getEmotionMeta } from '../utils/emotionTheme';

export function EmotionChart({ probabilities = {}, predictedEmotion = '', confidence = 0, title = 'Emotion Probabilities' }) {
  // Sort classes by probability descending
  const sortedClasses = [...CLASS_NAMES].sort((a, b) => {
    return (probabilities[b] || 0) - (probabilities[a] || 0);
  });

  const topMeta = getEmotionMeta(predictedEmotion);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </h4>
        {predictedEmotion && (
          <span 
            className="text-xs font-heading font-bold px-3 py-1 rounded-full border shadow-xs flex items-center gap-1.5 transition-all"
            style={{ 
              borderColor: `${topMeta.color}80`, 
              backgroundColor: `${topMeta.color}15`,
              color: topMeta.color 
            }}
          >
            <span>Top:</span>
            <span>{topMeta.emoji}</span>
            <span className="capitalize">{topMeta.label}</span>
            <span className="font-mono font-bold">({((confidence || probabilities[predictedEmotion] || 0) * 100).toFixed(1)}%)</span>
          </span>
        )}
      </div>

      <div className="space-y-2">
        {sortedClasses.map((cls) => {
          const meta = EMOTIONS[cls] || EMOTIONS.neutral;
          const prob = probabilities[cls] || 0;
          const pct = Math.min(100, Math.max(0, prob * 100));
          const isTop = cls === predictedEmotion;

          return (
            <div 
              key={cls} 
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                isTop 
                  ? 'bg-slate-100/90 dark:bg-[#151C28] shadow-sm border' 
                  : 'opacity-70 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-[#111622]/60'
              }`}
              style={{
                borderColor: isTop ? `${meta.color}60` : 'transparent'
              }}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className={`flex items-center gap-2 ${
                  isTop ? 'text-slate-900 dark:text-white font-heading font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'
                }`}>
                  <span className="text-sm">{meta.emoji}</span>
                  <span className="capitalize">{meta.label}</span>
                  {isTop && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border" style={{ borderColor: `${meta.color}50`, backgroundColor: `${meta.color}15`, color: meta.color }}>
                      Valence {meta.valence > 0 ? `+${meta.valence}` : meta.valence} · Arousal {meta.arousal}
                    </span>
                  )}
                </span>
                <span className={`font-mono text-xs font-bold ${
                  isTop ? 'text-sm' : 'text-slate-500 dark:text-slate-400'
                }`}
                style={{ color: isTop ? meta.color : undefined }}
                >
                  {pct.toFixed(1)}%
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="h-2 w-full bg-slate-200/80 dark:bg-[#090D14] rounded-full overflow-hidden p-0.5 border border-slate-300/40 dark:border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-600 shadow-xs"
                  style={{ 
                    width: `${Math.max(2, pct)}%`,
                    backgroundColor: isTop ? meta.color : '#334155',
                    transitionTimingFunction: 'var(--ease-chart)'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
