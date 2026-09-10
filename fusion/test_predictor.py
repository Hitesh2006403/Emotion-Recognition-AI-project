"""
Test and verification suite for MultimodalEmotionPredictor (Phase 3).
Run with: python -m fusion.test_predictor
"""
import sys
import os
import numpy as np
import torch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fusion.predictor import MultimodalEmotionPredictor, create_multimodal_predictor, CLASS_NAMES
from fusion.model import GatedMultimodalFusionModel


def get_dummy_inputs():
    """Generate synthetic face crop and audio waveform for contract testing."""
    dummy_face = np.random.randint(0, 255, (48, 48), dtype=np.uint8)
    t = np.linspace(0, 3.0, 48000, endpoint=False)
    dummy_audio = (0.5 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)
    return dummy_face, dummy_audio


def test_subpredictors_initialize():
    print("Test 1: Sub-predictors initialize...")
    predictor = MultimodalEmotionPredictor()
    assert predictor.face_predictor is not None
    assert predictor.audio_predictor is not None
    assert predictor.model is not None
    print(f"  [OK] Model initialized on {predictor.device}")
    return True


def test_joint_multimodal_prediction():
    print("\nTest 2: Joint multimodal prediction (Face + Audio)...")
    predictor = MultimodalEmotionPredictor()
    dummy_face, dummy_audio = get_dummy_inputs()

    result = predictor.predict(face_image=dummy_face, audio_source=dummy_audio)
    assert result["modality"] == "multimodal"
    assert result["emotion"] in CLASS_NAMES
    assert 0.0 <= result["confidence"] <= 1.0
    assert len(result["probabilities"]) == 7
    assert result["all_probs"].shape == (7,)
    print(f"  [OK] Joint prediction emotion: {result['emotion']} ({result['confidence']*100:.1f}%)")
    return True


def test_face_only_fallback():
    print("\nTest 3: Face-only fallback prediction...")
    predictor = MultimodalEmotionPredictor()
    dummy_face, _ = get_dummy_inputs()

    result = predictor.predict(face_image=dummy_face, audio_source=None)
    assert result["modality"] == "face_only"
    assert result["emotion"] in CLASS_NAMES
    assert len(result["probabilities"]) == 7
    print(f"  [OK] Face-only fallback emotion: {result['emotion']} ({result['confidence']*100:.1f}%)")
    return True


def test_audio_only_fallback():
    print("\nTest 4: Audio-only fallback prediction...")
    predictor = MultimodalEmotionPredictor()
    _, dummy_audio = get_dummy_inputs()

    result = predictor.predict(face_image=None, audio_source=dummy_audio)
    assert result["modality"] == "audio_only"
    assert result["emotion"] in CLASS_NAMES
    assert len(result["probabilities"]) == 7
    print(f"  [OK] Audio-only fallback emotion: {result['emotion']} ({result['confidence']*100:.1f}%)")
    return True


def test_both_none_raises_error():
    print("\nTest 5: Neither modality provided raises ValueError...")
    predictor = MultimodalEmotionPredictor()
    try:
        predictor.predict(face_image=None, audio_source=None)
        assert False, "Should have raised ValueError"
    except ValueError:
        print("  [OK] Correctly raised ValueError when neither modality was provided")
    return True


def test_probabilities_sum_to_one():
    print("\nTest 6: Probabilities sum to 1.0 in all regimes...")
    predictor = MultimodalEmotionPredictor()
    dummy_face, dummy_audio = get_dummy_inputs()

    res_joint = predictor.predict(dummy_face, dummy_audio)
    res_face = predictor.predict(dummy_face, None)
    res_audio = predictor.predict(None, dummy_audio)

    for mode, res in [("joint", res_joint), ("face", res_face), ("audio", res_audio)]:
        prob_sum = float(res["all_probs"].sum())
        assert abs(prob_sum - 1.0) < 1e-4, f"{mode} probs sum to {prob_sum}, not 1.0"
        print(f"  [OK] {mode.capitalize()} mode probabilities sum: {prob_sum:.6f}")
    return True


def test_fused_embedding_shape():
    print("\nTest 7: Fused embedding returns 512-dim vector...")
    predictor = MultimodalEmotionPredictor()
    dummy_face, dummy_audio = get_dummy_inputs()

    emb = predictor.get_fused_embedding(dummy_face, dummy_audio)
    assert isinstance(emb, np.ndarray)
    assert emb.shape == (512,), f"Expected (512,), got {emb.shape}"
    print(f"  [OK] Fused embedding vector shape: {emb.shape}")
    return True


def test_gate_weights_range():
    print("\nTest 8: Dynamic gate weights are within [0, 1] and sum to 1.0...")
    predictor = MultimodalEmotionPredictor()
    dummy_face, dummy_audio = get_dummy_inputs()

    result = predictor.predict(dummy_face, dummy_audio)
    gw = result["gate_weights"]
    assert 0.0 <= gw["face_weight"] <= 1.0
    assert 0.0 <= gw["audio_weight"] <= 1.0
    assert abs(gw["face_weight"] + gw["audio_weight"] - 1.0) < 1e-5
    print(f"  [OK] Face weight: {gw['face_weight']*100:.1f}%, Audio weight: {gw['audio_weight']*100:.1f}%")
    return True


def test_factory_function():
    print("\nTest 9: Factory function create_multimodal_predictor()...")
    predictor = create_multimodal_predictor()
    assert isinstance(predictor, MultimodalEmotionPredictor)
    print("  [OK] Factory function returned MultimodalEmotionPredictor instance")
    return True


def test_predict_batch():
    print("\nTest 10: predict_batch() handles list of inputs...")
    predictor = MultimodalEmotionPredictor()
    dummy_face, dummy_audio = get_dummy_inputs()

    faces = [dummy_face, dummy_face, None]
    audios = [dummy_audio, None, dummy_audio]

    results = predictor.predict_batch(faces, audios)
    assert len(results) == 3
    assert results[0]["modality"] == "multimodal"
    assert results[1]["modality"] == "face_only"
    assert results[2]["modality"] == "audio_only"
    print("  [OK] Batch prediction handled multimodal, face-only, and audio-only inputs correctly")
    return True


def run_all_tests():
    print("=" * 55)
    print("MULTIMODAL EMOTION PREDICTOR (PHASE 3) - VERIFICATION")
    print("=" * 55)

    tests = [
        test_subpredictors_initialize,
        test_joint_multimodal_prediction,
        test_face_only_fallback,
        test_audio_only_fallback,
        test_both_none_raises_error,
        test_probabilities_sum_to_one,
        test_fused_embedding_shape,
        test_gate_weights_range,
        test_factory_function,
        test_predict_batch,
    ]

    passed = 0
    failed = 0

    for t in tests:
        try:
            t()
            passed += 1
        except Exception as e:
            print(f"  [FAIL] FAILED: {e}")
            failed += 1

    print("\n" + "=" * 55)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 55)

    if failed > 0:
        sys.exit(1)

    print("\n[OK] All Phase 3 Multimodal tests passed!")
    return True


if __name__ == "__main__":
    run_all_tests()
