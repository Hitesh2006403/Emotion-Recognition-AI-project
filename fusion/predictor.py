import os
import torch
import torch.nn.functional as F
import numpy as np

from face.predictor import FaceEmotionPredictor, CLASS_NAMES
from audio.predictor import AudioEmotionPredictor
from .model import GatedMultimodalFusionModel

DEFAULT_FUSION_CHECKPOINT = "./checkpoints/best_fusion_model.pth"


class MultimodalEmotionPredictor:
    """
    Unified Multimodal Emotion Recognition API combining Face and Audio.
    Supports:
      1. Joint Multimodal Prediction (Face + Audio)
      2. Face-only Single-Modality Fallback (audio=None or missing mic)
      3. Audio-only Single-Modality Fallback (face=None or occluded camera)
    """

    def __init__(
        self,
        fusion_checkpoint: str = None,
        face_checkpoint: str = None,
        audio_checkpoint: str = None,
        device: str = None,
        embedding_dim: int = 512,
        num_classes: int = 7,
    ):
        self.embedding_dim = embedding_dim
        self.num_classes = num_classes
        self.class_names = CLASS_NAMES

        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        # Initialize sub-predictors
        self.face_predictor = FaceEmotionPredictor(checkpoint_path=face_checkpoint, device=str(self.device))
        self.audio_predictor = AudioEmotionPredictor(checkpoint_path=audio_checkpoint, device=str(self.device))

        # Initialize Gated Fusion Model
        self.model = GatedMultimodalFusionModel(
            embedding_dim=self.embedding_dim,
            hidden_dim=256,
            num_classes=self.num_classes
        ).to(self.device)

        self.checkpoint_path = fusion_checkpoint or DEFAULT_FUSION_CHECKPOINT
        self.is_trained = False
        self._load_fusion_checkpoint()

    def _load_fusion_checkpoint(self):
        """Load trained fusion head weights if present on disk."""
        if self.checkpoint_path and os.path.exists(self.checkpoint_path):
            try:
                state_dict = torch.load(self.checkpoint_path, map_location=self.device)
                self.model.load_state_dict(state_dict)
                self.model.eval()
                self.is_trained = True
            except Exception as e:
                self.is_trained = False
                print(f"[WARNING] Could not load fusion checkpoint from {self.checkpoint_path}: {e}")
        else:
            self.model.eval()
            self.is_trained = False

    @torch.no_grad()
    def get_embeddings(self, face_image=None, audio_source=None) -> tuple:
        """
        Extract 512-dim embeddings for face and audio with zero-vector fallback.

        Returns:
            Tuple of (face_tensor, audio_tensor, modality_str)
        """
        if face_image is None and audio_source is None:
            raise ValueError("At least one modality (face_image or audio_source) must be provided.")

        if face_image is not None:
            face_vec = self.face_predictor.get_embedding(face_image)
            face_tensor = torch.from_numpy(face_vec).float().to(self.device)
        else:
            face_tensor = torch.zeros(self.embedding_dim, dtype=torch.float32, device=self.device)

        if audio_source is not None:
            audio_vec = self.audio_predictor.get_embedding(audio_source)
            audio_tensor = torch.from_numpy(audio_vec).float().to(self.device)
        else:
            audio_tensor = torch.zeros(self.embedding_dim, dtype=torch.float32, device=self.device)

        if face_image is not None and audio_source is not None:
            modality = "multimodal"
        elif face_image is not None:
            modality = "face_only"
        else:
            modality = "audio_only"

        return face_tensor, audio_tensor, modality

    @torch.no_grad()
    def predict(self, face_image=None, audio_source=None) -> dict:
        """
        Predict emotion from face, audio, or both.

        Args:
            face_image: Grayscale or BGR face crop numpy array (or None)
            audio_source: Audio file path or numpy waveform (or None)

        Returns:
            Dict containing predicted emotion, confidence, probabilities,
            fused embedding, and modality gate weights.
        """
        face_t, audio_t, modality = self.get_embeddings(face_image, audio_source)

        logits, fused_emb, gate = self.model(face_t, audio_t, return_details=True)
        probs = F.softmax(logits, dim=1).squeeze(0).cpu().numpy()

        pred_idx = int(np.argmax(probs))
        confidence = float(probs[pred_idx])

        # Compute average gate activation (weight assigned to face vs audio)
        mean_gate = float(gate.mean().item())

        return {
            "emotion": self.class_names[pred_idx],
            "confidence": confidence,
            "probabilities": {name: float(probs[i]) for i, name in enumerate(self.class_names)},
            "all_probs": probs,
            "modality": modality,
            "gate_weights": {
                "face_weight": mean_gate,
                "audio_weight": 1.0 - mean_gate,
            },
            "fused_embedding": fused_emb.squeeze(0).cpu().numpy(),
            "is_trained": self.is_trained,
        }

    def predict_batch(self, face_images: list = None, audio_sources: list = None) -> list:
        """Predict emotion for a list of paired or single-modality inputs."""
        count = max(len(face_images or []), len(audio_sources or []))
        results = []
        for i in range(count):
            face = face_images[i] if face_images and i < len(face_images) else None
            audio = audio_sources[i] if audio_sources and i < len(audio_sources) else None
            results.append(self.predict(face, audio))
        return results

    def get_fused_embedding(self, face_image=None, audio_source=None) -> np.ndarray:
        """Extract the 512-dim fused multimodal feature vector."""
        res = self.predict(face_image, audio_source)
        return res["fused_embedding"]


def create_multimodal_predictor(
    fusion_checkpoint: str = None,
    face_checkpoint: str = None,
    audio_checkpoint: str = None,
    device: str = None
) -> MultimodalEmotionPredictor:
    """Factory function to instantiate MultimodalEmotionPredictor with default settings."""
    return MultimodalEmotionPredictor(
        fusion_checkpoint=fusion_checkpoint,
        face_checkpoint=face_checkpoint,
        audio_checkpoint=audio_checkpoint,
        device=device
    )
