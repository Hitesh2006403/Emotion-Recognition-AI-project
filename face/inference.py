import os
import cv2
import argparse

from .predictor import FaceEmotionPredictor, CLASS_NAMES


def run_webcam(
    checkpoint_path: str = None,
    device: str = None,
    camera_index: int = 0,
    show_window: bool = True,
):
    """
    Run real-time facial emotion recognition from webcam.

    Args:
        checkpoint_path: Path to model checkpoint
        device: 'cuda', 'cpu', or None for auto
        camera_index: Webcam index (usually 0)
        show_window: Whether to display the OpenCV window
    """
    predictor = FaceEmotionPredictor(
        checkpoint_path=checkpoint_path,
        device=device,
    )

    cascade_file = "haarcascade_frontalface_default.xml"
    if not os.path.exists(cascade_file) and hasattr(cv2, 'data'):
        cascade_file = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"

    face_cascade = cv2.CascadeClassifier(cascade_file)
    if face_cascade.empty():
        raise RuntimeError(f"Failed to load Haar cascade from {cascade_file}")

    cap = cv2.VideoCapture(camera_index, cv2.CAP_V4L2)
    if not cap.isOpened():
        cap = cv2.VideoCapture(camera_index)

    if not cap.isOpened():
        raise RuntimeError("Could not open webcam. Check camera permissions or index.")

    print("Webcam stream active. Press 'q' in the video window to quit.")

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

            for (x, y, w, h) in faces:
                face_roi = gray[y:y+h, x:x+w]
                result = predictor.predict(face_roi)

                label = f"{result['emotion']}: {result['confidence']:.2f}"
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                cv2.putText(frame, label, (x, y - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

            if show_window:
                cv2.imshow("Facial Emotion Recognition", frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
    finally:
        cap.release()
        cv2.destroyAllWindows()


def predict_image(image_path: str, checkpoint_path: str = None, device: str = None):
    """
    Predict emotion from a single image file.

    Args:
        image_path: Path to image file
        checkpoint_path: Path to model checkpoint
        device: 'cuda', 'cpu', or None for auto

    Returns:
        Prediction dict from FaceEmotionPredictor.predict()
    """
    import cv2
    predictor = FaceEmotionPredictor(checkpoint_path=checkpoint_path, device=device)

    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not load image: {image_path}")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return predictor.predict(gray)


def main():
    parser = argparse.ArgumentParser(description="Face Emotion Recognition Inference")
    parser.add_argument("--checkpoint", type=str, default=None,
                        help="Path to model checkpoint (default: ./checkpoints/best_face_encoder.pth)")
    parser.add_argument("--device", type=str, default=None,
                        help="Device: cuda or cpu (default: auto)")
    parser.add_argument("--camera", type=int, default=0,
                        help="Camera index (default: 0)")
    parser.add_argument("--image", type=str, default=None,
                        help="Path to image file for single prediction (instead of webcam)")
    parser.add_argument("--no-window", action="store_true",
                        help="Run webcam without displaying window (for headless)")

    args = parser.parse_args()

    if args.image:
        result = predict_image(args.image, args.checkpoint, args.device)
        print(f"Emotion: {result['emotion']}")
        print(f"Confidence: {result['confidence']:.4f}")
        print("All probabilities:")
        for name, prob in result['probabilities'].items():
            print(f"  {name}: {prob:.4f}")
    else:
        run_webcam(
            checkpoint_path=args.checkpoint,
            device=args.device,
            camera_index=args.camera,
            show_window=not args.no_window,
        )


if __name__ == "__main__":
    main()