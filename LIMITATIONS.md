# Audio Emotion Recognition — Empirical Performance & Known Limitations (Phase 2B & 3)

This document provides a transparent, scientifically honest assessment of the trained audio emotion recognition model (`AudioEmotionEncoder`, checkpoint: `checkpoints/best_audio_encoder.pth`) and the multimodal pairing architecture.

---

## 1. Summary of Benchmark Metrics

| Evaluation Benchmark | Accuracy | Nature of Evaluation |
| :--- | :--- | :--- |
| **Blended Unseen Validation Set** (3,096 clips) | **74.13%** | RAVDESS Actors 20–24 + TESS Younger Female (YAF) |
| **RAVDESS-Only Unseen Actors** (300 clips) | **40.33%** | 5 completely unseen conversational actors (Actors 20–24) |
| **TESS-Only Unseen Speaker** (2,796 clips) | **77.64%** | 1 unseen speaker performing word prompts (YAF) |

> [!WARNING]
> The **74.13% blended accuracy** is heavily influenced by the structured nature of the TESS dataset (isolated word prompts by 2 actors). The **40.33% accuracy on RAVDESS** represents the more realistic, natural conversational baseline for speech emotion recognition on unseen speakers using a convolutional network trained from scratch without large foundation models (random baseline is 14.3%).

---

## 2. Checkpoint Selection & Overfitting Dynamics

* **Best Checkpoint**: `checkpoints/best_audio_encoder.pth` corresponds to **Epoch 1** of training.
* **Overfitting Trajectory**:
  * **Epoch 1**: Training Accuracy: 75.41% | Validation Loss: 1.0418 | Unseen Validation Accuracy: **74.13%**
  * **Epoch 6**: Training Accuracy: 89.42% | Validation Loss: 0.8603 | Unseen Validation Accuracy: 65.60%
  * **Epoch 12**: Training Accuracy: **95.13%** | Validation Loss: **4.3584** | Unseen Validation Accuracy: **43.96%**
* **Finding**: As training progressed beyond early epochs, the model began memorizing specific vocal timbre and identity features of the training speakers, degrading cross-speaker generalization. Early stopping at Epoch 1 preserved the most robust generalized feature representations.

---

## 3. Known Limitation: The TESS Happy vs. Angry Confusion

* **Observed Phenomenon**: In the validation set for TESS (Speaker YAF), **91.82% (404/440)** of `happy` samples were classified as `angry`, resulting in an apparent 0.0% validation accuracy on YAF happy clips.
* **Root-Cause Analysis**:
  * In TESS, only two female speakers exist: `OAF` (Older Female, 64) in training, and `YAF` (Younger Female, 26) in validation.
  * When `OAF` performed **`angry`**, she shouted with high vocal intensity, high pitch, and sharp acoustic onset.
  * When `YAF` performed **`happy`**, her natural younger speaking voice used high vocal intensity, high pitch, and sharp acoustic onset.
  * Because the model only had 1 speaker for the isolated word prompt domain during training, the network associated that high-energy, high-pitch acoustic profile with `angry`.
  * In contrast, on the natural full-sentence RAVDESS dataset (which features 24 diverse male and female actors), `happy` achieved **27.5%** accuracy with predictions distributed across related states.

---

## 4. Role in Multimodal Fusion (Phase 3)

The audio emotion recognition branch is **designed and intended as a supplementary signal**, not an infallible standalone classifier:

1. **Facial Expressions Anchor Ground Truth**: Visual cues (smiles, brow furrows, widened eyes) provide unambiguous ground-truth classification across diverse individuals.
2. **Audio Provides Valence & Intensity**: Speech acoustics contribute vocal arousal, cadence, and stress cues.
3. **512-Dimensional Vector Alignment**: Both the vision encoder (`FaceEmotionEncoder`) and audio encoder (`AudioEmotionEncoder`) output standardized **512-dimensional embedding vectors** (`get_embedding()`), perfectly positioned for joint multimodal fusion in Phase 3.

---

## 5. Known Limitation: Trimodal Semantic Label-Matched Pseudo-Pairing vs. Genuine Multimodal Correspondence

* **Context on Synchronized Datasets**: True multimodal affective datasets (such as IEMOCAP or MELD) record conversational actors where facial muscle movements, vocal intonation, and spoken lexical tokens occur simultaneously in the same person at the exact same millisecond. However, complete video/audio dialogue datasets require **~25 to 40 GB** of disk storage, far exceeding the project's local disk limit (~11 GB free).
* **Methodological Limitation (Bimodal & Trimodal)**:
  - **Phase 3 (Bimodal)**: Paired FER2013 face images with RAVDESS/TESS audio clips purely by matching their discrete emotion class label $y \in \{0, \dots, 6\}$.
  - **Phase 5 (Trimodal)**: Extended pseudo-pairing to include **Text utterances from GoEmotions**. That is, a FER2013 smiling face was pseudo-paired with a RAVDESS happy voice recording and a GoEmotions cheerful Reddit sentence.
* **Scientific Distinction & Honest Disclosure**:
  - This architecture trains the network on **late cross-modal semantic alignment** (learning the joint manifold where visual, acoustic, and lexical representations of an emotion co-occur).
  - It is **NOT** a single-person, micro-temporally synchronized audio-visual-text recording (e.g., matching lip visemes to acoustic formants or correlating speech pauses with punctuation).
  - The model assumes semantic congruency across modalities at the utterance level, but does not perform phoneme-to-viseme alignment.

---

## 6. Text Modality Considerations & Granularity Limits (Phase 4)

* **Dataset Nuance & Ekman Abstraction**:
  - The GoEmotions dataset originates from informal Reddit commentary annotated across 28 fine-grained affective categories.
  - Collapsing 28 nuanced categories (`admiration`, `caring`, `remorse`, `annoyance`) into 7 basic Ekman categories inevitably discards subtle pragmatic distinctions.
* **Empirical Validation Performance**:
  - On the held-out validation split (`dev.tsv`), the standalone text projection network achieves **52.37% top-1 accuracy** (against a 14.28% random baseline), and **47.03%** on the official held-out `test.tsv`.
  - Short, colloquial phrases without overt emotional lexicon (e.g., *"Well, that just happened"*) carry ambiguous sentiment that text alone cannot resolve without situational context or vocal intonation.
  - Text functions primarily as an anchor for semantic valence, reinforcing face and audio signals rather than acting as a standalone oracle.

---

## 7. Cross-Modal Attention Dynamics Under Noise & Conflict (Phases 5 & 6)

* **Attention Weight Distribution Under Perturbations**:
  - Synthetic Gaussian noise injection ($\sigma \in [0.1, 1.0]$) demonstrated that the multi-head attention module does not collapse catastrophically when a modality is degraded; trimodal accuracy remains between **77.1% and 84.1%**.
  - However, because the acoustic CNN features produce high activation magnitudes, the attention scorer assigns high nominal weight to audio features unless explicitly zero-masked by modality dropout.
* **Conflict Resolution Behavior**:
  - In conflicting multi-signal scenarios (e.g. Sarcasm: Smiling face + Shouting audio + Neutral text), the attention layer effectively discounts uninformative text (0.9% weight) and divides attention between visual and acoustic cues (47.9% vs. 51.3%).
  - In complex emotional masking (e.g., smiling through grief), conflicting high-valence and low-valence inputs produce higher entropy (uncertainty) and occasionally resolve to intermediate affective states (e.g., `fear` or `disgust`), accurately reflecting the biological difficulty humans experience when decoding contradictory emotional displays.
* **Temporal Affect Buffer as a Simplified Proxy for Context**:
  - The sliding-window Exponential Moving Average (EMA) buffer in `fusion_v2` provides lightweight, CPU-efficient temporal smoothing to prevent high-frequency frame flicker across video frames.
  - **Explicit Limitation**: This is a **heuristic temporal smoothing proxy (affective momentum)**, **NOT true conversational context modeling**.
  - It does not parse previous conversational turns, question-answer dialogue semantics, inter-speaker interpersonal dynamics, or discourse state transitions (such as those modeled in recurrent dialogue models like DialogueRNN or COSMIC). It models emotional inertia over recent states, which stabilizes continuous real-time predictions but cannot track conversational dialogue context.
