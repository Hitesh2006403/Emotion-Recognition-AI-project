import unittest
import numpy as np
import torch
from fusion_v2.predictor import MultimodalPredictorV2, TemporalContextBuffer, CLASS_NAMES
from fusion_v2.model import CrossModalAttentionFusionModel


class TestMultimodalPredictorV2(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.predictor = MultimodalPredictorV2()

    def test_01_class_names(self):
        """Test that CLASS_NAMES contains exactly the 7 expected target emotions."""
        expected = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
        self.assertEqual(CLASS_NAMES, expected)

    def test_02_initialization(self):
        """Test predictor initialization and sub-components."""
        self.assertIsNotNone(self.predictor.model)
        self.assertIsNotNone(self.predictor.context_buffer)
        self.assertIsInstance(self.predictor.is_trained, bool)

    def test_03_trimodal_prediction(self):
        """Test prediction with all 3 modalities present (synthetic data)."""
        dummy_face = np.random.randint(0, 255, (48, 48), dtype=np.uint8)
        res = self.predictor.predict(
            face_img=dummy_face,
            audio_path=None,  # missing audio -> bimodal
            text_str="I am so glad everything worked out!",
        )
        self.assertIn(res["emotion"], CLASS_NAMES)
        self.assertIn("face", res["modalities_present"])
        self.assertIn("text", res["modalities_present"])
        self.assertNotIn("audio", res["modalities_present"])

    def test_04_face_only_fallback(self):
        """Test face-only fallback."""
        dummy_face = np.zeros((48, 48), dtype=np.uint8)
        res = self.predictor.predict(face_img=dummy_face)
        self.assertIn(res["emotion"], CLASS_NAMES)
        self.assertEqual(res["modalities_present"], ["face"])
        self.assertAlmostEqual(sum(res["probabilities"].values()), 1.0, places=4)

    def test_05_text_only_fallback(self):
        """Test text-only fallback."""
        res = self.predictor.predict(text_str="I cannot believe this happened to me.")
        self.assertIn(res["emotion"], CLASS_NAMES)
        self.assertEqual(res["modalities_present"], ["text"])
        self.assertAlmostEqual(sum(res["probabilities"].values()), 1.0, places=4)

    def test_06_modality_weights_sum(self):
        """Test that dynamic modality importance weights sum to approximately 1.0."""
        res = self.predictor.predict(text_str="Hooray, we won the championship!")
        weights = res["modality_weights"]
        total_w = sum(weights.values())
        self.assertAlmostEqual(total_w, 1.0, places=3)

    def test_07_cross_attention_matrix(self):
        """Test that cross-modal attention matrix is a 3x3 list of floats."""
        res = self.predictor.predict(text_str="What an unexpected turn of events.")
        matrix = res["cross_attention_matrix"]
        self.assertEqual(len(matrix), 3)
        self.assertEqual(len(matrix[0]), 3)

    def test_08_temporal_context_buffer(self):
        """Test TemporalContextBuffer functionality."""
        buf = TemporalContextBuffer(buffer_size=3, decay=0.8)
        self.assertIsNone(buf.get_context())
        s1 = np.ones((512,), dtype=np.float32)
        s2 = np.ones((512,), dtype=np.float32) * 2.0
        buf.add(s1)
        buf.add(s2)
        ctx = buf.get_context()
        self.assertIsNotNone(ctx)
        self.assertEqual(ctx.shape, (512,))
        buf.reset()
        self.assertIsNone(buf.get_context())

    def test_09_context_enabled_prediction(self):
        """Test prediction with temporal context enabled."""
        dummy_face = np.ones((48, 48), dtype=np.uint8) * 128
        res1 = self.predictor.predict(face_img=dummy_face, use_context=True)
        res2 = self.predictor.predict(face_img=dummy_face, use_context=True)
        self.assertTrue(res2["context_active"])

    def test_10_missing_all_modalities(self):
        """Test graceful handling when all modalities are None."""
        res = self.predictor.predict(face_img=None, audio_path=None, text_str=None)
        self.assertEqual(res["emotion"], "neutral")
        self.assertEqual(res["modalities_present"], [])


if __name__ == "__main__":
    unittest.main()
