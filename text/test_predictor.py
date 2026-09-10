import unittest
import numpy as np
from text.predictor import TextEmotionPredictor, CLASS_NAMES


class TestTextEmotionPredictor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.predictor = TextEmotionPredictor()

    def test_01_class_names(self):
        """Test that CLASS_NAMES contains exactly the 7 expected target emotions."""
        expected = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
        self.assertEqual(CLASS_NAMES, expected)

    def test_02_initialization(self):
        """Test predictor initialization and existence of model and extractor."""
        self.assertIsNotNone(self.predictor.model)
        self.assertIsNotNone(self.predictor.extractor)
        self.assertIsInstance(self.predictor.is_trained, bool)

    def test_03_get_embedding_shape(self):
        """Test that get_embedding returns a 512-dimensional vector."""
        emb = self.predictor.get_embedding("I am so thrilled and delighted today!")
        self.assertEqual(emb.shape, (512,))

    def test_04_get_embedding_dtype(self):
        """Test that get_embedding returns float32."""
        emb = self.predictor.get_embedding("This is completely unacceptable.")
        self.assertEqual(emb.dtype, np.float32)

    def test_05_get_embedding_finite(self):
        """Test that embedding values are finite (no NaN or Inf)."""
        emb = self.predictor.get_embedding("I feel terrified of the dark.")
        self.assertTrue(np.all(np.isfinite(emb)))

    def test_06_predict_structure(self):
        """Test that predict returns the required keys."""
        res = self.predictor.predict("Thank you so much, this was wonderful!")
        self.assertIn("emotion", res)
        self.assertIn("confidence", res)
        self.assertIn("probabilities", res)

    def test_07_predict_probabilities_sum(self):
        """Test that class probabilities sum to approximately 1.0."""
        res = self.predictor.predict("Everything is going wrong, I am devastated.")
        total_p = sum(res["probabilities"].values())
        self.assertAlmostEqual(total_p, 1.0, places=4)

    def test_08_predict_valid_emotion(self):
        """Test that predicted emotion is in CLASS_NAMES."""
        res = self.predictor.predict("I had no idea you were coming!")
        self.assertIn(res["emotion"], CLASS_NAMES)
        self.assertGreaterEqual(res["confidence"], 0.0)
        self.assertLessEqual(res["confidence"], 1.0)

    def test_09_empty_string_handling(self):
        """Test that empty string does not crash and handles gracefully."""
        res = self.predictor.predict("")
        self.assertIn("emotion", res)
        self.assertEqual(res["emotion"], "neutral")

    def test_10_whitespace_string_handling(self):
        """Test that whitespace string does not crash and handles gracefully."""
        res = self.predictor.predict("   \t\n   ")
        self.assertIn("emotion", res)
        self.assertEqual(res["emotion"], "neutral")


if __name__ == "__main__":
    unittest.main()
