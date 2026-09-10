import os
import glob
import time
import cv2
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from face.predictor import FaceEmotionPredictor, CLASS_NAMES
from audio.predictor import AudioEmotionPredictor
from audio.train import parse_dataset_speaker_split
from text.predictor import TextEmotionPredictor
from text.dataset import parse_goemotions_split

from .model import CrossModalAttentionFusionModel
from .dataset import TrimodalDataset, build_trimodal_pseudo_dataset

CLASS_TO_IDX = {name: idx for idx, name in enumerate(CLASS_NAMES)}
CHECKPOINT_OUT = "./checkpoints/best_fusion_v2_model.pth"
EMB_CACHE_FILE = "./data/trimodal_embeddings_cache.npz"


def pre_extract_embeddings(force_recompute: bool = False):
    """
    Pre-extract or load 512-dim embeddings for all three modalities with strict train/val isolation.
    """
    if os.path.exists(EMB_CACHE_FILE) and not force_recompute:
        print(f"Loading cached trimodal embeddings from {EMB_CACHE_FILE}...")
        data = np.load(EMB_CACHE_FILE, allow_pickle=True)
        train_face = data["train_face"].item()
        val_face = data["val_face"].item()
        train_audio = data["train_audio"].item()
        val_audio = data["val_audio"].item()
        train_text = data["train_text"].item()
        val_text = data["val_text"].item()
        return train_face, val_face, train_audio, val_audio, train_text, val_text

    print("\nPre-extracting 512-dim embeddings across all 3 modalities...")
    face_pred = FaceEmotionPredictor()
    audio_pred = AudioEmotionPredictor()
    text_pred = TextEmotionPredictor()

    # 1. Face Embeddings (FER2013 train & test)
    def extract_face(fer_dir, max_per_class):
        res = {c: [] for c in range(7)}
        for emotion in CLASS_NAMES:
            c = CLASS_TO_IDX[emotion]
            folder = os.path.join(fer_dir, emotion)
            if not os.path.exists(folder):
                continue
            files = (glob.glob(os.path.join(folder, "*.jpg")) + glob.glob(os.path.join(folder, "*.png")))[:max_per_class]
            for p in files:
                img = cv2.imread(p, cv2.IMREAD_GRAYSCALE)
                if img is not None:
                    res[c].append(face_pred.get_embedding(img))
        return res

    print("Extracting Face embeddings...")
    train_face = extract_face("./data/fer2013/train", 350)
    val_face = extract_face("./data/fer2013/test", 100)

    # 2. Audio Embeddings (RAVDESS/TESS speaker split)
    print("Extracting Audio embeddings...")
    train_audio_samples, val_audio_samples = parse_dataset_speaker_split()

    def extract_audio(samples_list, max_per_class):
        by_class = {c: [] for c in range(7)}
        for path, c in samples_list:
            by_class[c].append(path)
        res = {c: [] for c in range(7)}
        for c in range(7):
            for path in by_class[c][:max_per_class]:
                try:
                    res[c].append(audio_pred.get_embedding(path))
                except Exception:
                    continue
        return res

    train_audio = extract_audio(train_audio_samples, 350)
    val_audio = extract_audio(val_audio_samples, 100)

    # 3. Text Embeddings (GoEmotions train & dev)
    print("Extracting Text embeddings...")
    train_text_raw = parse_goemotions_split("./data/goemotions/train.tsv", max_per_class=350)
    val_text_raw = parse_goemotions_split("./data/goemotions/dev.tsv", max_per_class=100)

    def extract_text(samples_list):
        res = {c: [] for c in range(7)}
        for text_str, c in samples_list:
            res[c].append(text_pred.get_embedding(text_str))
        return res

    train_text = extract_text(train_text_raw)
    val_text = extract_text(val_text_raw)

    # Save to disk
    np.savez_compressed(
        EMB_CACHE_FILE,
        train_face=train_face,
        val_face=val_face,
        train_audio=train_audio,
        val_audio=val_audio,
        train_text=train_text,
        val_text=val_text,
    )
    print(f"[OK] Trimodal embeddings cached to {EMB_CACHE_FILE}")

    return train_face, val_face, train_audio, val_audio, train_text, val_text


def evaluate_trimodal_regimes(model: CrossModalAttentionFusionModel, loader: DataLoader, device: torch.device):
    """Evaluate accuracy across joint trimodal, bimodal subsets, and single-modality fallbacks."""
    model.eval()
    modes = {
        "trimodal": (1, 1, 1),
        "face_audio": (1, 1, 0),
        "face_text": (1, 0, 1),
        "audio_text": (0, 1, 1),
        "face_only": (1, 0, 0),
        "audio_only": (0, 1, 0),
        "text_only": (0, 0, 1),
    }
    correct = {m: 0 for m in modes}
    total = 0

    with torch.no_grad():
        for face_emb, audio_emb, text_emb, labels in loader:
            face_emb = face_emb.to(device)
            audio_emb = audio_emb.to(device)
            text_emb = text_emb.to(device)
            labels = labels.to(device)
            batch_sz = labels.size(0)
            total += batch_sz

            zeros_f = torch.zeros_like(face_emb)
            zeros_a = torch.zeros_like(audio_emb)
            zeros_t = torch.zeros_like(text_emb)

            for m_name, (use_f, use_a, use_t) in modes.items():
                f_in = face_emb if use_f else zeros_f
                a_in = audio_emb if use_a else zeros_a
                t_in = text_emb if use_t else zeros_t
                preds = model(f_in, a_in, t_in).argmax(dim=1)
                correct[m_name] += (preds == labels).sum().item()

    return {m: correct[m] / total for m in modes}


def train_fusion_v2_model(
    epochs: int = 25,
    batch_size: int = 32,
    lr: float = 1e-3,
    checkpoint_out: str = CHECKPOINT_OUT,
):
    print("=" * 65)
    print("PHASE 5: CONTEXT-AWARE CROSS-MODAL ATTENTION FUSION TRAINING")
    print("=" * 65)

    device = torch.device("cpu")
    print(f"Device: {device}")

    t0 = time.time()
    train_face, val_face, train_audio, val_audio, train_text, val_text = pre_extract_embeddings()
    print(f"Feature extraction loaded in {time.time() - t0:.1f}s.")

    # Construct paired trimodal datasets
    train_dataset = build_trimodal_pseudo_dataset(
        train_face, train_audio, train_text, samples_per_class=500, is_training=True
    )
    val_dataset = build_trimodal_pseudo_dataset(
        val_face, val_audio, val_text, samples_per_class=120, is_training=False
    )

    print(f"Dataset sizes: Training triplets = {len(train_dataset)} | Validation triplets = {len(val_dataset)}")

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    model = CrossModalAttentionFusionModel(
        embedding_dim=512, num_heads=4, hidden_dim=256, num_classes=7, dropout=0.2
    ).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)

    os.makedirs(os.path.dirname(checkpoint_out), exist_ok=True)
    best_trimodal_acc = 0.0

    print(f"\nStarting Attention Fusion Training ({epochs} epochs on CPU)...\n")
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        train_corr = 0
        train_total = 0

        for f_emb, a_emb, t_emb, labels in train_loader:
            f_emb, a_emb, t_emb, labels = f_emb.to(device), a_emb.to(device), t_emb.to(device), labels.to(device)
            optimizer.zero_grad()
            logits = model(f_emb, a_emb, t_emb)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * labels.size(0)
            preds = logits.argmax(dim=1)
            train_corr += (preds == labels).sum().item()
            train_total += labels.size(0)

        epoch_loss = train_loss / train_total
        epoch_acc = train_corr / train_total

        # Multi-regime evaluation
        metrics = evaluate_trimodal_regimes(model, val_loader, device)

        print(
            f"Epoch [{epoch:02d}/{epochs:02d}] "
            f"Loss: {epoch_loss:.4f} | Train Acc: {epoch_acc*100:.1f}% | "
            f"Trimodal: {metrics['trimodal']*100:.1f}% | "
            f"Face: {metrics['face_only']*100:.1f}% | "
            f"Audio: {metrics['audio_only']*100:.1f}% | "
            f"Text: {metrics['text_only']*100:.1f}%"
        )

        if metrics["trimodal"] > best_trimodal_acc:
            best_trimodal_acc = metrics["trimodal"]
            torch.save(model.state_dict(), checkpoint_out)
            print(f"  [OK] Saved new best attention fusion model (Trimodal Acc: {best_trimodal_acc*100:.2f}%)")

    total_time = time.time() - start_time
    print("\n" + "=" * 65)
    print(f"ATTENTION FUSION TRAINING COMPLETE in {total_time:.1f}s ({total_time/60:.2f} min).")
    print(f"Best Trimodal Accuracy: {best_trimodal_acc*100:.2f}%")
    print("=" * 65)

    return best_trimodal_acc


if __name__ == "__main__":
    train_fusion_v2_model()
