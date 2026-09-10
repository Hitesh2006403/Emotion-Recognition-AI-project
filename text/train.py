import os
import time
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from .model import TextEmotionEncoder
from .dataset import (
    download_goemotions,
    parse_goemotions_split,
    TextFeatureExtractor,
    CachedTextDataset,
    CLASS_NAMES,
)

CHECKPOINT_OUT = "./checkpoints/best_text_encoder.pth"
CACHE_PATH = "./data/goemotions/cached_features.npz"


def prepare_cached_features(data_dir: str = "./data/goemotions", force_recompute: bool = False):
    """Download, parse, and pre-extract 384-dim text features with caching."""
    if os.path.exists(CACHE_PATH) and not force_recompute:
        print(f"Loading cached text features from {CACHE_PATH}...")
        data = np.load(CACHE_PATH)
        return (
            data["train_x"],
            data["train_y"],
            data["val_x"],
            data["val_y"],
        )

    download_goemotions(data_dir)
    print("\nParsing GoEmotions train and dev splits...")
    train_samples = parse_goemotions_split(os.path.join(data_dir, "train.tsv"), max_per_class=800)
    val_samples = parse_goemotions_split(os.path.join(data_dir, "dev.tsv"), max_per_class=150)

    print(f"Loaded {len(train_samples)} training samples, {len(val_samples)} validation samples.")

    extractor = TextFeatureExtractor(device="cpu")
    print("\nPre-extracting 384-dim MiniLM embeddings for training set...")
    t0 = time.time()
    train_texts = [t for t, c in train_samples]
    train_y = np.array([c for t, c in train_samples], dtype=np.int64)
    train_x = extractor.extract_batch_features(train_texts, batch_size=64)
    print(f"[OK] Training features extracted in {time.time() - t0:.1f}s. Shape: {train_x.shape}")

    print("Pre-extracting 384-dim MiniLM embeddings for validation set...")
    t1 = time.time()
    val_texts = [t for t, c in val_samples]
    val_y = np.array([c for t, c in val_samples], dtype=np.int64)
    val_x = extractor.extract_batch_features(val_texts, batch_size=64)
    print(f"[OK] Validation features extracted in {time.time() - t1:.1f}s. Shape: {val_x.shape}")

    os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
    np.savez_compressed(
        CACHE_PATH,
        train_x=train_x,
        train_y=train_y,
        val_x=val_x,
        val_y=val_y,
    )
    print(f"Saved cached features to {CACHE_PATH}")

    return train_x, train_y, val_x, val_y


def train_text_model(
    epochs: int = 20,
    batch_size: int = 64,
    lr: float = 1e-3,
    checkpoint_out: str = CHECKPOINT_OUT,
):
    print("=" * 65)
    print("PHASE 4: TEXT EMOTION RECOGNITION (MINILM -> 512-DIM PROJECTION)")
    print("=" * 65)

    device = torch.device("cpu")
    print(f"Device: {device}")

    train_x, train_y, val_x, val_y = prepare_cached_features()

    train_dataset = CachedTextDataset(train_x, train_y)
    val_dataset = CachedTextDataset(val_x, val_y)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    model = TextEmotionEncoder(input_dim=384, embedding_dim=512, num_classes=7, dropout=0.2).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)

    os.makedirs(os.path.dirname(checkpoint_out), exist_ok=True)
    best_val_acc = 0.0

    print(f"\nStarting training ({epochs} epochs on CPU)...")
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        train_corr = 0
        train_total = 0

        for feats, labels in train_loader:
            feats, labels = feats.to(device), labels.to(device)
            optimizer.zero_grad()
            logits = model(feats)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * labels.size(0)
            preds = logits.argmax(dim=1)
            train_corr += (preds == labels).sum().item()
            train_total += labels.size(0)

        epoch_loss = train_loss / train_total
        epoch_acc = train_corr / train_total

        # Validation
        model.eval()
        val_corr = 0
        val_total = 0
        with torch.no_grad():
            for feats, labels in val_loader:
                feats, labels = feats.to(device), labels.to(device)
                logits = model(feats)
                preds = logits.argmax(dim=1)
                val_corr += (preds == labels).sum().item()
                val_total += labels.size(0)

        val_acc = val_corr / val_total

        print(
            f"Epoch [{epoch:02d}/{epochs:02d}] "
            f"Train Loss: {epoch_loss:.4f} | Train Acc: {epoch_acc*100:.2f}% | "
            f"Val Acc: {val_acc*100:.2f}%"
        )

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), checkpoint_out)
            print(f"  [OK] Saved new best checkpoint to {checkpoint_out} (Val Acc: {best_val_acc*100:.2f}%)")

    total_time = time.time() - start_time
    print("\n" + "=" * 65)
    print(f"TEXT ENCODER TRAINING COMPLETE in {total_time:.1f}s ({total_time/60:.2f} min).")
    print(f"Best Validation Accuracy: {best_val_acc*100:.2f}%")
    print("=" * 65)

    return best_val_acc


if __name__ == "__main__":
    train_text_model()
