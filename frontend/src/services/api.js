const API_BASE_URL = 'http://127.0.0.1:8000';

export async function getHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Health check failed:', err);
    return null;
  }
}

export async function predictFace(fileOrBlob) {
  const formData = new FormData();
  formData.append('file', fileOrBlob, 'face.jpg');

  const res = await fetch(`${API_BASE_URL}/api/predict/face`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Prediction failed' }));
    throw new Error(errorData.detail || 'Face prediction failed');
  }

  return await res.json();
}

export async function predictAudio(fileOrBlob) {
  const formData = new FormData();
  formData.append('file', fileOrBlob, 'audio.wav');

  const res = await fetch(`${API_BASE_URL}/api/predict/audio`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Prediction failed' }));
    throw new Error(errorData.detail || 'Audio prediction failed');
  }

  return await res.json();
}

export async function predictText(text) {
  const res = await fetch(`${API_BASE_URL}/api/predict/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Prediction failed' }));
    throw new Error(errorData.detail || 'Text prediction failed');
  }

  return await res.json();
}

export async function predictMultimodal({ face, audio, text, useContext = false }) {
  const formData = new FormData();
  if (face) {
    formData.append('face', face, 'face.jpg');
  }
  if (audio) {
    formData.append('audio', audio, 'audio.wav');
  }
  if (text && text.trim()) {
    formData.append('text', text.trim());
  }
  formData.append('use_context', useContext ? 'true' : 'false');

  const res = await fetch(`${API_BASE_URL}/api/predict/multimodal`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Prediction failed' }));
    throw new Error(errorData.detail || 'Multimodal prediction failed');
  }

  return await res.json();
}

export async function resetContext() {
  const res = await fetch(`${API_BASE_URL}/api/context/reset`, {
    method: 'POST',
  });
  return await res.json();
}
