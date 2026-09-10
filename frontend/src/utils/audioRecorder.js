/**
 * Web Audio API Recorder & 16kHz PCM WAV Encoder.
 * Captures microphone input, downsamples to 16kHz mono, and provides a real-time AnalyserNode.
 */

export class AudioRecorder {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.analyser = null;
    this.processor = null;
    this.pcmChunks = [];
    this.sampleRate = 16000;
    this.isRecording = false;
  }

  async start() {
    this.pcmChunks = [];
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContextClass();
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    source.connect(this.analyser);

    // Buffer size 4096 gives ~85ms buffer at 48kHz
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.analyser.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    const inputSampleRate = this.audioContext.sampleRate;

    this.processor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const inputData = e.inputBuffer.getChannelData(0);
      // Downsample to 16000 Hz
      const downsampled = this._downsample(inputData, inputSampleRate, this.sampleRate);
      this.pcmChunks.push(downsampled);
    };

    this.isRecording = true;
  }

  getAnalyser() {
    return this.analyser;
  }

  stop() {
    return new Promise((resolve) => {
      this.isRecording = false;

      if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
      }
      if (this.analyser) {
        this.analyser.disconnect();
      }
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => track.stop());
        this.mediaStream = null;
      }

      // Merge PCM chunks
      const totalLength = this.pcmChunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const mergedPcm = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of this.pcmChunks) {
        mergedPcm.set(chunk, offset);
        offset += chunk.length;
      }

      const wavBlob = this._encodeWAV(mergedPcm, this.sampleRate);
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
      }

      resolve(wavBlob);
    });
  }

  _downsample(buffer, fromRate, toRate) {
    if (fromRate === toRate) {
      return new Float32Array(buffer);
    }
    const sampleRateRatio = fromRate / toRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  _encodeWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    /* RIFF identifier */
    this._writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    this._writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    this._writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw PCM = 1) */
    view.setUint16(20, 1, true);
    /* channel count (mono = 1) */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 2, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 2, true);
    /* bits per sample (16-bit) */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    this._writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    // Convert float32 in [-1, 1] to signed 16-bit PCM integer
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(offset, s, true);
      offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  _writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
