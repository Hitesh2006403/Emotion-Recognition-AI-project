import os
import torch
import torch.nn.functional as F
from torchvision import transforms
import numpy as np

from .model import FaceEmotionEncoder

CLASS_NAMES = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
DEFAULT_CHECKPOINT = "./checkpoints/best_face_encoder.pth"
IMAGE_SIZE = 48


class FaceEmotionPredictor:
    """
    Reusable facial emotion prediction API.
    Loads the trained checkpoint and provides a clean interface for inference.
    """

    def __init__(
        self,
        checkpoint_path: str = None,
        device: str = None,
        num_classes: int = 7,
        embedding_dim: int = 512,
    ):
        """
        Initialize the predictor.

        Args:
            checkpoint_path: Path to the trained model checkpoint (.pth)
            device: 'cuda', 'cpu', or None for auto-detection
            num_classes: Number of emotion classes (must match checkpoint)
            embedding_dim: Embedding dimension (must match checkpoint)
        """
        self.checkpoint_path = checkpoint_path
        self.num_classes = num_classes
        self.embedding_dim = embedding_dim
        self.class_names = CLASS_NAMES

        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        self.model = None
        self.transform = self._build_transform()
        self._load_model()

    def _build_transform(self):
        """Build the preprocessing transform matching training."""
        return transforms.Compose([
            transforms.ToPILImage(),
            transforms.Grayscale(num_output_channels=1),
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.5], std=[0.5])
        ])

    def _load_model(self):
        """Load the trained model from checkpoint."""
        checkpoint = self.checkpoint_path or DEFAULT_CHECKPOINT
        if not os.path.exists(checkpoint):
            raise FileNotFoundError(
                f"Checkpoint not found: {checkpoint}. "
                f"Run train.py first or provide a valid path."
            )

        self.model = FaceEmotionEncoder(
            num_classes=self.num_classes,
            embedding_dim=self.embedding_dim
        )
        state_dict = torch.load(checkpoint, map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.to(self.device)
        self.model.eval()

    def preprocess(self, face_image: np.ndarray) -> torch.Tensor:
        """
        Preprocess a face image (numpy array) for the model.

        Args:
            face_image: Grayscale or BGR face crop as numpy array (H, W) or (H, W, 3)

        Returns:
            Tensor of shape (1, 1, 48, 48) ready for model input
        """
        if face_image is None or face_image.size == 0:
            raise ValueError("Empty face image provided")

        if len(face_image.shape) == 3 and face_image.shape[2] == 3:
            face_image = face_image[:, :, 0]

        tensor = self.transform(face_image)
        return tensor.unsqueeze(0).to(self.device)

    @torch.no_grad()
    def predict_proba(self, face_image: np.ndarray) -> np.ndarray:
        """
        Predict emotion probabilities for a face image.

        Args:
            face_image: Face crop as numpy array

        Returns:
            Array of shape (7,) with probabilities for each emotion class
        """
        input_tensor = self.preprocess(face_image)
        logits = self.model(input_tensor)
        probs = F.softmax(logits, dim=1)
        return probs.squeeze(0).cpu().numpy()

    @torch.no_grad()
    def predict(self, face_image: np.ndarray) -> dict:
        """
        Predict emotion for a face image.

        Args:
            face_image: Face crop as numpy array

        Returns:
            Dict with:
                - 'emotion': predicted emotion name (str)
                - 'confidence': confidence score (float)
                - 'probabilities': dict mapping emotion names to probabilities
                - 'all_probs': numpy array of shape (7,) with all probabilities
        """
        probs = self.predict_proba(face_image)
        pred_idx = int(np.argmax(probs))
        confidence = float(probs[pred_idx])

        return {
            "emotion": self.class_names[pred_idx],
            "confidence": confidence,
            "probabilities": {name: float(probs[i]) for i, name in enumerate(self.class_names)},
            "all_probs": probs,
        }

    def predict_batch(self, face_images: list) -> list:
        """
        Predict emotions for multiple face images.

        Args:
            face_images: List of face crops as numpy arrays

        Returns:
            List of prediction dicts (same format as predict())
        """
        return [self.predict(img) for img in face_images]

    def get_embedding(self, face_image: np.ndarray) -> np.ndarray:
        """
        Get the 512-dimensional embedding for a face image.

        Args:
            face_image: Face crop as numpy array

        Returns:
            Embedding vector of shape (512,)
        """
        input_tensor = self.preprocess(face_image)
        with torch.no_grad():
            _, embedding = self.model(input_tensor, return_embedding=True)
        return embedding.squeeze(0).cpu().numpy()


def create_predictor(checkpoint_path: str = None, device: str = None) -> FaceEmotionPredictor:
    """
    Factory function to create a FaceEmotionPredictor with default settings.

    Args:
        checkpoint_path: Optional custom checkpoint path
        device: Optional device override

    Returns:
        Configured FaceEmotionPredictor instance
    """
    return FaceEmotionPredictor(
        checkpoint_path=checkpoint_path or DEFAULT_CHECKPOINT,
        device=device,
    )