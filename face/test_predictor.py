"""
Test and verification script for FaceEmotionPredictor.
Run with: python -m face.test_predictor
"""
import sys
import os
import numpy as np
import torch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from face.predictor import FaceEmotionPredictor, CLASS_NAMES


def test_checkpoint_loads():
    """Test that the checkpoint loads successfully."""
    print("Test 1: Checkpoint loads...")
    predictor = FaceEmotionPredictor()
    assert predictor.model is not None
    assert predictor.device is not None
    print(f"  [OK] Model loaded on {predictor.device}")
    print(f"  [OK] Checkpoint: {predictor.checkpoint_path}")
    return True


def test_model_output_shape():
    """Test that model produces 7-class output."""
    print("\nTest 2: Model output shape...")
    predictor = FaceEmotionPredictor()
    dummy_face = np.random.randint(0, 255, (48, 48), dtype=np.uint8)
    probs = predictor.predict_proba(dummy_face)
    assert probs.shape == (7,), f"Expected shape (7,), got {probs.shape}"
    print(f"  [OK] Output shape: {probs.shape}")
    return True


def test_probabilities_sum_to_one():
    """Test that probabilities sum to approximately 1."""
    print("\nTest 3: Probabilities sum to 1...")
    predictor = FaceEmotionPredictor()
    dummy_face = np.random.randint(0, 255, (48, 48), dtype=np.uint8)
    probs = predictor.predict_proba(dummy_face)
    total = probs.sum()
    assert abs(total - 1.0) < 1e-5, f"Probabilities sum to {total}, not 1.0"
    print(f"  [OK] Sum: {total:.6f}")
    return True


def test_predicted_emotion_valid():
    """Test that predicted emotion is one of the 7 classes."""
    print("\nTest 4: Predicted emotion is valid...")
    predictor = FaceEmotionPredictor()
    dummy_face = np.random.randint(0, 255, (48, 48), dtype=np.uint8)
    result = predictor.predict(dummy_face)
    emotion = result['emotion']
    assert emotion in CLASS_NAMES, f"Invalid emotion: {emotion}"
    print(f"  [OK] Predicted emotion: {emotion}")
    print(f"  [OK] Confidence: {result['confidence']:.4f}")
    return True


def test_predict_returns_dict():
    """Test that predict() returns proper dict structure."""
    print("\nTest 5: Predict returns correct dict structure...")
    predictor = FaceEmotionPredictor()
    dummy_face = np.random.randint(0, 255, (48, 48), dtype=np.uint8)
    result = predictor.predict(dummy_face)

    required_keys = ['emotion', 'confidence', 'probabilities', 'all_probs']
    for key in required_keys:
        assert key in result, f"Missing key: {key}"

    assert isinstance(result['probabilities'], dict)
    assert len(result['probabilities']) == 7
    for name in CLASS_NAMES:
        assert name in result['probabilities']
        assert 0.0 <= result['probabilities'][name] <= 1.0

    assert isinstance(result['all_probs'], np.ndarray)
    assert result['all_probs'].shape == (7,)

    print(f"  [OK] All keys present")
    print(f"  [OK] Probabilities dict has 7 entries")
    print(f"  [OK] all_probs shape: {result['all_probs'].shape}")
    return True


def test_preprocess_handles_bgr():
    """Test that preprocess handles BGR input correctly."""
    print("\nTest 6: Preprocess handles BGR input...")
    predictor = FaceEmotionPredictor()
    bgr_face = np.random.randint(0, 255, (48, 48, 3), dtype=np.uint8)
    probs = predictor.predict_proba(bgr_face)
    assert probs.shape == (7,)
    print(f"  [OK] BGR input handled correctly")
    return True


def test_preprocess_handles_grayscale():
    """Test that preprocess handles grayscale input correctly."""
    print("\nTest 7: Preprocess handles grayscale input...")
    predictor = FaceEmotionPredictor()
    gray_face = np.random.randint(0, 255, (48, 48), dtype=np.uint8)
    probs = predictor.predict_proba(gray_face)
    assert probs.shape == (7,)
    print(f"  [OK] Grayscale input handled correctly")
    return True


def test_factory_function():
    """Test the create_predictor factory function."""
    print("\nTest 8: Factory function works...")
    from face.predictor import create_predictor
    predictor = create_predictor()
    assert isinstance(predictor, FaceEmotionPredictor)
    print(f"  [OK] Factory function returns predictor")
    return True


def test_get_embedding():
    """Test that get_embedding returns 512-dim vector."""
    print("\nTest 9: Get embedding returns 512-dim vector...")
    predictor = FaceEmotionPredictor()
    dummy_face = np.random.randint(0, 255, (48, 48), dtype=np.uint8)
    embedding = predictor.get_embedding(dummy_face)
    assert embedding.shape == (512,), f"Expected (512,), got {embedding.shape}"
    print(f"  [OK] Embedding shape: {embedding.shape}")
    return True


def test_invalid_image_raises():
    """Test that invalid input raises appropriate error."""
    print("\nTest 10: Invalid input raises error...")
    predictor = FaceEmotionPredictor()
    try:
        predictor.predict(None)
        assert False, "Should have raised ValueError"
    except (ValueError, TypeError):
        print(f"  [OK] Correctly raises error for None input")

    try:
        predictor.predict(np.array([]))
        assert False, "Should have raised ValueError"
    except ValueError:
        print(f"  [OK] Correctly raises error for empty array")
    return True


def test_consistency():
    """Test that repeated predictions on same input are consistent."""
    print("\nTest 11: Predictions are consistent...")
    predictor = FaceEmotionPredictor()
    dummy_face = np.random.randint(0, 255, (48, 48), dtype=np.uint8)
    result1 = predictor.predict(dummy_face)
    result2 = predictor.predict(dummy_face)
    assert result1['emotion'] == result2['emotion']
    assert abs(result1['confidence'] - result2['confidence']) < 1e-5
    print(f"  [OK] Consistent predictions")
    return True


def run_all_tests():
    """Run all verification tests."""
    print("=" * 50)
    print("FACE EMOTION PREDICTOR - VERIFICATION TESTS")
    print("=" * 50)

    tests = [
        test_checkpoint_loads,
        test_model_output_shape,
        test_probabilities_sum_to_one,
        test_predicted_emotion_valid,
        test_predict_returns_dict,
        test_preprocess_handles_bgr,
        test_preprocess_handles_grayscale,
        test_factory_function,
        test_get_embedding,
        test_invalid_image_raises,
        test_consistency,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"  [FAIL] FAILED: {e}")
            failed += 1

    print("\n" + "=" * 50)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 50)

    if failed > 0:
        sys.exit(1)

    print("\n[OK] All tests passed! Face predictor is ready.")
    return True


if __name__ == "__main__":
    run_all_tests()