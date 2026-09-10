import os
import urllib.request
from collections import defaultdict
import numpy as np
import torch
from torch.utils.data import Dataset
from transformers import AutoTokenizer, AutoModel

CLASS_NAMES = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
CLASS_TO_IDX = {name: idx for idx, name in enumerate(CLASS_NAMES)}

# Canonical Google Research GoEmotions to Ekman 7-class mapping
EKMAN_MAP = {
    2: 0, 3: 0, 10: 0,  # anger, annoyance, disapproval -> angry
    11: 1,               # disgust -> disgust
    14: 2, 19: 2,        # fear, nervousness -> fear
    0: 3, 1: 3, 4: 3, 5: 3, 8: 3, 13: 3, 15: 3, 17: 3, 18: 3, 20: 3, 21: 3, 23: 3, # joy, amusement, approval, caring, desire, excitement, gratitude, love, optimism, pride, relief, admiration -> happy
    27: 4,               # neutral -> neutral
    9: 5, 12: 5, 16: 5, 24: 5, 25: 5, # disappointment, embarrassment, grief, remorse, sadness -> sad
    6: 6, 7: 6, 22: 6, 26: 6,  # confusion, curiosity, realization, surprise -> surprise
}

BASE_URL = "https://raw.githubusercontent.com/google-research/google-research/master/goemotions/data/"


def download_goemotions(data_dir: str = "./data/goemotions"):
    """Download GoEmotions train, dev, and test splits if not present."""
    os.makedirs(data_dir, exist_ok=True)
    for fname in ["train.tsv", "dev.tsv", "test.tsv"]:
        path = os.path.join(data_dir, fname)
        if not os.path.exists(path):
            print(f"Downloading GoEmotions {fname}...")
            urllib.request.urlretrieve(BASE_URL + fname, path)
            print(f"  [OK] Saved {fname} ({os.path.getsize(path)} bytes).")
    return data_dir


def parse_goemotions_split(tsv_path: str, max_per_class: int = None):
    """
    Parse a GoEmotions TSV split and map to 7 Ekman classes.
    Returns:
        List of (text, class_idx) tuples.
    """
    samples_by_class = defaultdict(list)

    with open(tsv_path, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split("\t")
            if len(parts) >= 2:
                text = parts[0].strip()
                if not text:
                    continue
                emotions = [int(x) for x in parts[1].split(",") if x.isdigit()]
                for e in emotions:
                    if e in EKMAN_MAP:
                        c = EKMAN_MAP[e]
                        samples_by_class[c].append(text)
                        break

    samples = []
    for c in range(7):
        texts = samples_by_class[c]
        if max_per_class is not None and len(texts) > max_per_class:
            texts = texts[:max_per_class]
        for t in texts:
            samples.append((t, c))

    return samples


class TextFeatureExtractor:
    """Lightweight Sentence-Transformers (all-MiniLM-L6-v2) text feature extractor."""

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2", device: str = "cpu"):
        self.device = torch.device(device)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name).to(self.device)
        self.model.eval()

    def extract_feature(self, text: str) -> np.ndarray:
        """Extract mean-pooled 384-dim embedding for a single text."""
        if not text or not text.strip():
            text = "neutral"
        inputs = self.tokenizer(
            [text], padding=True, truncation=True, max_length=128, return_tensors="pt"
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model(**inputs)
            # Mean pooling taking attention mask into account
            token_embeddings = outputs.last_hidden_state
            input_mask_expanded = inputs["attention_mask"].unsqueeze(-1).expand(token_embeddings.size()).float()
            sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1)
            sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
            mean_pooled = (sum_embeddings / sum_mask).squeeze(0)

        return mean_pooled.cpu().numpy().astype(np.float32)

    def extract_batch_features(self, texts: list, batch_size: int = 64) -> np.ndarray:
        """Batch extraction of 384-dim embeddings."""
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch_texts = [t if (t and t.strip()) else "neutral" for t in texts[i:i + batch_size]]
            inputs = self.tokenizer(
                batch_texts, padding=True, truncation=True, max_length=128, return_tensors="pt"
            ).to(self.device)
            with torch.no_grad():
                outputs = self.model(**inputs)
                token_embeddings = outputs.last_hidden_state
                input_mask_expanded = inputs["attention_mask"].unsqueeze(-1).expand(token_embeddings.size()).float()
                sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1)
                sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
                mean_pooled = sum_embeddings / sum_mask
                all_embeddings.append(mean_pooled.cpu().numpy())
        return np.vstack(all_embeddings).astype(np.float32)


class CachedTextDataset(Dataset):
    """In-memory PyTorch Dataset for pre-extracted text features."""

    def __init__(self, features: np.ndarray, labels: list or np.ndarray):
        self.features = torch.from_numpy(features).float()
        self.labels = torch.tensor(labels, dtype=torch.long)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return self.features[idx], self.labels[idx]
