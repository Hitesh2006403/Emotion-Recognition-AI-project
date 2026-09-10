import os
import glob
import time
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import numpy as np

from .model import AudioEmotionEncoder
from .dataset import AudioProcessor
from .predictor import CLASS_NAMES

# Target 7 emotion mapping
EMOTION_MAP = {
    # RAVDESS mapping (Numeric IDs in filename: 03-01-XX-...)
    "ravdess": {
        "01": "neutral",
        "02": "neutral",   # calm mapped to neutral
        "03": "happy",
        "04": "sad",
        "05": "angry",
        "06": "fear",
        "07": "disgust",
        "08": "surprise",
    },
    # TESS mapping (Folder/filename string keywords)
    "tess": {
        "angry": "angry",
        "disgust": "disgust",
        "fear": "fear",
        "happy": "happy",
        "neutral": "neutral",
        "sad": "sad",
        "ps": "surprise",
        "pleasant_surprised": "surprise",
        "surprised": "surprise",
    }
}

CLASS_TO_IDX = {name: idx for idx, name in enumerate(CLASS_NAMES)}


def download_audio_datasets(data_dir: str = "./data"):
    """Download RAVDESS and TESS datasets via kagglehub if not present."""
    os.makedirs(data_dir, exist_ok=True)
    ravdess_path = os.path.join(data_dir, "ravdess")
    tess_path = os.path.join(data_dir, "tess")

    import kagglehub

    ravdess_wavs = glob.glob(os.path.join(ravdess_path, "**", "*.wav"), recursive=True)
    if not ravdess_wavs:
        print("Downloading RAVDESS dataset...")
        dl_path = kagglehub.dataset_download("uwrfai/ravdess-emotional-speech-audio")
        ravdess_path = dl_path

    tess_wavs = glob.glob(os.path.join(tess_path, "**", "*.wav"), recursive=True)
    if not tess_wavs:
        print("Downloading TESS dataset...")
        dl_path = kagglehub.dataset_download("ejlok1/toronto-emotional-speech-set-tess")
        tess_path = dl_path

    return ravdess_path, tess_path


def parse_dataset_speaker_split(data_dir: str = "./data"):
    """
    Parse audio samples and perform STRICT SPEAKER-INDEPENDENT SPLITTING:
    - RAVDESS: Actors 01-19 -> Train, Actors 20-24 -> Val
    - TESS: OAF (Older Female) -> Train, YAF (Younger Female) -> Val

    Returns:
        Tuple of (train_samples, val_samples)
    """
    train_samples = []
    val_samples = []

    search_dirs = [data_dir, os.path.expanduser("~/.cache/kagglehub/datasets")]
    all_wavs = []
    for d in search_dirs:
        if os.path.exists(d):
            all_wavs.extend(glob.glob(os.path.join(d, "**", "*.wav"), recursive=True))

    ravdess_file_set = set()

    for path in all_wavs:
        basename = os.path.basename(path)
        parts = basename.split("-")
        if len(parts) >= 7 and parts[0] == "03":
            emotion_code = parts[2]
            actor_str = parts[6].split(".")[0]
            try:
                actor_id = int(actor_str)
            except ValueError:
                continue

            if emotion_code in EMOTION_MAP["ravdess"]:
                emotion_name = EMOTION_MAP["ravdess"][emotion_code]
                class_idx = CLASS_TO_IDX[emotion_name]
                ravdess_file_set.add(path)

                # Speaker-independent split for RAVDESS:
                # Actors 20-24 (5 actors) -> Validation (~20%), Actors 1-19 -> Train (~80%)
                if actor_id >= 20:
                    val_samples.append((path, class_idx))
                else:
                    train_samples.append((path, class_idx))

    for path in all_wavs:
        if path in ravdess_file_set:
            continue
        path_lower = path.lower()
        for key, emotion_name in EMOTION_MAP["tess"].items():
            if key in path_lower:
                class_idx = CLASS_TO_IDX[emotion_name]
                filename = os.path.basename(path).lower()

                # Speaker-independent split for TESS:
                # OAF (Older Female) -> Train, YAF (Younger Female) -> Validation
                if "yaf_" in filename or "yaf_" in path_lower:
                    val_samples.append((path, class_idx))
                else:
                    train_samples.append((path, class_idx))
                break

    return train_samples, val_samples


class CachedSERDataset(Dataset):
    """CPU-Optimized Dataset with Spectrogram in-memory caching."""

    def __init__(self, samples: list, processor: AudioProcessor = None):
        self.processor = processor or AudioProcessor()
        self.features = []
        self.labels = []

        print(f"Pre-extracting Spectrogram features into memory ({len(samples)} samples)...")
        start_time = time.time()

        for idx, (file_path, label) in enumerate(samples):
            try:
                spec = self.processor.extract_log_mel_spectrogram(file_path).squeeze(0)
                self.features.append(spec)
                self.labels.append(label)
            except Exception as e:
                continue

            if (idx + 1) % 1000 == 0 or (idx + 1) == len(samples):
                print(f"  Processed [{idx + 1}/{len(samples)}] audio clips...")

        elapsed = time.time() - start_time
        print(f"[OK] Feature extraction complete in {elapsed:.1f}s ({len(self.features)} valid samples stored in RAM).")

    def __len__(self):
        return len(self.features)

    def __getitem__(self, idx):
        return self.features[idx], torch.tensor(self.labels[idx], dtype=torch.long)


def train_audio_model(
    data_dir: str = "./data",
    epochs: int = 12,
    batch_size: int = 32,
    lr: float = 1e-3,
    checkpoint_out: str = "./checkpoints/best_audio_encoder.pth",
):
    """
    Train AudioEmotionEncoder using STRICT SPEAKER-INDEPENDENT SPLITTING.
    """
    print("=" * 60)
    print("PHASE 2B: SPEAKER-INDEPENDENT AUDIO EMOTION TRAINING")
    print("=" * 60)

    device = torch.device("cpu")
    print(f"Executing on: {device}")

    train_samples, val_samples = parse_dataset_speaker_split(data_dir)
    print(f"Speaker-Independent Split: Train = {len(train_samples)} samples | Val = {len(val_samples)} samples")

    if len(train_samples) == 0 or len(val_samples) == 0:
        raise RuntimeError("Dataset sample parsing failed!")

    processor = AudioProcessor()
    print("\nPreparing Train Dataset (Speakers: RAVDESS Actors 1-19 + TESS OAF):")
    train_dataset = CachedSERDataset(train_samples, processor)

    print("\nPreparing Validation Dataset (UNSEEN Speakers: RAVDESS Actors 20-24 + TESS YAF):")
    val_dataset = CachedSERDataset(val_samples, processor)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    model = AudioEmotionEncoder(num_classes=7, embedding_dim=512).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)

    os.makedirs(os.path.dirname(checkpoint_out), exist_ok=True)
    best_val_acc = 0.0

    print("\nStarting Speaker-Independent training loop (12 Epochs on CPU)...\n")
    training_start = time.time()

    for epoch in range(1, epochs + 1):
        epoch_start = time.time()

        # Training Phase
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0

        for specs, labels in train_loader:
            specs, labels = specs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(specs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * specs.size(0)
            preds = outputs.argmax(dim=1)
            train_correct += (preds == labels).sum().item()
            train_total += specs.size(0)

        train_epoch_loss = train_loss / train_total
        train_epoch_acc = train_correct / train_total

        # Validation Phase (Unseen Speakers)
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        class_correct = [0] * 7
        class_total = [0] * 7

        with torch.no_grad():
            for specs, labels in val_loader:
                specs, labels = specs.to(device), labels.to(device)
                outputs = model(specs)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * specs.size(0)
                preds = outputs.argmax(dim=1)
                val_correct += (preds == labels).sum().item()
                val_total += specs.size(0)

                for p, l in zip(preds, labels):
                    if p == l:
                        class_correct[l.item()] += 1
                    class_total[l.item()] += 1

        val_epoch_loss = val_loss / val_total
        val_epoch_acc = val_correct / val_total
        epoch_sec = time.time() - epoch_start

        print(
            f"Epoch [{epoch:02d}/{epochs:02d}] ({epoch_sec:.1f}s) "
            f"Train Loss: {train_epoch_loss:.4f} | Train Acc: {train_epoch_acc*100:.2f}% | "
            f"Val Loss (Unseen Speakers): {val_epoch_loss:.4f} | Val Acc: {val_epoch_acc*100:.2f}%"
        )

        if val_epoch_acc > best_val_acc:
            best_val_acc = val_epoch_acc
            torch.save(model.state_dict(), checkpoint_out)
            print(f"  [OK] Saved new best checkpoint to {checkpoint_out} (Unseen Speaker Val Acc: {best_val_acc*100:.2f}%)")

    total_training_sec = time.time() - training_start
    print("\n" + "=" * 60)
    print(f"SPEAKER-INDEPENDENT TRAINING COMPLETE in {total_training_sec/60:.2f} minutes.")
    print(f"Best Speaker-Independent Validation Accuracy: {best_val_acc*100:.2f}%")
    print("=" * 60)

    print("\nPer-Class Speaker-Independent Validation Performance:")
    for idx, name in enumerate(CLASS_NAMES):
        tot = class_total[idx]
        corr = class_correct[idx]
        acc = (corr / tot * 100) if tot > 0 else 0.0
        print(f"  {name:<10}: {acc:6.2f}% ({corr}/{tot})")

    return best_val_acc


if __name__ == "__main__":
    download_audio_datasets()
    train_audio_model()
