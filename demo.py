"""
Unified Multimodal Emotion Recognition Demonstration CLI (Phases 1-6).
Accepts Face image, Audio WAV, and Text utterance in any combination (single, bimodal, trimodal).
Displays individual standalone modality predictions and final Cross-Modal Attention fused outputs.

Usage:
  python demo.py --face <path_to_img> --audio <path_to_wav> --text "<sentence>"
  python demo.py --text "I am feeling fantastic today!"
  python demo.py  # Runs self-contained demonstration on repository benchmark samples
"""

import argparse
import os
import cv2
import numpy as np

from face.predictor import FaceEmotionPredictor
from audio.predictor import AudioEmotionPredictor
from text.predictor import TextEmotionPredictor
from fusion_v2.predictor import MultimodalPredictorV2, CLASS_NAMES


def format_bar(pct: float, length: int = 25) -> str:
    """Helper to render an ASCII probability/weight bar."""
    filled = int(round(pct * length))
    return f"[{'#' * filled}{' ' * (length - filled)}] {pct * 100:5.1f}%"


def run_demo(face_path: str = None, audio_path: str = None, text_str: str = None, use_context: bool = False):
    print("\n" + "=" * 75)
    print("      CONTEXT-AWARE TRIMODAL EMOTION RECOGNITION SYSTEM (DEMO)")
    print("=" * 75)

    # 1. Inspect Inputs
    active_modalities = []
    face_img = None

    if face_path:
        if os.path.exists(face_path):
            face_img = cv2.imread(face_path, cv2.IMREAD_GRAYSCALE)
            if face_img is not None:
                active_modalities.append("Face")
                print(f"[INPUT] Face Image : '{face_path}' (Shape: {face_img.shape})")
            else:
                print(f"[WARN]  Failed to read image at '{face_path}'. Skipping face.")
        else:
            print(f"[WARN]  Image file '{face_path}' not found. Skipping face.")

    if audio_path:
        if os.path.exists(audio_path):
            active_modalities.append("Speech")
            print(f"[INPUT] Speech Audio: '{audio_path}'")
        else:
            print(f"[WARN]  Audio file '{audio_path}' not found. Skipping speech.")

    if text_str and text_str.strip():
        active_modalities.append("Text")
        print(f"[INPUT] Text String : \"{text_str}\"")

    if not active_modalities:
        print("[ERROR] No valid modalities provided. Run with --help for usage instructions.")
        return

    print("-" * 75)
    print(f"Active Channels: {', '.join(active_modalities)} ({len(active_modalities)} of 3)")
    print("-" * 75)

    # 2. Individual Modality Standalone Predictions
    print("\n[PART 1: INDIVIDUAL STANDALONE MODALITY EVALUATIONS]")
    print("-" * 75)

    if face_img is not None:
        face_pred = FaceEmotionPredictor()
        f_res = face_pred.predict(face_img)
        print(f"  [VISION]  Standalone Face Prediction : {f_res['emotion'].upper():<8} | Confidence: {f_res['confidence']*100:5.1f}%")
        top_face = sorted(f_res["probabilities"].items(), key=lambda x: -x[1])[:3]
        top_str = ", ".join([f"{k}: {v*100:.1f}%" for k, v in top_face])
        print(f"            Top Probabilities          : {top_str}")

    if audio_path and os.path.exists(audio_path):
        audio_pred = AudioEmotionPredictor()
        a_res = audio_pred.predict(audio_path)
        print(f"  [SPEECH]  Standalone Audio Prediction: {a_res['emotion'].upper():<8} | Confidence: {a_res['confidence']*100:5.1f}%")
        top_audio = sorted(a_res["probabilities"].items(), key=lambda x: -x[1])[:3]
        top_str = ", ".join([f"{k}: {v*100:.1f}%" for k, v in top_audio])
        print(f"            Top Probabilities          : {top_str}")

    if text_str and text_str.strip():
        text_pred = TextEmotionPredictor()
        t_res = text_pred.predict(text_str)
        print(f"  [TEXT]    Standalone Text Prediction : {t_res['emotion'].upper():<8} | Confidence: {t_res['confidence']*100:5.1f}%")
        top_text = sorted(t_res["probabilities"].items(), key=lambda x: -x[1])[:3]
        top_str = ", ".join([f"{k}: {v*100:.1f}%" for k, v in top_text])
        print(f"            Top Probabilities          : {top_str}")

    # 3. Multimodal Cross-Modal Attention Fusion (Phase 5)
    print("\n[PART 2: CONTEXT-AWARE CROSS-MODAL ATTENTION FUSION (PHASE 5)]")
    print("-" * 75)

    multimodal_predictor = MultimodalPredictorV2()
    fused_res = multimodal_predictor.predict(
        face_img=face_img,
        audio_path=audio_path if (audio_path and os.path.exists(audio_path)) else None,
        text_str=text_str,
        use_context=use_context,
    )

    print(f"  FINAL FUSED EMOTION : {fused_res['emotion'].upper()} ({fused_res['confidence']*100:.2f}%)")
    print(f"  Temporal Momentum   : {'ENABLED (Sliding EMA)' if fused_res['context_active'] else 'DISABLED'}")
    print("\n  Dynamic Modality Attention Weights (Learned Importance):")
    for mod_key, w in fused_res["modality_weights"].items():
        print(f"    {mod_key.capitalize():<6} : {format_bar(w, 28)}")

    print("\n  Fused Class Probability Distribution:")
    for em, prob in sorted(fused_res["probabilities"].items(), key=lambda x: -x[1]):
        print(f"    {em:<10}: {format_bar(prob, 24)}")

    print("=" * 75 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description="Unified Trimodal Emotion Recognition CLI (Face + Speech + Text)",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument("--face", type=str, default=None, help="Path to 48x48 or natural face image (JPG/PNG)")
    parser.add_argument("--audio", type=str, default=None, help="Path to WAV audio speech recording")
    parser.add_argument("--text", type=str, default=None, help="Spoken utterance or conversation text string")
    parser.add_argument("--context", action="store_true", help="Enable temporal affective context smoothing")

    args = parser.parse_args()

    # If no inputs provided, run built-in demonstration with repo sample assets
    if not args.face and not args.audio and not args.text:
        print("[NOTICE] No CLI arguments provided. Launching built-in demonstration using repository sample data...\n")
        sample_face = "data/fer2013/test/happy/PrivateTest_10077120.jpg"
        sample_audio = "data/ravdess/Actor_01/03-01-03-01-01-01-01.wav"
        sample_text = "I am genuinely overjoyed and proud of our breakthrough!"

        if not os.path.exists(sample_face):
            sample_face = None
        if not os.path.exists(sample_audio):
            sample_audio = None

        run_demo(face_path=sample_face, audio_path=sample_audio, text_str=sample_text, use_context=args.context)
        print("To run with custom inputs:")
        print("  python demo.py --face <path_to_img> --audio <path_to_wav> --text \"<sentence>\"\n")
        return

    run_demo(face_path=args.face, audio_path=args.audio, text_str=args.text, use_context=args.context)


if __name__ == "__main__":
    main()
