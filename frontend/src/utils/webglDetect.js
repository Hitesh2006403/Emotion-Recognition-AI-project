/**
 * Fast, fail-safe WebGL availability detector.
 * Returns true if WebGL context can be successfully initialized, false otherwise.
 */
export function isWebGLAvailable() {
  try {
    if (typeof window === 'undefined') return false;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return Boolean(window.WebGLRenderingContext && gl);
  } catch (e) {
    return false;
  }
}

export function isReducedMotionPreferred() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
