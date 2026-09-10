import os
from collections import deque
import numpy as np
import torch
import torch.nn.functional as F

from face.predictor import FaceEmotionPredictor, CLASS_NAMES
from audio.predictor import AudioEmotionPredictor
from text.predictor import TextEmotionPredictor
from .model import CrossModalAttentionFusionModel

DEFAULT_CHECKPOINT = "./checkpoints/best_fusion_v2_model.pth"


class TemporalContextBuffer:
    """
    Maintains a rolling temporal history of multimodal emotion states.
    Computes exponential moving average (EMA) to simulate affective momentum.
    """

    def __init__(self, buffer_size: int = 5, decay: float = 0.75):
        self.buffer_size = buffer_size
        self.decay = decay
        self.history = deque(maxlen=buffer_size)

    def add(self, state: np.ndarray or torch.Tensor):
        if isinstance(state, torch.Tensor):
            state = state.detach().cpu().numpy()
        self.history.append(state.copy())

    def get_context(self) -> np.ndarray or None:
        if not self.history:
            return None
        weights = [self.decay ** (len(self.history) - 1 - i) for i in range(len(self.history))]
        total_w = sum(weights)
        weights = [w / total_w for w in weights]
        context = np.zeros_like(self.history[0])
        for w, s in zip(weights, self.history):
            context += w * s
        return context.astype(np.float32)

    def reset(self):
        self.history.clear()


class MultimodalPredictorV2:
    """
    Context-Aware Cross-Modal Attention Predictor.
    Integrates Face, Audio, and Text modalities with dynamic attention and temporal smoothing.
    """

    def __init__(self, checkpoint_path: str = DEFAULT_CHECKPOINT, device: str = "cpu"):
        self.device = torch.device(device)
        self.face_predictor = FaceEmotionPredictor(device=device)
        self.audio_predictor = AudioEmotionPredictor()
        self.text_predictor = TextEmotionPredictor(device=device)

        self.model = CrossModalAttentionFusionModel(
            embedding_dim=512, num_heads=4, hidden_dim=256, num_classes=7
        ).to(self.device)
        self.context_buffer = TemporalContextBuffer(buffer_size=5, decay=0.75)
        self.is_trained = False

        if os.path.exists(checkpoint_path):
            state_dict = torch.load(checkpoint_path, map_location=self.device)
            self.model.load_state_dict(state_dict)
            self.is_trained = True
            print(f"[MultimodalPredictorV2] Loaded attention fusion checkpoint from {checkpoint_path}")
        else:
            print(f"[MultimodalPredictorV2] WARNING: Checkpoint '{checkpoint_path}' not found. Initialized with untrained weights.")

        self.model.eval()

    def predict(
        self,
        face_img: np.ndarray = None,
        audio_path: str = None,
        text_str: str = None,
        use_context: bool = False,
    ) -> dict:
        """
        Multimodal inference with cross-modal attention.
        Args:
            face_img: Grayscale face image (48x48 np.ndarray) or None
            audio_path: Path to WAV audio file or None
            text_str: Text string or None
            use_context: Whether to apply temporal context smoothing
        """
        modalities_present = []

        # 1. Face embedding
        if face_img is not None:
            face_emb = self.face_predictor.get_embedding(face_img)
            modalities_present.append("face")
        else:
            face_emb = np.zeros((512,), dtype=np.float32)

        # 2. Audio embedding
        if audio_path is not None and os.path.exists(audio_path):
            audio_emb = self.audio_predictor.get_embedding(audio_path)
            modalities_present.append("audio")
        else:
            audio_emb = np.zeros((512,), dtype=np.float32)

        # 3. Text embedding
        if text_str is not None and text_str.strip():
            text_emb = self.text_predictor.get_embedding(text_str)
            modalities_present.append("text")
        else:
            text_emb = np.zeros((512,), dtype=np.float32)

        if not modalities_present:
            return {
                "emotion": "neutral",
                "confidence": 1.0 / 7.0,
                "probabilities": {name: 1.0 / 7.0 for name in CLASS_NAMES},
                "modality_weights": {"face": 0.333, "audio": 0.333, "text": 0.334},
                "cross_attention_matrix": [[0.333]*3]*3,
                "modalities_present": [],
                "context_active": False,
            }

        t_face = torch.from_numpy(face_emb).unsqueeze(0).to(self.device)
        t_audio = torch.from_numpy(audio_emb).unsqueeze(0).to(self.device)
        t_text = torch.from_numpy(text_emb).unsqueeze(0).to(self.device)

        ctx_tensor = None
        if use_context:
            ctx_np = self.context_buffer.get_context()
            if ctx_np is not None:
                ctx_tensor = torch.from_numpy(ctx_np).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits, mod_weights, attn_weights = self.model(
                t_face, t_audio, t_text, context_emb=ctx_tensor, return_details=True
            )
            probs = F.softmax(logits, dim=1).squeeze(0).cpu().numpy()

        best_idx = int(np.argmax(probs))
        mod_w = mod_weights.squeeze(0).cpu().numpy()
        attn_m = attn_weights.squeeze(0).cpu().numpy().tolist()

        # Update context buffer with the fused instantaneous state
        with torch.no_grad():
            tokens = torch.stack([t_face, t_audio, t_text], dim=1) + self.model.modality_embeddings
            attended, _ = self.model.mha(tokens, tokens, tokens)
            normed = self.model.norm1(tokens + self.model.attn_dropout(attended))
            fused_state = torch.sum(normed * mod_weights.unsqueeze(-1), dim=1).squeeze(0).cpu().numpy()
            self.context_buffer.add(fused_state)

        return {
            "emotion": CLASS_NAMES[best_idx],
            "confidence": float(probs[best_idx]),
            "probabilities": {CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))},
            "modality_weights": {
                "face": float(mod_w[0]),
                "audio": float(mod_w[1]),
                "text": float(mod_w[2]),
            },
            "cross_attention_matrix": attn_m,
            "modalities_present": modalities_present,
            "context_active": use_context and (ctx_tensor is not None),
        }
