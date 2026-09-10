"""
Context-Aware Cross-Modal Attention Fusion Module (Phase 5).
Combines Face (512-dim), Audio (512-dim), and Text (512-dim) embeddings using
Multi-Head Cross-Modal Attention, dynamic modality weighting, and temporal context modeling.
"""

from .model import CrossModalAttentionFusionModel
from .predictor import MultimodalPredictorV2, TemporalContextBuffer, CLASS_NAMES

__all__ = [
    "CrossModalAttentionFusionModel",
    "MultimodalPredictorV2",
    "TemporalContextBuffer",
    "CLASS_NAMES",
]
