import os
import argparse
import numpy as np

from .predictor import AudioEmotionPredictor


def predict_audio_file(audio_path: str, checkpoint_path: str = None, device: str = None):
    """
    Process an audio file through the pipeline.
    Displays 512-dim embedding info and emotion prediction (if trained).

    Args:
        audio_path: Path to .wav audio file
        checkpoint_path: Optional path to checkpoint
        device: 'cuda', 'cpu', or None
    """
    predictor = AudioEmotionPredictor(checkpoint_path=checkpoint_path, device=device)
    print(f"Loaded audio file: {audio_path}")
    print(f"Device: {predictor.device}")
    print(f"Model trained status (is_trained): {predictor.is_trained}")

    embedding = predictor.get_embedding(audio_path)
    print(f"[OK] Extracted 512-dim audio embedding (shape: {embedding.shape}, mean: {embedding.mean():.4f}, std: {embedding.std():.4f})")

    if not predictor.is_trained:
        print("[INFO] Model is currently UNTRAINED (is_trained=False).")
        print("[INFO] Real emotion predictions will be enabled in Phase 2B after model training.")
        return {"embedding": embedding, "is_trained": False}

    result = predictor.predict(audio_path)
    print(f"Predicted Emotion: {result['emotion']}")
    print(f"Confidence: {result['confidence']:.4f}")
    print("Class Probabilities:")
    for name, prob in result['probabilities'].items():
        print(f"  {name}: {prob:.4f}")

    return result


def run_microphone(duration: float = 3.0, sample_rate: int = 16000, checkpoint_path: str = None, device: str = None):
    """
    Record audio clip from microphone and run through pipeline.
    """
    try:
        import sounddevice as sd
    except ImportError:
        print("[FAIL] 'sounddevice' library is not installed. Install with: pip install sounddevice")
        return

    print(f"Recording {duration} seconds from microphone...")
    recording = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype='float32')
    sd.wait()
    print("Recording complete. Processing through audio pipeline...")

    audio_samples = recording.flatten()
    predictor = AudioEmotionPredictor(checkpoint_path=checkpoint_path, device=device)
    embedding = predictor.get_embedding(audio_samples)
    print(f"[OK] Extracted 512-dim audio embedding from mic input (shape: {embedding.shape})")

    if not predictor.is_trained:
        print("[INFO] Model status: UNTRAINED (is_trained=False). Real prediction available in Phase 2B.")
        return {"embedding": embedding, "is_trained": False}

    result = predictor.predict(audio_samples)
    print(f"Predicted Emotion: {result['emotion']} (Confidence: {result['confidence']:.4f})")
    return result


def main():
    parser = argparse.ArgumentParser(description="Audio Emotion Recognition Pipeline (Phase 2A)")
    parser.add_argument("--file", type=str, default=None, help="Path to .wav audio file")
    parser.add_argument("--mic", action="store_true", help="Record audio from microphone")
    parser.add_argument("--checkpoint", type=str, default=None, help="Path to trained checkpoint (.pth)")
    parser.add_argument("--device", type=str, default=None, help="Device: cuda or cpu")

    args = parser.parse_args()

    if args.file:
        predict_audio_file(args.file, args.checkpoint, args.device)
    elif args.mic:
        run_microphone(checkpoint_path=args.checkpoint, device=args.device)
    else:
        print("Audio Emotion Recognition Pipeline (Phase 2A)")
        print("Usage:")
        print("  python -m audio.inference --file path/to/sample.wav")
        print("  python -m audio.inference --mic")


if __name__ == "__main__":
    main()
