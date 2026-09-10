import os
import tempfile
import cv2
import numpy as np
import torch

from face.predictor import FaceEmotionPredictor
from audio.predictor import AudioEmotionPredictor
from text.predictor import TextEmotionPredictor
from fusion_v2.predictor import MultimodalPredictorV2


class EmotionRecognitionService:
    """
    Singleton service managing the AI predictors, CV face detection,
    and input normalization.
    """

    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        print("[EmotionRecognitionService] Initializing models on CPU...")
        self.device = "cpu"

        # 1. Initialize Face Predictor
        self.face_predictor = FaceEmotionPredictor(device=self.device)

        # 2. Initialize Audio Predictor
        self.audio_predictor = AudioEmotionPredictor(device=self.device)

        # 3. Initialize Text Predictor
        self.text_predictor = TextEmotionPredictor(device=self.device)

        # 4. Initialize Trimodal Attention Fusion Predictor
        self.fusion_predictor = MultimodalPredictorV2(device=self.device)

        # 5. Initialize OpenCV Haar Cascade Face Detector
        cascade_file = "haarcascade_frontalface_default.xml"
        if not os.path.exists(cascade_file) and hasattr(cv2, "data"):
            cascade_file = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self.face_cascade = cv2.CascadeClassifier(cascade_file)
        if self.face_cascade.empty():
            print(f"[EmotionRecognitionService] WARNING: Failed to load Haar cascade from {cascade_file}")
        else:
            print("[EmotionRecognitionService] Haar cascade face detector loaded successfully.")

        print("[EmotionRecognitionService] All models loaded and ready.")

    def detect_and_crop_face(self, image_bytes: bytes):
        """
        Decodes image bytes, detects face with Haar Cascade, and extracts the primary face crop.
        Returns:
            face_crop (np.ndarray): 2D grayscale array ready for FaceEmotionPredictor.
            face_detected (bool): Whether a face bounding box was detected.
            bbox (dict or None): {'x': int, 'y': int, 'w': int, 'h': int} in original coordinates.
        """
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Invalid image file format or corrupted bytes.")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.2, minNeighbors=4, minSize=(30, 30)
        )

        if len(faces) > 0:
            # Pick the largest face detected
            largest_face = max(faces, key=lambda f: f[2] * f[3])
            x, y, w, h = largest_face
            face_crop = gray[y : y + h, x : x + w]
            bbox = {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
            return face_crop, True, bbox
        else:
            # Fallback: use full image center crop or full image
            return gray, False, None

    def predict_face(self, image_bytes: bytes) -> dict:
        face_crop, face_detected, bbox = self.detect_and_crop_face(image_bytes)
        pred = self.face_predictor.predict(face_crop)
        return {
            "modality": "face",
            "emotion": pred["emotion"],
            "confidence": pred["confidence"],
            "probabilities": pred["probabilities"],
            "face_detected": face_detected,
            "bounding_box": bbox,
        }

    def predict_audio(self, audio_bytes: bytes, filename: str = "sample.wav") -> dict:
        suffix = os.path.splitext(filename)[1] or ".wav"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            pred = self.audio_predictor.predict(tmp_path)
            return {
                "modality": "audio",
                "emotion": pred["emotion"],
                "confidence": pred["confidence"],
                "probabilities": pred["probabilities"],
            }
        finally:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

    def predict_text(self, text: str) -> dict:
        pred = self.text_predictor.predict(text)
        return {
            "modality": "text",
            "emotion": pred["emotion"],
            "confidence": pred["confidence"],
            "probabilities": pred["probabilities"],
        }

    def predict_multimodal(
        self,
        image_bytes: bytes = None,
        audio_bytes: bytes = None,
        audio_filename: str = "audio.wav",
        text_str: str = None,
        use_context: bool = False,
    ) -> dict:
        face_crop = None
        face_detected = False
        face_bbox = None
        individual_predictions = {}

        # 1. Process Face if provided
        if image_bytes is not None and len(image_bytes) > 0:
            face_crop, face_detected, face_bbox = self.detect_and_crop_face(image_bytes)
            ind_face = self.face_predictor.predict(face_crop)
            individual_predictions["face"] = {
                "emotion": ind_face["emotion"],
                "confidence": ind_face["confidence"],
                "probabilities": ind_face["probabilities"],
                "face_detected": face_detected,
                "bounding_box": face_bbox,
            }

        # 2. Process Audio if provided
        tmp_audio_path = None
        if audio_bytes is not None and len(audio_bytes) > 0:
            suffix = os.path.splitext(audio_filename)[1] or ".wav"
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_audio_path = tmp.name

            try:
                ind_audio = self.audio_predictor.predict(tmp_audio_path)
                individual_predictions["audio"] = {
                    "emotion": ind_audio["emotion"],
                    "confidence": ind_audio["confidence"],
                    "probabilities": ind_audio["probabilities"],
                }
            except Exception as e:
                print(f"[predict_multimodal] Audio individual prediction error: {e}")

        # 3. Process Text if provided
        if text_str is not None and text_str.strip():
            ind_text = self.text_predictor.predict(text_str)
            individual_predictions["text"] = {
                "emotion": ind_text["emotion"],
                "confidence": ind_text["confidence"],
                "probabilities": ind_text["probabilities"],
            }

        try:
            # 4. Trimodal / Arbitrary Subsets Cross-Modal Attention Fusion
            fusion_result = self.fusion_predictor.predict(
                face_img=face_crop,
                audio_path=tmp_audio_path,
                text_str=text_str,
                use_context=use_context,
            )

            fusion_result["individual_predictions"] = individual_predictions
            return fusion_result

        finally:
            if tmp_audio_path and os.path.exists(tmp_audio_path):
                try:
                    os.remove(tmp_audio_path)
                except Exception:
                    pass

    def reset_context(self):
        self.fusion_predictor.context_buffer.reset()
        return {"status": "success", "message": "Temporal affect context buffer reset."}
