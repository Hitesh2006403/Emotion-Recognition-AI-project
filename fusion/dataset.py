import numpy as np
import torch
from torch.utils.data import Dataset


class MultimodalDataset(Dataset):
    """
    Dataset of paired 512-dim face and audio embeddings with structured modality dropout.
    Policy: 50% Joint Multimodal, 25% Face-Only (audio zeroed), 25% Audio-Only (face zeroed).
    """

    def __init__(
        self,
        face_embeddings: list or np.ndarray,
        audio_embeddings: list or np.ndarray,
        labels: list or np.ndarray,
        is_training: bool = True,
        dropout_policy: tuple = (0.50, 0.25, 0.25),  # (joint_prob, face_only_prob, audio_only_prob)
    ):
        """
        Args:
            face_embeddings: Array/list of 512-dim face vectors
            audio_embeddings: Array/list of 512-dim audio vectors
            labels: Array/list of integer emotion labels (0-6)
            is_training: Whether to apply modality dropout during training
            dropout_policy: Probabilities for (both_present, face_only, audio_only)
        """
        self.face_embeddings = np.array(face_embeddings, dtype=np.float32)
        self.audio_embeddings = np.array(audio_embeddings, dtype=np.float32)
        self.labels = np.array(labels, dtype=np.int64)
        self.is_training = is_training
        self.dropout_policy = dropout_policy

        assert len(self.face_embeddings) == len(self.audio_embeddings) == len(self.labels), \
            "Embedding counts and label counts must match."

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        face_emb = self.face_embeddings[idx].copy()
        audio_emb = self.audio_embeddings[idx].copy()
        label = self.labels[idx]

        if self.is_training:
            # Sample from the structured tri-modal distribution
            mode = np.random.choice([0, 1, 2], p=self.dropout_policy)
            if mode == 1:
                # Face-only: Zero out audio
                audio_emb = np.zeros_like(audio_emb)
            elif mode == 2:
                # Audio-only: Zero out face
                face_emb = np.zeros_like(face_emb)
            # mode 0: Both present (joint)

        return (
            torch.from_numpy(face_emb),
            torch.from_numpy(audio_emb),
            torch.tensor(label, dtype=torch.long)
        )


def build_pseudo_paired_dataset(
    face_embeddings_by_class: dict,
    audio_embeddings_by_class: dict,
    samples_per_class: int = 500,
    is_training: bool = True,
) -> MultimodalDataset:
    """
    Construct a pseudo-paired multimodal dataset by sampling matching emotion pairs.

    Args:
        face_embeddings_by_class: Dict mapping class_idx -> list of 512-dim face vectors
        audio_embeddings_by_class: Dict mapping class_idx -> list of 512-dim audio vectors
        samples_per_class: Number of pairs to generate per class
        is_training: Training flag for modality dropout

    Returns:
        MultimodalDataset instance
    """
    all_face = []
    all_audio = []
    all_labels = []

    for c in range(7):
        faces = face_embeddings_by_class.get(c, [])
        audios = audio_embeddings_by_class.get(c, [])

        if len(faces) == 0 or len(audios) == 0:
            continue

        for _ in range(samples_per_class):
            face_idx = np.random.randint(0, len(faces))
            audio_idx = np.random.randint(0, len(audios))

            all_face.append(faces[face_idx])
            all_audio.append(audios[audio_idx])
            all_labels.append(c)

    return MultimodalDataset(all_face, all_audio, all_labels, is_training=is_training)
