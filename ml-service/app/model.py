import logging
from typing import List, Tuple, Optional

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from .config import settings
from .preprocess import preprocess_batch

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    def __init__(self):
        self.device = torch.device(settings.device)
        logger.info(f"Loading model: {settings.model_name} on {self.device}")
        self.tokenizer = AutoTokenizer.from_pretrained(settings.model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(
            settings.model_name
        )
        self.model.to(self.device)
        self.model.eval()
        logger.info("Model loaded successfully")

    @torch.no_grad()
    def analyze(self, texts: List[str]) -> List[dict]:
        cleaned = preprocess_batch(texts, settings.max_length)

        results = []
        for i in range(0, len(cleaned), settings.batch_size):
            batch = cleaned[i : i + settings.batch_size]
            batch_results = self._analyze_batch(batch)
            results.extend(batch_results)

        return results

    @torch.no_grad()
    def _analyze_batch(self, texts: List[str]) -> List[dict]:
        inputs = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=settings.max_length,
            return_tensors="pt",
        ).to(self.device)

        outputs = self.model(**inputs)
        probabilities = torch.softmax(outputs.logits, dim=1)
        predictions = torch.argmax(outputs.logits, dim=1)

        results = []
        for i in range(len(texts)):
            probs = probabilities[i].cpu().tolist()
            pred = predictions[i].item()
            confidence = max(probs)

            if self.model.config.id2label[pred] == "NEGATIVE":
                sentiment = "NEGATIVE"
                stress_score = round(confidence, 4)
            else:
                sentiment = "POSITIVE"
                stress_score = round(1.0 - confidence, 4)

            level = self._stress_level(stress_score)

            results.append({
                "text": texts[i][:100],
                "sentiment": sentiment,
                "stress_score": stress_score,
                "confidence": round(confidence, 4),
                "level": level,
                "probabilities": {
                    "positive": round(probs[1], 4),
                    "negative": round(probs[0], 4),
                },
            })

        return results

    def _stress_level(self, score: float) -> str:
        if score >= settings.stress_negative_threshold:
            return "HIGH"
        elif score >= settings.stress_positive_threshold:
            return "MODERATE"
        return "LOW"


analyzer = SentimentAnalyzer()
