import os
import math
import numpy as np
import torch
import torch.nn.functional as F


class AudioProcessor:
    """
    Audio feature extractor converting raw audio into Log-Mel Spectrograms.
    Supports audio file paths, raw numpy arrays, and synthetic waveforms.
    """

    def __init__(
        self,
        sample_rate: int = 16000,
        duration: float = 3.0,
        n_mels: int = 128,
        n_fft: int = 512,
        hop_length: int = 375,
    ):
        self.sample_rate = sample_rate
        self.duration = duration
        self.target_samples = int(sample_rate * duration)
        self.n_mels = n_mels
        self.n_fft = n_fft
        self.hop_length = hop_length
        self.mel_basis = self._build_mel_filterbank()

    def _hz_to_mel(self, hz: np.ndarray) -> np.ndarray:
        return 2595.0 * np.log10(1.0 + hz / 700.0)

    def _mel_to_hz(self, mel: np.ndarray) -> np.ndarray:
        return 700.0 * (10.0 ** (mel / 2595.0) - 1.0)

    def _build_mel_filterbank(self) -> torch.Tensor:
        """Construct triangular Mel filterbank matrix of shape (n_mels, n_fft // 2 + 1)."""
        f_min = 0.0
        f_max = self.sample_rate / 2.0

        mel_min = self._hz_to_mel(np.array(f_min))
        mel_max = self._hz_to_mel(np.array(f_max))
        mel_pts = np.linspace(mel_min, mel_max, self.n_mels + 2)
        hz_pts = self._mel_to_hz(mel_pts)

        fft_bins = np.floor((self.n_fft + 1) * hz_pts / self.sample_rate).astype(int)

        n_bins = self.n_fft // 2 + 1
        weights = np.zeros((self.n_mels, n_bins), dtype=np.float32)

        for m in range(1, self.n_mels + 1):
            f_m_minus = fft_bins[m - 1]
            f_m = fft_bins[m]
            f_m_plus = fft_bins[m + 1]

            if f_m_minus != f_m:
                for k in range(f_m_minus, f_m):
                    if k < n_bins:
                        weights[m - 1, k] = (k - f_m_minus) / (f_m - f_m_minus)

            if f_m != f_m_plus:
                for k in range(f_m, f_m_plus):
                    if k < n_bins:
                        weights[m - 1, k] = (f_m_plus - k) / (f_m_plus - f_m)

        return torch.from_numpy(weights)

    def load_audio(self, source) -> np.ndarray:
        """
        Load audio from a filepath (str/Path) or process an in-memory numpy array.

        Args:
            source: Audio file path (str/Path) or numpy array of samples

        Returns:
            Numpy array of shape (target_samples,) normalized float32 in [-1.0, 1.0]
        """
        if source is None:
            raise ValueError("Empty audio source provided.")

        if isinstance(source, (str, os.PathLike)):
            if not os.path.exists(source):
                raise FileNotFoundError(f"Audio file not found: {source}")

            waveform, sr = self._read_wav_file(source)
        elif isinstance(source, np.ndarray):
            if source.size == 0:
                raise ValueError("Empty numpy array provided for audio.")
            waveform = source.astype(np.float32)
            sr = self.sample_rate
        elif isinstance(source, torch.Tensor):
            if source.numel() == 0:
                raise ValueError("Empty PyTorch tensor provided for audio.")
            waveform = source.detach().cpu().numpy().astype(np.float32)
            sr = self.sample_rate
        else:
            raise TypeError(f"Unsupported audio source type: {type(source)}")

        if waveform.ndim > 1:
            waveform = np.mean(waveform, axis=0)

        max_val = np.max(np.abs(waveform))
        if max_val > 1.0:
            waveform = waveform / max_val

        if sr != self.sample_rate:
            waveform = self._resample(waveform, sr, self.sample_rate)

        if len(waveform) < self.target_samples:
            pad_len = self.target_samples - len(waveform)
            waveform = np.pad(waveform, (0, pad_len), mode="constant")
        elif len(waveform) > self.target_samples:
            waveform = waveform[: self.target_samples]

        return waveform.astype(np.float32)

    def _read_wav_file(self, filepath: str):
        """Read a WAV file using scipy.io.wavfile or Python wave stdlib."""
        try:
            from scipy.io import wavfile
            sr, data = wavfile.read(filepath)
            if data.dtype == np.int16:
                data = data.astype(np.float32) / 32768.0
            elif data.dtype == np.int32:
                data = data.astype(np.float32) / 2147483648.0
            elif data.dtype == np.uint8:
                data = (data.astype(np.float32) - 128.0) / 128.0
            elif data.dtype == np.float32 or data.dtype == np.float64:
                data = data.astype(np.float32)
            return data, sr
        except Exception:
            import wave
            with wave.open(filepath, "rb") as wf:
                sr = wf.getframerate()
                nchannels = wf.getnchannels()
                sampwidth = wf.getsampwidth()
                nframes = wf.getnframes()
                frames = wf.readframes(nframes)

                if sampwidth == 2:
                    data = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
                elif sampwidth == 1:
                    data = (np.frombuffer(frames, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
                else:
                    data = np.frombuffer(frames, dtype=np.float32)

                if nchannels > 1:
                    data = data.reshape(-1, nchannels).T
            return data, sr

    def _resample(self, waveform: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
        """PyTorch vectorized C++ resampling for ultra-fast CPU processing."""
        if orig_sr == target_sr:
            return waveform
        duration = len(waveform) / float(orig_sr)
        target_num_samples = int(round(duration * target_sr))
        wave_tensor = torch.from_numpy(waveform).unsqueeze(0).unsqueeze(0)
        resampled_tensor = F.interpolate(
            wave_tensor,
            size=target_num_samples,
            mode="linear",
            align_corners=False,
        )
        return resampled_tensor.squeeze(0).squeeze(0).cpu().numpy().astype(np.float32)

    def extract_log_mel_spectrogram(self, source) -> torch.Tensor:
        """
        Extract Log-Mel Spectrogram tensor from audio source.

        Args:
            source: Audio file path, numpy array, or tensor

        Returns:
            Tensor of shape (1, 1, n_mels, 128)
        """
        waveform = self.load_audio(source)
        wave_tensor = torch.from_numpy(waveform)

        window = torch.hann_window(self.n_fft)
        stft = torch.stft(
            wave_tensor,
            n_fft=self.n_fft,
            hop_length=self.hop_length,
            win_length=self.n_fft,
            window=window,
            return_complex=True,
        )
        magnitude = torch.abs(stft) ** 2

        mel_spec = torch.matmul(self.mel_basis, magnitude)
        log_mel = torch.log1p(mel_spec)

        target_time_steps = 128
        if log_mel.shape[1] < target_time_steps:
            pad_amount = target_time_steps - log_mel.shape[1]
            log_mel = F.pad(log_mel, (0, pad_amount), mode="constant", value=0)
        elif log_mel.shape[1] > target_time_steps:
            log_mel = log_mel[:, :target_time_steps]

        mean = log_mel.mean()
        std = log_mel.std() + 1e-6
        normalized = (log_mel - mean) / std

        return normalized.unsqueeze(0).unsqueeze(0)

    @staticmethod
    def generate_synthetic_waveform(
        duration: float = 3.0,
        sample_rate: int = 16000,
        frequency: float = 440.0,
    ) -> np.ndarray:
        """
        Generate a synthetic sine wave waveform strictly for testing tensor pipeline shapes.

        Args:
            duration: Duration in seconds
            sample_rate: Audio sample rate in Hz
            frequency: Pitch frequency in Hz

        Returns:
            Float32 numpy array of shape (sample_rate * duration,)
        """
        t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
        sine_wave = 0.5 * np.sin(2 * np.pi * frequency * t)
        noise = 0.05 * np.random.randn(len(t))
        return (sine_wave + noise).astype(np.float32)
