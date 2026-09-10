import os
import torch
import torch.nn.functional as F
import numpy as np

from .model import AudioEmotionEncoder
from .dataset import AudioProcessor

CLASS_NAMES = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
DEFAULT_CHECKPOINT = "./checkpoints/best_audio_encoder.pth"


class AudioEmotionPredictor:
    """
    Audio Emotion Predictor API.
    Processes audio signals, outputs 512-dim embeddings, and exposes the `is_trained` status.
    Real emotion predictions are strictly prohibited until Phase 2B trained weights exist.
    """

    def __init__(
        self,
        checkpoint_path: str = None,
        device: str = None,
        num_classes: int = 7,
        embedding_dim: int = 512,
    ):
        """
        Initialize the audio emotion predictor.

        Args:
            checkpoint_path: Optional path to trained model checkpoint (.pth)
            device: 'cuda', 'cpu', or None for auto-detection
            num_classes: Number of emotion classes (default: 7)
            embedding_dim: Embedding dimension (default: 512)
        """
        self.checkpoint_path = checkpoint_path
        self.num_classes = num_classes
        self.embedding_dim = embedding_dim
        self.class_names = CLASS_NAMES

        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        self.processor = AudioProcessor()
        self.model = AudioEmotionEncoder(
            num_classes=self.num_classes,
            embedding_dim=self.embedding_dim
        ).to(self.device)

        self.is_trained = False
        self._load_model_if_available()

    def _load_model_if_available(self):
        """Load trained weights if checkpoint path is valid and exists."""
        target_checkpoint = self.checkpoint_path or DEFAULT_CHECKPOINT
        if target_checkpoint and os.path.exists(target_checkpoint):
            try:
                state_dict = torch.load(target_checkpoint, map_location=self.device)
                self.model.load_state_dict(state_dict)
                self.model.eval()
                self.is_trained = True
            except Exception as e:
                self.is_trained = False
                raise RuntimeError(f"Failed to load audio model checkpoint from {target_checkpoint}: {e}")
        else:
            self.model.eval()
            self.is_trained = False

    def preprocess(self, audio_source) -> torch.Tensor:
        """
        Preprocess audio input into a model tensor.

        Args:
            audio_source: File path (str), numpy array, or PyTorch tensor

        Returns:
            Tensor of shape (1, 1, 128, 128) on configured device
        """
        tensor = self.processor.extract_log_mel_spectrogram(audio_source)
        return tensor.to(self.device)

    @torch.no_grad()
    def get_embedding(self, audio_source) -> np.ndarray:
        """
        Extract the 512-dimensional feature embedding for audio input.

        Args:
            audio_source: File path (str), numpy array, or PyTorch tensor

        Returns:
            1D numpy array of shape (512,)
        """
        input_tensor = self.preprocess(audio_source)
        _, embedding = self.model(input_tensor, return_embedding=True)
        return embedding.squeeze(0).cpu().numpy()

    @torch.no_grad()
    def predict_proba(self, audio_source) -> np.ndarray:
        """
        Predict emotion probabilities for an audio sample.
        Requires trained weights (Phase 2B).

        Raises:
            RuntimeError: If is_trained is False (Phase 2A state)
        """
        if not self.is_trained:
            raise RuntimeError(
                "Audio model is not trained yet (is_trained=False). "
                "No valid checkpoint found at checkpoints/best_audio_encoder.pth. "
                "Real emotion predictions are unavailable until Phase 2B training."
            )

        input_tensor = self.preprocess(audio_source)
        logits = self.model(input_tensor)
        probs = F.softmax(logits, dim=1)
        return probs.squeeze(0).cpu().numpy()

    @torch.no_grad()
    def predict(self, audio_source) -> dict:
        """
        Predict emotion class and confidence dictionary.
        Requires trained weights (Phase 2B).

        Raises:
            RuntimeError: If is_trained is False (Phase 2A state)
        """
        probs = self.predict_proba(audio_source)
        pred_idx = int(np.argmax(probs))
        confidence = float(probs[pred_idx])

        return {
            "emotion": self.class_names[pred_idx],
            "confidence": confidence,
            "probabilities": {name: float(probs[i]) for i, name in enumerate(self.class_names)},
            "all_probs": probs,
        }

    def predict_batch(self, audio_sources: list) -> list:
        """
        Predict emotions for a list of audio inputs.

        Raises:
            RuntimeError: If is_trained is False (Phase 2A state)
        """
        if not self.is_trained:
            raise RuntimeError(
                "Audio model is not trained yet (is_trained=False). "
                "Real emotion predictions are unavailable until Phase 2B training."
            )
        return [self.predict(src) for src in audio_sources]


def create_audio_predictor(
    checkpoint_path: str = None,
    device: str = None
) -> AudioEmotionPredictor:
    """
    Factory function to create an AudioEmotionPredictor instance.

    Args:
        checkpoint_path: Optional checkpoint file path
        device: Optional device override ('cuda', 'cpu')

    Returns:
        Configured AudioEmotionPredictor instance
    """
    return AudioEmotionPredictor(
        checkpoint_path=checkpoint_path,
        device=device
    )
