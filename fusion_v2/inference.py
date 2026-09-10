import argparse
import os
import cv2
from .predictor import MultimodalPredictorV2


def main():
    parser = argparse.ArgumentParser(description="Trimodal Emotion Recognition Inference CLI (Phase 5)")
    parser.add_argument("--image", type=str, default=None, help="Path to face image file")
    parser.add_argument("--audio", type=str, default=None, help="Path to WAV audio file")
    parser.add_argument("--text", type=str, default=None, help="Input text string")
    parser.add_argument("--context", action="store_true", help="Enable temporal context smoothing")
    parser.add_argument("--checkpoint", type=str, default="./checkpoints/best_fusion_v2_model.pth")
    args = parser.parse_args()

    predictor = MultimodalPredictorV2(checkpoint_path=args.checkpoint)

    face_img = None
    if args.image:
        if os.path.exists(args.image):
            face_img = cv2.imread(args.image, cv2.IMREAD_GRAYSCALE)
        else:
            print(f"Error: image file '{args.image}' not found.")

    res = predictor.predict(
        face_img=face_img,
        audio_path=args.audio,
        text_str=args.text,
        use_context=args.context,
    )

    print("\n" + "=" * 65)
    print("TRIMODAL CROSS-MODAL ATTENTION PREDICTION")
    print("=" * 65)
    print(f"Active Modalities: {', '.join(res['modalities_present']) or 'None'}")
    print(f"Predicted Emotion: {res['emotion'].upper()} ({res['confidence']*100:.2f}%)")
    print(f"Temporal Context:  {'Active' if res['context_active'] else 'Disabled'}")
    print("-" * 65)
    print("Dynamic Modality Importance Weights:")
    for mod, w in res["modality_weights"].items():
        print(f"  {mod.capitalize():<6}: {w*100:5.2f}% [{'#' * int(w * 25):<25}]")
    print("-" * 65)
    print("Class Probabilities:")
    for em, p in sorted(res["probabilities"].items(), key=lambda x: -x[1]):
        print(f"  {em:<10}: {p*100:5.2f}%")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
