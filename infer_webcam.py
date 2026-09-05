import os
import cv2
import torch
from torchvision import transforms
from model import FaceEmotionEncoder

def run_webcam():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    classes = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

    checkpoint_path = "./checkpoints/best_face_encoder.pth"
    if not os.path.exists(checkpoint_path):
        print(f"Error: {checkpoint_path} not found. Run train.py first.")
        return

    # Load trained model
    model = FaceEmotionEncoder(num_classes=len(classes), embedding_dim=512)
    model.load_state_dict(torch.load(checkpoint_path, map_location=device))
    model.to(device)
    model.eval()

    transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Grayscale(num_output_channels=1),
        transforms.Resize((48, 48)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5], std=[0.5])
    ])

    # Cascade loader: check local directory first, then cv2.data fallback
    cascade_file = "haarcascade_frontalface_default.xml"
    if not os.path.exists(cascade_file) and hasattr(cv2, 'data'):
        cascade_file = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"

    face_cascade = cv2.CascadeClassifier(cascade_file)
    if face_cascade.empty():
        print(f"Error: Failed to load Haar cascade classifier from {cascade_file}")
        return

    # Open webcam via Video4Linux2 backend for Ubuntu
    cap = cv2.VideoCapture(0, cv2.CAP_V4L2)
    if not cap.isOpened():
        cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: Could not open webcam. Check camera permissions or index.")
        return

    print("Webcam stream active. Press 'q' in the video window to quit.")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

        for (x, y, w, h) in faces:
            face_roi = gray[y:y+h, x:x+w]
            input_tensor = transform(face_roi).unsqueeze(0).to(device)

            with torch.no_grad():
                logits, _ = model(input_tensor, return_embedding=True)
                probs = torch.softmax(logits, dim=1)
                conf, pred_idx = torch.max(probs, 1)

            label = f"{classes[pred_idx]}: {conf.item():.2f}"
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        cv2.imshow("Facial Emotion Recognition", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    run_webcam()