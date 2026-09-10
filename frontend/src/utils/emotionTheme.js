/**
 * Direction 1: "Neural Synapse" Emotion Theming System
 * Chromatic Valence-Arousal Spectrum with geometric affect motifs.
 */

export const EMOTIONS = {
  angry: {
    name: 'angry',
    label: 'Angry',
    emoji: '😡',
    motif: 'Hot Crimson',
    valence: -0.72,
    arousal: 0.85,
    color: '#E11D48',
    bgLight: 'bg-rose-50 text-rose-800 border-rose-200',
    bgDark: 'dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900/60',
    barColor: 'bg-[#E11D48]',
    accentBorder: 'border-[#E11D48]',
    description: 'High arousal, negative valence characterized by brow furrowing and sharp acoustic energy.',
  },
  disgust: {
    name: 'disgust',
    label: 'Disgust',
    emoji: '🤢',
    motif: 'Viridian Emerald',
    valence: -0.60,
    arousal: 0.40,
    color: '#16A34A',
    bgLight: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    bgDark: 'dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/60',
    barColor: 'bg-[#16A34A]',
    accentBorder: 'border-[#16A34A]',
    description: 'Moderate arousal, negative valence marked by visceral aversion and mid-frequency formants.',
  },
  fear: {
    name: 'fear',
    label: 'Fear',
    emoji: '😨',
    motif: 'Ionized Violet',
    valence: -0.65,
    arousal: 0.78,
    color: '#9333EA',
    bgLight: 'bg-purple-50 text-purple-800 border-purple-200',
    bgDark: 'dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-900/60',
    barColor: 'bg-[#9333EA]',
    accentBorder: 'border-[#9333EA]',
    description: 'High arousal apprehension marked by widened eyes, elevated fundamental frequency, and alert state.',
  },
  happy: {
    name: 'happy',
    label: 'Happy',
    emoji: '😊',
    motif: 'Solar Amber',
    valence: 0.85,
    arousal: 0.65,
    color: '#F59E0B',
    bgLight: 'bg-amber-50 text-amber-900 border-amber-200',
    bgDark: 'dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/60',
    barColor: 'bg-[#F59E0B]',
    accentBorder: 'border-[#F59E0B]',
    description: 'High positive valence marked by bilateral zygomatic smile and bright, melodic vocal harmonics.',
  },
  neutral: {
    name: 'neutral',
    label: 'Neutral',
    emoji: '😐',
    motif: 'Polar Slate',
    valence: 0.00,
    arousal: 0.10,
    color: '#64748B',
    bgLight: 'bg-slate-100 text-slate-800 border-slate-300',
    bgDark: 'dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700/60',
    barColor: 'bg-[#64748B]',
    accentBorder: 'border-[#64748B]',
    description: 'Equilibrium baseline characterized by relaxed facial musculature and steady fundamental frequency.',
  },
  sad: {
    name: 'sad',
    label: 'Sad',
    emoji: '😢',
    motif: 'Storm Slate-Blue',
    valence: -0.80,
    arousal: 0.15,
    color: '#476685',
    bgLight: 'bg-slate-100 text-slate-800 border-slate-300',
    bgDark: 'dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800',
    barColor: 'bg-[#476685]',
    accentBorder: 'border-[#476685]',
    description: 'Low arousal negative valence marked by lip corner depression, downward gaze, and slow speech cadence.',
  },
  surprise: {
    name: 'surprise',
    label: 'Surprise',
    emoji: '😲',
    motif: 'Shockwave Magenta',
    valence: 0.20,
    arousal: 0.92,
    color: '#EC4899',
    bgLight: 'bg-pink-50 text-pink-800 border-pink-200',
    bgDark: 'dark:bg-pink-950/40 dark:text-pink-200 dark:border-pink-900/60',
    barColor: 'bg-[#EC4899]',
    accentBorder: 'border-[#EC4899]',
    description: 'Maximum arousal novelty response marked by eyebrow elevation, open jaw, and vocal pitch surge.',
  },
};

export const CLASS_NAMES = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise'];

export function getEmotionMeta(emotionName) {
  if (!emotionName) return EMOTIONS.neutral;
  const key = emotionName.toLowerCase();
  return EMOTIONS[key] || EMOTIONS.neutral;
}
