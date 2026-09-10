import torch
import torch.nn as nn
import torch.nn.functional as F


class TextEmotionEncoder(nn.Module):
    """
    Text Emotion Recognition Projection Network.
    Projects 384-dim dense transformer embeddings (from all-MiniLM-L6-v2) into
    the standardized 512-dimensional multimodal latent space, followed by a 7-class head.
    """

    def __init__(self, input_dim: int = 384, embedding_dim: int = 512, num_classes: int = 7, dropout: float = 0.2):
        super(TextEmotionEncoder, self).__init__()
        self.input_dim = input_dim
        self.embedding_dim = embedding_dim
        self.num_classes = num_classes
        self.is_trained = False

        self.projection = nn.Sequential(
            nn.Linear(input_dim, embedding_dim),
            nn.LayerNorm(embedding_dim),
            nn.GELU(),
            nn.Dropout(dropout)
        )

        self.classifier = nn.Sequential(
            nn.Linear(embedding_dim, 256),
            nn.LayerNorm(256),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(256, num_classes)
        )

    def get_embedding(self, x: torch.Tensor) -> torch.Tensor:
        """
        Extract the standardized 512-dimensional embedding vector.
        Args:
            x: Input tensor of shape (batch_size, 384) or (384,)
        Returns:
            Tensor of shape (batch_size, 512)
        """
        if x.dim() == 1:
            x = x.unsqueeze(0)
        return self.projection(x)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass returning 7-class emotion logits.
        Args:
            x: Input tensor of shape (batch_size, 384)
        Returns:
            Logits tensor of shape (batch_size, 7)
        """
        if x.dim() == 1:
            x = x.unsqueeze(0)
        emb = self.projection(x)
        logits = self.classifier(emb)
        return logits
