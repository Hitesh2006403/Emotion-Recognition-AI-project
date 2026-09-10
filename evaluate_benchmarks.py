import os
import numpy as np
import torch
import torch.nn.functional as F
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from face.predictor import CLASS_NAMES
from audio.predictor import AudioEmotionPredictor
from text.predictor import TextEmotionPredictor
from fusion.model import GatedMultimodalFusionModel
from fusion_v2.model import CrossModalAttentionFusionModel

CLASS_TO_IDX = {name: idx for idx, name in enumerate(CLASS_NAMES)}
EMB_CACHE_FILE = "./data/trimodal_embeddings_cache.npz"


def load_val_embeddings():
    """Load cached validation embeddings across all 3 modalities."""
    if not os.path.exists(EMB_CACHE_FILE):
        raise FileNotFoundError(f"Embeddings cache {EMB_CACHE_FILE} not found. Run fusion_v2.train first.")
    data = np.load(EMB_CACHE_FILE, allow_pickle=True)
    val_face = data["val_face"].item()
    val_audio = data["val_audio"].item()
    val_text = data["val_text"].item()
    return val_face, val_audio, val_text


def create_val_triplets(val_face, val_audio, val_text, samples_per_class=120, seed=42):
    """Create deterministic validation triplets for standardized evaluation."""
    np.random.seed(seed)
    faces_list = []
    audios_list = []
    texts_list = []
    labels_list = []

    for c in range(7):
        f_pool = val_face.get(c, [])
        a_pool = val_audio.get(c, [])
        t_pool = val_text.get(c, [])
        if len(f_pool) == 0 or len(a_pool) == 0 or len(t_pool) == 0:
            continue

        for _ in range(samples_per_class):
            f_idx = np.random.randint(0, len(f_pool))
            a_idx = np.random.randint(0, len(a_pool))
            t_idx = np.random.randint(0, len(t_pool))

            faces_list.append(f_pool[f_idx])
            audios_list.append(a_pool[a_idx])
            texts_list.append(t_pool[t_idx])
            labels_list.append(c)

    return (
        np.array(faces_list, dtype=np.float32),
        np.array(audios_list, dtype=np.float32),
        np.array(texts_list, dtype=np.float32),
        np.array(labels_list, dtype=np.int64),
    )


def evaluate_model_predictions(preds: np.ndarray, targets: np.ndarray):
    """Compute accuracy, precision, recall, and F1 (macro and weighted)."""
    acc = float(np.mean(preds == targets))
    p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(targets, preds, average="macro", zero_division=0)
    p_wt, r_wt, f1_wt, _ = precision_recall_fscore_support(targets, preds, average="weighted", zero_division=0)
    return {
        "accuracy": acc,
        "precision_macro": float(p_macro),
        "recall_macro": float(r_macro),
        "f1_macro": float(f1_macro),
        "precision_weighted": float(p_wt),
        "recall_weighted": float(r_wt),
        "f1_weighted": float(f1_wt),
    }


def run_benchmark_evaluation():
    print("=" * 70)
    print("PHASE 6: FORMAL EVALUATION, ROBUSTNESS TESTING & BASELINE COMPARISON")
    print("=" * 70)

    val_face, val_audio, val_text = load_val_embeddings()
    faces, audios, texts, targets = create_val_triplets(val_face, val_audio, val_text, samples_per_class=120)
    total_val = len(targets)
    print(f"Standardized Validation Set: {total_val} paired samples (120 per class, 7 classes).\n")

    t_faces = torch.from_numpy(faces)
    t_audios = torch.from_numpy(audios)
    t_texts = torch.from_numpy(texts)
    zeros = torch.zeros_like(t_faces)

    # 1. Load trained models
    print("Loading checkpoints...")
    # Standalone Text
    text_encoder = TextEmotionPredictor().model
    text_encoder.eval()

    # Phase 3 Gated Fusion (Face + Audio)
    gated_model = GatedMultimodalFusionModel(512, 256, 7)
    gated_model.load_state_dict(torch.load("./checkpoints/best_fusion_model.pth", map_location="cpu"))
    gated_model.eval()

    # Phase 5 Cross-Modal Attention Fusion (Face + Audio + Text)
    attn_model = CrossModalAttentionFusionModel(512, 4, 256, 7)
    attn_model.load_state_dict(torch.load("./checkpoints/best_fusion_v2_model.pth", map_location="cpu"))
    attn_model.eval()

    # -------------------------------------------------------------
    # PART 1: BASELINE ARCHITECTURAL COMPARISON
    # -------------------------------------------------------------
    print("\n" + "-" * 70)
    print("PART 1: BASELINE ARCHITECTURAL COMPARISON TABLE")
    print("-" * 70)

    results = {}

    with torch.no_grad():
        # Face-only (via Phase 3 Gated Model with audio zeroed)
        p_face = gated_model(t_faces, zeros).argmax(dim=1).numpy()
        results["Face-Only (Phase 1 Baseline)"] = evaluate_model_predictions(p_face, targets)

        # Audio-only (via Phase 3 Gated Model with face zeroed)
        p_audio = gated_model(zeros, t_audios).argmax(dim=1).numpy()
        results["Audio-Only (Phase 2B Baseline)"] = evaluate_model_predictions(p_audio, targets)

        # Text-only Standalone (Phase 4 Model)
        p_text_standalone = text_encoder.classifier(t_texts).argmax(dim=1).numpy()
        results["Text-Only Standalone (Phase 4 Model)"] = evaluate_model_predictions(p_text_standalone, targets)

        # Text-only Fallback (Phase 5 Attention Model with face & audio zeroed)
        p_text_fallback = attn_model(zeros, zeros, t_texts).argmax(dim=1).numpy()
        results["Text-Only Fallback (Phase 5 Attention)"] = evaluate_model_predictions(p_text_fallback, targets)

        # Phase 3 Gated Bimodal (Face + Audio)
        p_gated = gated_model(t_faces, t_audios).argmax(dim=1).numpy()
        results["Phase 3: Gated Bimodal (Face+Audio)"] = evaluate_model_predictions(p_gated, targets)

        # Phase 5 Cross-Modal Attention Trimodal (Face + Audio + Text)
        p_attn = attn_model(t_faces, t_audios, t_texts).argmax(dim=1).numpy()
        results["Phase 5: Cross-Modal Attention (Face+Audio+Text)"] = evaluate_model_predictions(p_attn, targets)

    print(f"{'Architecture':<42} | {'Accuracy':<8} | {'Macro F1':<8} | {'Weighted F1':<11}")
    print("-" * 76)
    for name, m in results.items():
        print(f"{name:<42} | {m['accuracy']*100:6.2f}%  | {m['f1_macro']*100:6.2f}%  | {m['f1_weighted']*100:6.2f}%")

    # -------------------------------------------------------------
    # PART 2: PER-CLASS METRICS & CONFUSION MATRIX (PHASE 5 ATTENTION)
    # -------------------------------------------------------------
    print("\n" + "-" * 70)
    print("PART 2: PER-CLASS FORMAL METRICS (PHASE 5 ATTENTION FUSION)")
    print("-" * 70)
    print(classification_report(targets, p_attn, target_names=CLASS_NAMES, digits=4))

    cm = confusion_matrix(targets, p_attn)
    print("7x7 Confusion Matrix (Rows=True, Cols=Predicted):")
    header = "          " + "".join([f"{c[:4]:>7}" for c in CLASS_NAMES])
    print(header)
    for i, row in enumerate(cm):
        row_str = f"{CLASS_NAMES[i][:8]:<10}" + "".join([f"{v:7d}" for v in row])
        print(row_str)

    # Save visual confusion matrix heatmap
    plt.figure(figsize=(8, 6))
    plt.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    plt.title("Confusion Matrix — Trimodal Cross-Modal Attention Fusion")
    plt.colorbar()
    tick_marks = np.arange(len(CLASS_NAMES))
    plt.xticks(tick_marks, CLASS_NAMES, rotation=45)
    plt.yticks(tick_marks, CLASS_NAMES)
    thresh = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], "d"), horizontalalignment="center",
                     color="white" if cm[i, j] > thresh else "black")
    plt.ylabel("True Emotion Label")
    plt.xlabel("Predicted Emotion Label")
    plt.tight_layout()
    os.makedirs("./checkpoints", exist_ok=True)
    plt.savefig("./checkpoints/confusion_matrix.png", dpi=150)
    plt.close()
    print("\n[OK] Confusion matrix heatmap saved to ./checkpoints/confusion_matrix.png")

    # -------------------------------------------------------------
    # PART 3: ROBUSTNESS TEST A — MISSING MODALITY DEGRADATION MATRIX
    # -------------------------------------------------------------
    print("\n" + "-" * 70)
    print("PART 3: ROBUSTNESS TEST A — MISSING MODALITY DEGRADATION (7 REGIMES)")
    print("-" * 70)

    regimes = [
        ("Trimodal Joint (Face + Audio + Text)", (1, 1, 1)),
        ("Bimodal: Face + Audio (Missing Text)",  (1, 1, 0)),
        ("Bimodal: Face + Text  (Missing Audio)", (1, 0, 1)),
        ("Bimodal: Audio + Text (Missing Face)",  (0, 1, 1)),
        ("Single-Modal: Face-Only Fallback",     (1, 0, 0)),
        ("Single-Modal: Audio-Only Fallback",    (0, 1, 0)),
        ("Single-Modal: Text-Only Fallback",     (0, 0, 1)),
    ]

    print(f"{'Operational Regime':<42} | {'Accuracy':<8} | {'Macro F1':<8} | {'Weighted F1':<11}")
    print("-" * 76)
    with torch.no_grad():
        for name, (uf, ua, ut) in regimes:
            f_in = t_faces if uf else zeros
            a_in = t_audios if ua else zeros
            t_in = t_texts if ut else zeros
            preds = attn_model(f_in, a_in, t_in).argmax(dim=1).numpy()
            m = evaluate_model_predictions(preds, targets)
            print(f"{name:<42} | {m['accuracy']*100:6.2f}%  | {m['f1_macro']*100:6.2f}%  | {m['f1_weighted']*100:6.2f}%")

    # -------------------------------------------------------------
    # PART 4: ROBUSTNESS TEST B — GAUSSIAN NOISE INJECTION
    # -------------------------------------------------------------
    print("\n" + "-" * 70)
    print("PART 4: ROBUSTNESS TEST B — SYNTHETIC NOISE INJECTION STRESS TEST")
    print("-" * 70)
    print("Evaluating attention resilience under additive Gaussian noise N(0, sigma^2):\n")

    sigmas = [0.1, 0.3, 0.5, 1.0]

    for mod_name in ["Face", "Audio", "Text"]:
        print(f"--> Perturbing {mod_name.upper()} modality:")
        print(f"  {'Noise Level (sigma)':<20} | {'Trimodal Accuracy':<18} | {'Noisy Modality Weight':<22}")
        print("  " + "-" * 66)
        for sig in sigmas:
            noise = torch.randn_like(t_faces) * sig
            f_in = (t_faces + noise) if mod_name == "Face" else t_faces
            a_in = (t_audios + noise) if mod_name == "Audio" else t_audios
            t_in = (t_texts + noise) if mod_name == "Text" else t_texts

            with torch.no_grad():
                logits, mod_weights, _ = attn_model(f_in, a_in, t_in, return_details=True)
                preds = logits.argmax(dim=1).numpy()
                acc = float(np.mean(preds == targets))
                mod_idx = 0 if mod_name == "Face" else (1 if mod_name == "Audio" else 2)
                avg_w = float(mod_weights[:, mod_idx].mean().item())

            print(f"  sigma = {sig:<12.1f} | {acc*100:6.2f}%            | {avg_w*100:5.2f}%")
        print()

    # -------------------------------------------------------------
    # PART 5: ROBUSTNESS TEST C — CONFLICTING MODALITY SIGNALS TEST
    # -------------------------------------------------------------
    print("-" * 70)
    print("PART 5: ROBUSTNESS TEST C — CONFLICTING MODALITY SIGNALS (MISMATCH STRESS)")
    print("-" * 70)

    # Select specific exemplar test samples
    happy_idx = CLASS_TO_IDX["happy"]
    angry_idx = CLASS_TO_IDX["angry"]
    sad_idx = CLASS_TO_IDX["sad"]
    neutral_idx = CLASS_TO_IDX["neutral"]

    f_happy = torch.from_numpy(val_face[happy_idx][0]).unsqueeze(0)
    f_sad = torch.from_numpy(val_face[sad_idx][0]).unsqueeze(0)
    f_angry = torch.from_numpy(val_face[angry_idx][0]).unsqueeze(0)

    a_angry = torch.from_numpy(val_audio[angry_idx][0]).unsqueeze(0)
    a_happy = torch.from_numpy(val_audio[happy_idx][0]).unsqueeze(0)

    t_neutral = torch.from_numpy(val_text[neutral_idx][0]).unsqueeze(0)
    t_happy = torch.from_numpy(val_text[happy_idx][0]).unsqueeze(0)

    conflict_scenarios = [
        ("Scenario 1: Sarcasm / Passive-Aggression (Smiling Face + Shouting Audio + Neutral Text)",
         f_happy, a_angry, t_neutral, "Face=Happy, Audio=Angry, Text=Neutral"),
        ("Scenario 2: Masked Grief (Crying Face + Cheerful Audio + Cheerful Text)",
         f_sad, a_happy, t_happy, "Face=Sad, Audio=Happy, Text=Happy"),
        ("Scenario 3: Controlled Rage (Angry Face + Cheerful Audio + Neutral Text)",
         f_angry, a_happy, t_neutral, "Face=Angry, Audio=Happy, Text=Neutral"),
    ]

    for title, f, a, t, desc in conflict_scenarios:
        print(f"\n{title}")
        print(f"Inputs: {desc}")
        with torch.no_grad():
            logits, mod_weights, attn_w = attn_model(f, a, t, return_details=True)
            probs = F.softmax(logits, dim=1).squeeze(0).numpy()
            entropy = -float(np.sum(probs * np.log(probs + 1e-12)))
            pred_class = CLASS_NAMES[int(np.argmax(probs))]
            conf = float(np.max(probs))
            mw = mod_weights.squeeze(0).numpy()

        print(f"Outcome Prediction: {pred_class.upper()} ({conf*100:.2f}%)")
        print(f"Prediction Entropy (Uncertainty): {entropy:.3f} nats (max possible: 1.946 nats)")
        print(f"Attention Modality Weights: Face={mw[0]*100:.1f}%, Audio={mw[1]*100:.1f}%, Text={mw[2]*100:.1f}%")

    print("\n" + "=" * 70)
    print("PHASE 6 BENCHMARK EVALUATION & ROBUSTNESS TESTING COMPLETE.")
    print("=" * 70)


if __name__ == "__main__":
    run_benchmark_evaluation()
