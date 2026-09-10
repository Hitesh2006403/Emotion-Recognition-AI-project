import torch
import torch.nn as nn
import torch.nn.functional as F


class CrossModalAttentionFusionModel(nn.Module):
    """
    Context-Aware Cross-Modal Multi-Head Attention Fusion Architecture.
    
    Accepts three 512-dimensional embeddings:
      1. Face embedding (v ∈ R^512)
      2. Audio embedding (a ∈ R^512)
      3. Text embedding (t ∈ R^512)
      
    Pipeline:
      - Adds learnable modality type embeddings to identify modality identity
      - Multi-Head Self/Cross-Modal Attention across the 3 modality tokens (4 heads)
      - Residual connection & LayerNorm
      - Dynamic Modality Scoring (computes adaptive importance weights per modality)
      - Optional Temporal Context blending (affective momentum)
      - Classification MLP head -> 7 emotion classes
    """

    def __init__(
        self,
        embedding_dim: int = 512,
        num_heads: int = 4,
        hidden_dim: int = 256,
        num_classes: int = 7,
        dropout: float = 0.2,
    ):
        super(CrossModalAttentionFusionModel, self).__init__()
        self.embedding_dim = embedding_dim
        self.num_heads = num_heads
        self.num_classes = num_classes

        # Learnable modality type embeddings: [Face, Audio, Text]
        self.modality_embeddings = nn.Parameter(torch.randn(1, 3, embedding_dim) * 0.02)

        # Cross-modal Multi-Head Attention
        self.mha = nn.MultiheadAttention(
            embed_dim=embedding_dim,
            num_heads=num_heads,
            batch_first=True,
            dropout=0.1,
        )
        self.attn_dropout = nn.Dropout(0.1)
        self.norm1 = nn.LayerNorm(embedding_dim)

        # Feed-Forward transformation per token
        self.ffn = nn.Sequential(
            nn.Linear(embedding_dim, embedding_dim * 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(embedding_dim * 2, embedding_dim),
        )
        self.norm2 = nn.LayerNorm(embedding_dim)

        # Dynamic Modality Importance Scorer
        self.modality_scorer = nn.Sequential(
            nn.Linear(embedding_dim, 128),
            nn.Tanh(),
            nn.Linear(128, 1),
        )

        # Context Gate and Integration
        self.context_gate = nn.Linear(embedding_dim * 2, embedding_dim)
        self.context_proj = nn.Linear(embedding_dim, embedding_dim)
        self.context_norm = nn.LayerNorm(embedding_dim)

        # 7-Class Emotion Classification Head
        self.classifier = nn.Sequential(
            nn.Linear(embedding_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, num_classes),
        )

    def forward(
        self,
        face_emb: torch.Tensor,
        audio_emb: torch.Tensor,
        text_emb: torch.Tensor,
        context_emb: torch.Tensor = None,
        return_details: bool = False,
    ):
        """
        Forward pass with cross-modal attention and optional context.
        Args:
            face_emb: (batch_size, 512) tensor
            audio_emb: (batch_size, 512) tensor
            text_emb: (batch_size, 512) tensor
            context_emb: (batch_size, 512) optional temporal context tensor
            return_details: bool, if True returns (logits, modality_weights, attn_weights)
        """
        # Ensure 2D (B, 512)
        if face_emb.dim() == 1:
            face_emb = face_emb.unsqueeze(0)
        if audio_emb.dim() == 1:
            audio_emb = audio_emb.unsqueeze(0)
        if text_emb.dim() == 1:
            text_emb = text_emb.unsqueeze(0)

        # Stack tokens: (B, 3, 512)
        tokens = torch.stack([face_emb, audio_emb, text_emb], dim=1)

        # Add modality identity embeddings
        tokens = tokens + self.modality_embeddings

        # Cross-Modal Multi-Head Attention
        attn_out, attn_weights = self.mha(tokens, tokens, tokens, need_weights=True)
        tokens = self.norm1(tokens + self.attn_dropout(attn_out))

        # Position-wise FFN
        tokens = self.norm2(tokens + self.ffn(tokens))

        # Dynamic Modality Weighting (Importance pooling)
        scores = self.modality_scorer(tokens)  # (B, 3, 1)
        modality_weights = F.softmax(scores, dim=1)  # (B, 3, 1)

        # Weighted sum of attended tokens
        fused = torch.sum(tokens * modality_weights, dim=1)  # (B, 512)

        # Optional Temporal Context Blending
        if context_emb is not None:
            if context_emb.dim() == 1:
                context_emb = context_emb.unsqueeze(0)
            gate = torch.sigmoid(self.context_gate(torch.cat([fused, context_emb], dim=-1)))
            fused = self.context_norm(fused + gate * self.context_proj(context_emb))

        # Final Classification
        logits = self.classifier(fused)

        if return_details:
            return logits, modality_weights.squeeze(-1), attn_weights

        return logits
