"""
Text Emotion Recognition Module.
Provides TextEmotionEncoder, TextEmotionPredictor, and preprocessing pipeline
utilizing lightweight sentence transformer embeddings projected into 512-dim space.
"""

from .model import TextEmotionEncoder
from .predictor import TextEmotionPredictor, CLASS_NAMES

__all__ = ["TextEmotionEncoder", "TextEmotionPredictor", "CLASS_NAMES"]
