import traceback
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .schemas import (
    HealthResponse,
    SinglePredictionResponse,
    TextPredictionRequest,
    MultimodalPredictionResponse,
)
from .service import EmotionRecognitionService

app = FastAPI(
    title="Trimodal Emotion Recognition API",
    description="REST API for Facial Expression, Speech Acoustics, and Natural Language Emotion Recognition with Cross-Modal Attention Fusion.",
    version="1.0.0",
)

# Enable CORS for frontend local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service reference
service: EmotionRecognitionService = None


def get_service() -> EmotionRecognitionService:
    global service
    if service is None:
        service = EmotionRecognitionService.get_instance()
    return service


@app.on_event("startup")
def startup_event():
    get_service()


@app.get("/api/health", response_model=HealthResponse)
def health_check():
    srv = get_service()
    return HealthResponse(
        status="healthy",
        device=srv.device,
        models_loaded={
            "face": srv.face_predictor.model is not None,
            "audio": srv.audio_predictor.is_trained,
            "text": srv.text_predictor.is_trained,
            "fusion_v2": srv.fusion_predictor.is_trained,
        },
        version="1.0.0",
    )


@app.post("/api/predict/face", response_model=SinglePredictionResponse)
async def predict_face(file: UploadFile = File(...)):
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty image file received.")
        srv = get_service()
        result = srv.predict_face(content)
        return result

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predict/audio", response_model=SinglePredictionResponse)
async def predict_audio(file: UploadFile = File(...)):
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty audio file received.")
        srv = get_service()
        result = srv.predict_audio(content, filename=file.filename or "sample.wav")
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predict/text", response_model=SinglePredictionResponse)
async def predict_text(payload: TextPredictionRequest):
    try:
        srv = get_service()
        result = srv.predict_text(payload.text)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predict/multimodal", response_model=MultimodalPredictionResponse)
async def predict_multimodal(
    face: UploadFile = File(None),
    audio: UploadFile = File(None),
    text: str = Form(None),
    use_context: bool = Form(False),
):
    try:
        face_bytes = await face.read() if face is not None else None
        audio_bytes = await audio.read() if audio is not None else None
        audio_filename = audio.filename if audio is not None else "audio.wav"

        srv = get_service()
        result = srv.predict_multimodal(
            image_bytes=face_bytes,
            audio_bytes=audio_bytes,
            audio_filename=audio_filename,
            text_str=text,
            use_context=use_context,
        )
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/context/reset")
def reset_context():
    try:
        srv = get_service()
        return srv.reset_context()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/assets/confusion_matrix.png")
def get_confusion_matrix():
    import os
    from fastapi.responses import FileResponse
    cm_path = os.path.abspath("checkpoints/confusion_matrix.png")
    if os.path.exists(cm_path):
        return FileResponse(cm_path, media_type="image/png")
    raise HTTPException(status_code=404, detail="Confusion matrix image not found.")


# Mount built React frontend if available
import os
from fastapi.staticfiles import StaticFiles

frontend_dist = os.path.abspath("frontend/dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=False)

