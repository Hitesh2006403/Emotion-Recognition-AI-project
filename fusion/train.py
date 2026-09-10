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
from .model import GatedMultimodalFusionModel
from .dataset import MultimodalDataset, build_pseudo_paired_dataset

CLASS_TO_IDX = {name: idx for idx, name in enumerate(CLASS_NAMES)}
CHECKPOINT_OUT = "./checkpoints/best_fusion_model.pth"


def extract_face_embeddings(fer2013_dir: str, face_predictor: FaceEmotionPredictor, max_per_class: int = 300):
    """Pre-extract 512-dim face embeddings grouped by emotion class."""
    print(f"Extracting face embeddings from {fer2013_dir} (max {max_per_class}/class)...")
    embeddings_by_class = {c: [] for c in range(7)}

    for emotion_name in CLASS_NAMES:
        class_idx = CLASS_TO_IDX[emotion_name]
        class_folder = os.path.join(fer2013_dir, emotion_name)
        if not os.path.exists(class_folder):
            continue

        image_files = glob.glob(os.path.join(class_folder, "*.jpg")) + glob.glob(os.path.join(class_folder, "*.png"))
        image_files = image_files[:max_per_class]

        for img_path in image_files:
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            if img is not None:
                emb = face_predictor.get_embedding(img)
                embeddings_by_class[class_idx].append(emb)

    counts = {CLASS_NAMES[c]: len(embeddings_by_class[c]) for c in range(7)}
    print(f"[OK] Face embeddings extracted: {counts}")
    return embeddings_by_class


def extract_audio_embeddings(samples_list: list, audio_predictor: AudioEmotionPredictor, max_per_class: int = 300):
    """Pre-extract 512-dim audio embeddings grouped by emotion class."""
    print(f"Extracting audio embeddings (max {max_per_class}/class)...")
    embeddings_by_class = {c: [] for c in range(7)}

    # Group sample filepaths by class
    files_by_class = {c: [] for c in range(7)}
    for path, class_idx in samples_list:
        files_by_class[class_idx].append(path)

    for class_idx in range(7):
        selected_files = files_by_class[class_idx][:max_per_class]
        for path in selected_files:
            try:
                emb = audio_predictor.get_embedding(path)
                embeddings_by_class[class_idx].append(emb)
            except Exception:
                continue

    counts = {CLASS_NAMES[c]: len(embeddings_by_class[c]) for c in range(7)}
    print(f"[OK] Audio embeddings extracted: {counts}")
    return embeddings_by_class


def evaluate_multimodal_model(model: GatedMultimodalFusionModel, loader: DataLoader, device: torch.device):
    """
    Evaluate model in all 3 operational regimes:
      1. Joint Multimodal (Both present)
      2. Face-only Fallback (Audio zeroed)
      3. Audio-only Fallback (Face zeroed)
    """
    model.eval()
    joint_corr = 0
    face_corr = 0
    audio_corr = 0
    total = 0

    with torch.no_grad():
        for face_emb, audio_emb, labels in loader:
            face_emb = face_emb.to(device)
            audio_emb = audio_emb.to(device)
            labels = labels.to(device)
            batch_sz = labels.size(0)
            total += batch_sz

            # 1. Joint Multimodal
            joint_preds = model(face_emb, audio_emb).argmax(dim=1)
            joint_corr += (joint_preds == labels).sum().item()

            # 2. Face-only Fallback (zero audio)
            zero_audio = torch.zeros_like(audio_emb)
            face_preds = model(face_emb, zero_audio).argmax(dim=1)
            face_corr += (face_preds == labels).sum().item()

            # 3. Audio-only Fallback (zero face)
            zero_face = torch.zeros_like(face_emb)
            audio_preds = model(zero_face, audio_emb).argmax(dim=1)
            audio_corr += (audio_preds == labels).sum().item()

    return {
        "joint_acc": joint_corr / total if total > 0 else 0.0,
        "face_only_acc": face_corr / total if total > 0 else 0.0,
        "audio_only_acc": audio_corr / total if total > 0 else 0.0,
        "total": total,
    }


def train_fusion_model(
    epochs: int = 25,
    batch_size: int = 32,
    lr: float = 1e-3,
    checkpoint_out: str = CHECKPOINT_OUT,
):
    print("=" * 65)
    print("PHASE 3: MULTIMODAL EMOTION RECOGNITION FUSION TRAINING")
    print("=" * 65)

    device = torch.device("cpu")
    print(f"Device: {device}")

    # Initialize frozen sub-encoders
    print("\nLoading frozen feature backbones (Face + Audio)...")
    face_predictor = FaceEmotionPredictor()
    audio_predictor = AudioEmotionPredictor()

    # Pre-extract face embeddings from FER2013 train & test
    t0 = time.time()
    train_face_embs = extract_face_embeddings("./data/fer2013/train", face_predictor, max_per_class=350)
    val_face_embs = extract_face_embeddings("./data/fer2013/test", face_predictor, max_per_class=100)

    # Pre-extract audio embeddings from RAVDESS/TESS
    train_audio_samples, val_audio_samples = parse_dataset_speaker_split()
    train_audio_embs = extract_audio_embeddings(train_audio_samples, audio_predictor, max_per_class=350)
    val_audio_embs = extract_audio_embeddings(val_audio_samples, audio_predictor, max_per_class=100)

    print(f"\n[OK] Feature pre-extraction complete in {time.time() - t0:.1f}s.")

    # Build pseudo-paired datasets with structured modality dropout
    print("\nConstructing paired multimodal datasets (Structured 50/25/25 Modality Dropout)...")
    train_dataset = build_pseudo_paired_dataset(train_face_embs, train_audio_embs, samples_per_class=500, is_training=True)
    val_dataset = build_pseudo_paired_dataset(val_face_embs, val_audio_embs, samples_per_class=120, is_training=False)

    print(f"Training pairs: {len(train_dataset)} | Validation pairs: {len(val_dataset)}")

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    # Initialize Gated Multimodal Fusion Model
    model = GatedMultimodalFusionModel(embedding_dim=512, hidden_dim=256, num_classes=7).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)

    os.makedirs(os.path.dirname(checkpoint_out), exist_ok=True)
    best_joint_acc = 0.0

    print(f"\nStarting Fusion MLP Training ({epochs} Epochs on CPU)...\n")
    training_start = time.time()

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        train_corr = 0
        train_total = 0

        for face_emb, audio_emb, labels in train_loader:
            face_emb = face_emb.to(device)
            audio_emb = audio_emb.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            logits = model(face_emb, audio_emb)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * labels.size(0)
            preds = logits.argmax(dim=1)
            train_corr += (preds == labels).sum().item()
            train_total += labels.size(0)

        epoch_loss = train_loss / train_total
        epoch_acc = train_corr / train_total

        # Evaluate on validation set in all 3 modes
        val_metrics = evaluate_multimodal_model(model, val_loader, device)

        print(
            f"Epoch [{epoch:02d}/{epochs:02d}] "
            f"Train Loss: {epoch_loss:.4f} | Train Acc: {epoch_acc*100:.1f}% | "
            f"Val Joint: {val_metrics['joint_acc']*100:.1f}% | "
            f"Face-Only: {val_metrics['face_only_acc']*100:.1f}% | "
            f"Audio-Only: {val_metrics['audio_only_acc']*100:.1f}%"
        )

        # Save checkpoint based on Joint Multimodal validation accuracy
        if val_metrics["joint_acc"] > best_joint_acc:
            best_joint_acc = val_metrics["joint_acc"]
            torch.save(model.state_dict(), checkpoint_out)
            print(f"  [OK] Saved new best fusion model to {checkpoint_out} (Joint Acc: {best_joint_acc*100:.1f}%)")

    total_time = time.time() - training_start
    print("\n" + "=" * 65)
    print(f"PHASE 3 TRAINING COMPLETE in {total_time:.1f}s ({total_time/60:.2f} min).")
    print(f"Best Joint Multimodal Accuracy: {best_joint_acc*100:.2f}%")
    print("=" * 65)

    return best_joint_acc


if __name__ == "__main__":
    train_fusion_model()
