from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    device: str
    models_loaded: Dict[str, bool]
    version: str = "1.0.0"


class BoundingBox(BaseModel):
    x: int
    y: int
    w: int
    h: int


class SinglePredictionResponse(BaseModel):
    modality: str
    emotion: str
    confidence: float
    probabilities: Dict[str, float]
    face_detected: Optional[bool] = None
    bounding_box: Optional[BoundingBox] = None


class TextPredictionRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text utterance to evaluate")


class IndividualPrediction(BaseModel):
    emotion: str
    confidence: float
    probabilities: Dict[str, float]
    bounding_box: Optional[BoundingBox] = None


class MultimodalPredictionResponse(BaseModel):
    emotion: str
    confidence: float
    probabilities: Dict[str, float]
    modality_weights: Dict[str, float]
    cross_attention_matrix: List[List[float]]
    modalities_present: List[str]
    context_active: bool
    individual_predictions: Dict[str, Any]
