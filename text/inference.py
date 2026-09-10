import argparse
import sys
from .predictor import TextEmotionPredictor


def main():
    parser = argparse.ArgumentParser(description="Text Emotion Recognition Inference CLI")
    parser.add_argument("--text", type=str, default=None, help="Input text to predict emotion for")
    parser.add_argument("--checkpoint", type=str, default="./checkpoints/best_text_encoder.pth", help="Checkpoint path")
    args = parser.parse_args()

    predictor = TextEmotionPredictor(checkpoint_path=args.checkpoint)

    if args.text:
        result = predictor.predict(args.text)
        print("\n" + "=" * 50)
        print(f"Input: \"{args.text}\"")
        print(f"Predicted Emotion: {result['emotion'].upper()} ({result['confidence']*100:.2f}%)")
        print("-" * 50)
        print("Class Probabilities:")
        for em, p in sorted(result["probabilities"].items(), key=lambda x: -x[1]):
            print(f"  {em:<10}: {p*100:5.2f}%")
        print("=" * 50 + "\n")
        return

    print("=" * 50)
    print("Interactive Text Emotion Recognition (Type 'exit' to quit)")
    print("=" * 50)

    while True:
        try:
            user_text = input("\nEnter text: ").strip()
            if not user_text or user_text.lower() in ["exit", "quit"]:
                print("Exiting.")
                break
            result = predictor.predict(user_text)
            print(f"--> {result['emotion'].upper()} ({result['confidence']*100:.1f}%)")
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            break


if __name__ == "__main__":
    main()
