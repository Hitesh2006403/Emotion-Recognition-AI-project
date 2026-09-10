import os
import numpy as np
import torch
import torch.nn.functional as F

from .model import TextEmotionEncoder
from .dataset import TextFeatureExtractor, CLASS_NAMES

DEFAULT_CHECKPOINT = "./checkpoints/best_text_encoder.pth"


class TextEmotionPredictor:
    """
    Inference Predictor for Text Emotion Recognition.
    Produces 512-dim embedding vectors and 7-class emotion predictions.
    """

    def __init__(self, checkpoint_path: str = DEFAULT_CHECKPOINT, device: str = "cpu"):
        self.device = torch.device(device)
        self.model = TextEmotionEncoder(input_dim=384, embedding_dim=512, num_classes=7).to(self.device)
        self.extractor = TextFeatureExtractor(device=device)
        self.is_trained = False

        if os.path.exists(checkpoint_path):
            state_dict = torch.load(checkpoint_path, map_location=self.device)
            self.model.load_state_dict(state_dict)
            self.is_trained = True
            print(f"[TextEmotionPredictor] Loaded checkpoint from {checkpoint_path}")
        else:
            print(f"[TextEmotionPredictor] WARNING: Checkpoint '{checkpoint_path}' not found. Initialized with untrained weights.")

        self.model.eval()

    def get_embedding(self, text: str) -> np.ndarray:
        """
        Extract the 512-dimensional text emotion embedding.
        Args:
            text: Input string (sentence or utterance)
        Returns:
            np.ndarray of shape (512,), float32
        """
        raw_feat = self.extractor.extract_feature(text)
        tensor_in = torch.from_numpy(raw_feat).unsqueeze(0).to(self.device)

        with torch.no_grad():
            emb = self.model.get_embedding(tensor_in).squeeze(0).cpu().numpy()

        return emb.astype(np.float32)

    def predict(self, text: str) -> dict:
        """
        Predict emotion probabilities for an input text.
        Args:
            text: Input string
        Returns:
            dict containing:
                'emotion': str
                'confidence': float
                'probabilities': dict[str, float]
        """
        if not text or not text.strip():
            # Graceful fallback for empty/whitespace input
            probs = {name: 1.0 / len(CLASS_NAMES) for name in CLASS_NAMES}
            probs["neutral"] = 0.94
            # renormalize
            total = sum(probs.values())
            probs = {k: v / total for k, v in probs.items()}
            return {
                "emotion": "neutral",
                "confidence": float(probs["neutral"]),
                "probabilities": {k: float(v) for k, v in probs.items()},
            }

        raw_feat = self.extractor.extract_feature(text)
        tensor_in = torch.from_numpy(raw_feat).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(tensor_in)
            probs = F.softmax(logits, dim=1).squeeze(0).cpu().numpy()

        best_idx = int(np.argmax(probs))
        return {
            "emotion": CLASS_NAMES[best_idx],
            "confidence": float(probs[best_idx]),
            "probabilities": {CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))},
        }
