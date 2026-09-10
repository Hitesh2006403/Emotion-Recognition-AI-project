import numpy as np
import torch
from torch.utils.data import Dataset


class TrimodalDataset(Dataset):
    """
    Dataset of paired 512-dim Face, Audio, and Text embeddings with Structured 7-Way Modality Dropout.
    
    Modality Dropout Policy:
      Mode 0 (40%): Trimodal (Face + Audio + Text all present)
      Mode 1 (10%): Bimodal Face + Audio (Text zeroed)
      Mode 2 (10%): Bimodal Face + Text (Audio zeroed)
      Mode 3 (10%): Bimodal Audio + Text (Face zeroed)
      Mode 4 (10%): Single-Modal Face-only (Audio & Text zeroed)
      Mode 5 (10%): Single-Modal Audio-only (Face & Text zeroed)
      Mode 6 (10%): Single-Modal Text-only (Face & Audio zeroed)
    """

    def __init__(
        self,
        face_embeddings: list or np.ndarray,
        audio_embeddings: list or np.ndarray,
        text_embeddings: list or np.ndarray,
        labels: list or np.ndarray,
        is_training: bool = True,
        dropout_policy: tuple = (0.40, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10),
    ):
        self.face_embeddings = np.array(face_embeddings, dtype=np.float32)
        self.audio_embeddings = np.array(audio_embeddings, dtype=np.float32)
        self.text_embeddings = np.array(text_embeddings, dtype=np.float32)
        self.labels = np.array(labels, dtype=np.int64)
        self.is_training = is_training
        self.dropout_policy = dropout_policy

        assert len(self.face_embeddings) == len(self.audio_embeddings) == len(self.text_embeddings) == len(self.labels), \
            "Embedding counts and label counts must match across all 3 modalities."

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        face_emb = self.face_embeddings[idx].copy()
        audio_emb = self.audio_embeddings[idx].copy()
        text_emb = self.text_embeddings[idx].copy()
        label = self.labels[idx]

        if self.is_training:
            mode = np.random.choice(7, p=self.dropout_policy)
            if mode == 1:
                # Face + Audio: zero text
                text_emb = np.zeros_like(text_emb)
            elif mode == 2:
                # Face + Text: zero audio
                audio_emb = np.zeros_like(audio_emb)
            elif mode == 3:
                # Audio + Text: zero face
                face_emb = np.zeros_like(face_emb)
            elif mode == 4:
                # Face-only: zero audio and text
                audio_emb = np.zeros_like(audio_emb)
                text_emb = np.zeros_like(text_emb)
            elif mode == 5:
                # Audio-only: zero face and text
                face_emb = np.zeros_like(face_emb)
                text_emb = np.zeros_like(text_emb)
            elif mode == 6:
                # Text-only: zero face and audio
                face_emb = np.zeros_like(face_emb)
                audio_emb = np.zeros_like(audio_emb)
            # mode 0: all 3 present

        return (
            torch.from_numpy(face_emb),
            torch.from_numpy(audio_emb),
            torch.from_numpy(text_emb),
            torch.tensor(label, dtype=torch.long),
        )


def build_trimodal_pseudo_dataset(
    face_embeddings_by_class: dict,
    audio_embeddings_by_class: dict,
    text_embeddings_by_class: dict,
    samples_per_class: int = 500,
    is_training: bool = True,
) -> TrimodalDataset:
    """
    Construct a pseudo-paired trimodal dataset by sampling matching emotion triplets.
    Guarantees strict isolation: pairs are formed exclusively within the provided dictionary pools.
    """
    all_face = []
    all_audio = []
    all_text = []
    all_labels = []

    for c in range(7):
        faces = face_embeddings_by_class.get(c, [])
        audios = audio_embeddings_by_class.get(c, [])
        texts = text_embeddings_by_class.get(c, [])

        if len(faces) == 0 or len(audios) == 0 or len(texts) == 0:
            continue

        for _ in range(samples_per_class):
            f_idx = np.random.randint(0, len(faces))
            a_idx = np.random.randint(0, len(audios))
            t_idx = np.random.randint(0, len(texts))

            all_face.append(faces[f_idx])
            all_audio.append(audios[a_idx])
            all_text.append(texts[t_idx])
            all_labels.append(c)

    return TrimodalDataset(all_face, all_audio, all_text, all_labels, is_training=is_training)
