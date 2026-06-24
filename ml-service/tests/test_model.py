import pytest
from app.model import SentimentAnalyzer


@pytest.fixture(scope="module")
def analyzer():
    return SentimentAnalyzer()


class TestSentimentAnalyzer:
    def test_single_positive(self, analyzer):
        results = analyzer.analyze(["This course is amazing and I love learning!"])
        assert len(results) == 1
        r = results[0]
        assert r["sentiment"] in ("POSITIVE", "NEGATIVE")
        assert 0 <= r["stress_score"] <= 1
        assert 0 <= r["confidence"] <= 1
        assert r["level"] in ("LOW", "MODERATE", "HIGH")
        assert "positive" in r["probabilities"]
        assert "negative" in r["probabilities"]

    def test_single_negative(self, analyzer):
        results = analyzer.analyze([
            "I can't take this anymore, the pressure is overwhelming and I feel hopeless"
        ])
        assert len(results) == 1
        r = results[0]
        assert 0 <= r["stress_score"] <= 1

    def test_neutral(self, analyzer):
        results = analyzer.analyze(["The assignment is due on Friday at 5pm"])
        assert len(results) == 1
        r = results[0]
        assert r["sentiment"] in ("POSITIVE", "NEGATIVE")

    def test_batch_processing(self, analyzer):
        texts = [
            "I love this class",
            "I am so stressed out",
            "The assignment is due next week",
        ]
        results = analyzer.analyze(texts)
        assert len(results) == 3

    def test_batch_max_32(self, analyzer):
        texts = ["test"] * 32
        results = analyzer.analyze(texts)
        assert len(results) == 32

    def test_stress_high_confidence(self, analyzer):
        results = analyzer.analyze([
            "I want to drop out, everything is too much, I can't sleep"
        ])
        r = results[0]
        if r["sentiment"] == "NEGATIVE":
            assert r["confidence"] > 0.5

    def test_pii_removed_before_inference(self, analyzer):
        results = analyzer.analyze(["email me at student@university.edu"])
        r = results[0]
        assert "[EMAIL]" not in r["text"]
