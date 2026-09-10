"""
Test and verification suite for AudioEmotionPredictor and Audio processing pipeline (Phase 2A).
Run with: python -m audio.test_predictor
"""
import sys
import os
import tempfile
import numpy as np
import torch
from scipy.io import wavfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from audio.predictor import AudioEmotionPredictor, create_audio_predictor, CLASS_NAMES
from audio.dataset import AudioProcessor
from audio.model import AudioEmotionEncoder


def test_untrained_status():
    """Test 1: Default predictor status is is_trained=False when checkpoint is missing."""
    print("Test 1: Untrained status verification...")
    predictor = AudioEmotionPredictor(checkpoint_path="non_existent_checkpoint.pth")
    assert predictor.is_trained is False, "Expected is_trained to be False"
    print("  [OK] Predictor correctly reports is_trained=False")
    return True


def test_synthetic_waveform_generator():
    """Test 2: Synthetic audio waveform generator produces expected shape."""
    print("\nTest 2: Synthetic waveform generator...")
    processor = AudioProcessor()
    waveform = processor.generate_synthetic_waveform(duration=3.0, sample_rate=16000)
    assert isinstance(waveform, np.ndarray)
    assert waveform.shape == (48000,), f"Expected shape (48000,), got {waveform.shape}"
    assert waveform.dtype == np.float32
    print("  [OK] Synthetic waveform shape: (48000,)")
    return True


def test_spectrogram_extraction_shape():
    """Test 3: AudioProcessor extracts Log-Mel Spectrogram of shape (1, 1, 128, 128)."""
    print("\nTest 3: Log-Mel Spectrogram feature extraction shape...")
    processor = AudioProcessor()
    synthetic_wave = processor.generate_synthetic_waveform()
    tensor = processor.extract_log_mel_spectrogram(synthetic_wave)
    assert isinstance(tensor, torch.Tensor)
    assert tensor.shape == (1, 1, 128, 128), f"Expected shape (1, 1, 128, 128), got {tensor.shape}"
    print(f"  [OK] Log-Mel Spectrogram shape: {tensor.shape}")
    return True


def test_embedding_dimension():
    """Test 4: Get embedding returns a 512-dimensional vector."""
    print("\nTest 4: 512-dimensional embedding production...")
    predictor = AudioEmotionPredictor(checkpoint_path="non_existent_checkpoint.pth")
    processor = AudioProcessor()
    synthetic_wave = processor.generate_synthetic_waveform()
    embedding = predictor.get_embedding(synthetic_wave)
    assert isinstance(embedding, np.ndarray)
    assert embedding.shape == (512,), f"Expected (512,), got {embedding.shape}"
    print(f"  [OK] Audio embedding shape: {embedding.shape}")
    return True


def test_untrained_predict_raises_error():
    """Test 5: predict() and predict_proba() raise RuntimeError when is_trained=False."""
    print("\nTest 5: Untrained model raises RuntimeError for prediction...")
    predictor = AudioEmotionPredictor(checkpoint_path="non_existent_checkpoint.pth")
    processor = AudioProcessor()
    synthetic_wave = processor.generate_synthetic_waveform()

    try:
        predictor.predict(synthetic_wave)
        assert False, "predict() should have raised RuntimeError when untrained"
    except RuntimeError as e:
        print(f"  [OK] predict() correctly raised RuntimeError: is_trained=False")

    try:
        predictor.predict_proba(synthetic_wave)
        assert False, "predict_proba() should have raised RuntimeError when untrained"
    except RuntimeError:
        print(f"  [OK] predict_proba() correctly raised RuntimeError")

    try:
        predictor.predict_batch([synthetic_wave])
        assert False, "predict_batch() should have raised RuntimeError when untrained"
    except RuntimeError:
        print(f"  [OK] predict_batch() correctly raised RuntimeError")

    return True


def test_trained_checkpoint_loading_and_prediction():
    """Test 6: Loading a valid state dict sets is_trained=True and outputs predictions."""
    print("\nTest 6: Trained checkpoint loading & prediction verification...")
    with tempfile.NamedTemporaryFile(suffix=".pth", delete=False) as tmp:
        tmp_checkpoint = tmp.name

    try:
        # Create temporary dummy model state dict
        dummy_model = AudioEmotionEncoder(num_classes=7, embedding_dim=512)
        torch.save(dummy_model.state_dict(), tmp_checkpoint)

        predictor = AudioEmotionPredictor(checkpoint_path=tmp_checkpoint)
        assert predictor.is_trained is True, "Expected is_trained to be True after loading checkpoint"
        print("  [OK] Predictor loaded checkpoint and set is_trained=True")

        processor = AudioProcessor()
        synthetic_wave = processor.generate_synthetic_waveform()
        result = predictor.predict(synthetic_wave)

        assert "emotion" in result
        assert result["emotion"] in CLASS_NAMES
        assert "confidence" in result
        assert 0.0 <= result["confidence"] <= 1.0
        assert len(result["probabilities"]) == 7
        assert abs(sum(result["probabilities"].values()) - 1.0) < 1e-4

        print(f"  [OK] Predicted emotion: {result['emotion']}")
        print(f"  [OK] Confidence: {result['confidence']:.4f}")
        print(f"  [OK] Probabilities sum: {sum(result['probabilities'].values()):.6f}")

    finally:
        if os.path.exists(tmp_checkpoint):
            os.remove(tmp_checkpoint)

    return True


def test_wav_file_processing():
    """Test 7: Reading and processing an actual .wav file on disk."""
    print("\nTest 7: .wav file loading and feature extraction...")
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_wav = tmp.name

    try:
        sr = 16000
        t = np.linspace(0, 2.0, sr * 2, endpoint=False)
        audio_data = (0.5 * np.sin(2 * np.pi * 440 * t) * 32767).astype(np.int16)
        wavfile.write(tmp_wav, sr, audio_data)

        processor = AudioProcessor()
        waveform = processor.load_audio(tmp_wav)
        assert waveform.shape == (48000,)

        spectrogram = processor.extract_log_mel_spectrogram(tmp_wav)
        assert spectrogram.shape == (1, 1, 128, 128)

        predictor = AudioEmotionPredictor(checkpoint_path="non_existent_checkpoint.pth")
        embedding = predictor.get_embedding(tmp_wav)
        assert embedding.shape == (512,)

        print("  [OK] .wav file loaded and processed cleanly")
        print(f"  [OK] Extracted embedding shape: {embedding.shape}")

    finally:
        if os.path.exists(tmp_wav):
            os.remove(tmp_wav)

    return True


def test_factory_function():
    """Test 8: Factory function returns AudioEmotionPredictor instance."""
    print("\nTest 8: Factory function test...")
    predictor = create_audio_predictor(checkpoint_path="non_existent_checkpoint.pth")
    assert isinstance(predictor, AudioEmotionPredictor)
    print("  [OK] create_audio_predictor() created instance successfully")
    return True


def test_invalid_input_handling():
    """Test 9: Invalid inputs (None, empty) raise appropriate ValueError."""
    print("\nTest 9: Invalid input handling...")
    processor = AudioProcessor()
    predictor = AudioEmotionPredictor(checkpoint_path="non_existent_checkpoint.pth")

    try:
        processor.load_audio(None)
        assert False, "Should have raised ValueError"
    except ValueError:
        print("  [OK] Correctly raised ValueError for None input")

    try:
        processor.load_audio(np.array([]))
        assert False, "Should have raised ValueError"
    except ValueError:
        print("  [OK] Correctly raised ValueError for empty numpy array")

    try:
        predictor.get_embedding(None)
        assert False, "Should have raised ValueError"
    except ValueError:
        print("  [OK] Correctly raised ValueError in get_embedding for None")

    return True


def test_embedding_consistency():
    """Test 10: Repeated embedding extraction on identical input is deterministic."""
    print("\nTest 10: Embedding consistency...")
    predictor = AudioEmotionPredictor(checkpoint_path="non_existent_checkpoint.pth")
    processor = AudioProcessor()
    synthetic_wave = processor.generate_synthetic_waveform()

    emb1 = predictor.get_embedding(synthetic_wave)
    emb2 = predictor.get_embedding(synthetic_wave)

    diff = np.max(np.abs(emb1 - emb2))
    assert diff < 1e-5, f"Embeddings differ by {diff}"
    print(f"  [OK] Embedding output is perfectly consistent (max diff: {diff:.8f})")
    return True


def run_all_tests():
    """Run all Phase 2A audio verification tests."""
    print("=" * 50)
    print("AUDIO EMOTION PIPELINE (PHASE 2A) - VERIFICATION TESTS")
    print("=" * 50)

    tests = [
        test_untrained_status,
        test_synthetic_waveform_generator,
        test_spectrogram_extraction_shape,
        test_embedding_dimension,
        test_untrained_predict_raises_error,
        test_trained_checkpoint_loading_and_prediction,
        test_wav_file_processing,
        test_factory_function,
        test_invalid_input_handling,
        test_embedding_consistency,
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

    print("\n[OK] All Phase 2A audio pipeline tests passed!")
    return True


if __name__ == "__main__":
    run_all_tests()
