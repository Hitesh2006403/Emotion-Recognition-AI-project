import os
import argparse
import cv2
import numpy as np

from .predictor import MultimodalEmotionPredictor, CLASS_NAMES


def run_inference(face_path: str = None, audio_path: str = None, checkpoint_path: str = None, device: str = None):
    """
    Run inference on face image, audio file, or both.
    """
    predictor = MultimodalEmotionPredictor(fusion_checkpoint=checkpoint_path, device=device)

    face_img = None
    if face_path:
        if not os.path.exists(face_path):
            raise FileNotFoundError(f"Face image not found: {face_path}")
        face_img = cv2.imread(face_path)
        if face_img is None:
            raise ValueError(f"Could not load image file: {face_path}")

    if audio_path:
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

    print("=" * 60)
    print("MULTIMODAL EMOTION PREDICTION")
    print("=" * 60)
    print(f"Face input : {face_path or '[None]'}")
    print(f"Audio input: {audio_path or '[None]'}")

    result = predictor.predict(face_image=face_img, audio_source=audio_path)

    print(f"\nOperational Mode: {result['modality'].upper()}")
    print(f"Predicted Emotion: {result['emotion']}")
    print(f"Confidence Score : {result['confidence']*100:.2f}%")

    if result['modality'] == "multimodal":
        gw = result['gate_weights']
        print(f"Dynamic Gate Contribution: Face = {gw['face_weight']*100:.1f}% | Audio = {gw['audio_weight']*100:.1f}%")

    print("\nClass Probabilities:")
    for name, prob in result['probabilities'].items():
        bar = "#" * int(prob * 30)
        print(f"  {name:<10}: {prob*100:5.1f}% | {bar}")

    emb = result['fused_embedding']
    print(f"\n[OK] Fused 512-dim Embedding Vector: (shape: {emb.shape}, mean: {emb.mean():.4f}, std: {emb.std():.4f})")
    return result


def main():
    parser = argparse.ArgumentParser(description="Multimodal Emotion Recognition (Face + Audio Fusion)")
    parser.add_argument("--face", type=str, default=None, help="Path to facial image file (.jpg/.png)")
    parser.add_argument("--audio", type=str, default=None, help="Path to audio file (.wav)")
    parser.add_argument("--checkpoint", type=str, default=None, help="Path to custom fusion model checkpoint (.pth)")
    parser.add_argument("--device", type=str, default=None, help="Device override ('cpu', 'cuda')")

    args = parser.parse_args()

    if not args.face and not args.audio:
        print("Multimodal Emotion Recognition (Phase 3)")
        print("Usage:")
        print("  python -m fusion.inference --face path/to/face.jpg --audio path/to/audio.wav")
        print("  python -m fusion.inference --face path/to/face.jpg   (Face-only fallback)")
        print("  python -m fusion.inference --audio path/to/clip.wav  (Audio-only fallback)")
        return

    run_inference(args.face, args.audio, args.checkpoint, args.device)


if __name__ == "__main__":
    main()
