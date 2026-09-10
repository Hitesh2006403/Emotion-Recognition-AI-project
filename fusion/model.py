import torch
import torch.nn as nn
import torch.nn.functional as F


class GatedMultimodalFusionModel(nn.Module):
    """
    Gated Multimodal Fusion Network combining 512-dim face and 512-dim audio embeddings.
    Dynamically learns per-feature gate weights to prioritize reliable modalities
    and handle single-modality fallback smoothly.
    """

    def __init__(self, embedding_dim: int = 512, hidden_dim: int = 256, num_classes: int = 7):
        super().__init__()
        self.embedding_dim = embedding_dim
        self.num_classes = num_classes

        # Modality Gating Unit
        self.gate_layer = nn.Sequential(
            nn.Linear(embedding_dim * 2, embedding_dim),
            nn.Sigmoid()
        )

        # Classification MLP Head
        self.classifier = nn.Sequential(
            nn.Linear(embedding_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.3),
            nn.Linear(hidden_dim, num_classes)
        )

    def forward(self, face_embedding: torch.Tensor, audio_embedding: torch.Tensor, return_details: bool = False):
        """
        Forward pass.

        Args:
            face_embedding: Tensor of shape (batch_size, 512)
            audio_embedding: Tensor of shape (batch_size, 512)
            return_details: If True, return (logits, fused_embedding, gate)

        Returns:
            logits: (batch_size, num_classes)
        """
        # Ensure 2D tensor
        if face_embedding.ndim == 1:
            face_embedding = face_embedding.unsqueeze(0)
        if audio_embedding.ndim == 1:
            audio_embedding = audio_embedding.unsqueeze(0)

        # Concatenate for gating decision
        combined = torch.cat([face_embedding, audio_embedding], dim=1)
        gate = self.gate_layer(combined)  # values in [0, 1]

        # Fused embedding: gated interpolation
        fused_embedding = gate * face_embedding + (1.0 - gate) * audio_embedding

        # Classify through MLP
        logits = self.classifier(fused_embedding)

        if return_details:
            return logits, fused_embedding, gate
        return logits
