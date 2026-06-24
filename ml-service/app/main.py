import logging
import time
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from .config import settings
from .model import analyzer
from .preprocess import preprocess_batch

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

PREDICTIONS = Counter("ml_predictions_total", "Total predictions", ["sentiment", "level"])
LATENCY = Histogram("ml_request_duration_seconds", "Request latency in seconds")
BATCH_SIZE = Histogram("ml_batch_size", "Number of texts per request", buckets=[1, 2, 4, 8, 16, 32, 64])


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting ML service on port {settings.port}")
    yield
    logger.info("Shutting down ML service")


app = FastAPI(title="Student Burnout - Sentiment Analysis", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    text: Optional[str] = None
    texts: Optional[List[str]] = None

    @classmethod
    def validate_inputs(cls, data: "AnalyzeRequest"):
        if data.text and data.texts:
            raise HTTPException(400, "Provide either 'text' (single) or 'texts' (batch), not both")
        if not data.text and not data.texts:
            raise HTTPException(400, "Provide either 'text' (single) or 'texts' (batch)")
        inputs = [data.text] if data.text else data.texts
        if len(inputs) > 64:
            raise HTTPException(400, "Maximum 64 texts per request")
        for t in inputs:
            if not t or not t.strip():
                raise HTTPException(400, "Text entries cannot be empty")
        return inputs


class AnalyzeResult(BaseModel):
    text: str
    sentiment: str
    stress_score: float
    confidence: float
    level: str
    probabilities: dict


class AnalyzeResponse(BaseModel):
    results: List[AnalyzeResult]
    processed_count: int
    duration_ms: float


@app.post("/analyze", response_model=AnalyzeResponse)
@LATENCY.time()
async def analyze(request: AnalyzeRequest):
    inputs = AnalyzeRequest.validate_inputs(request)
    start = time.perf_counter()

    results = analyzer.analyze(inputs)

    duration_ms = round((time.perf_counter() - start) * 1000, 2)

    for r in results:
        PREDICTIONS.labels(sentiment=r["sentiment"], level=r["level"]).inc()
    BATCH_SIZE.observe(len(inputs))

    logger.info(f"Analyzed {len(inputs)} texts in {duration_ms}ms")

    return AnalyzeResponse(results=results, processed_count=len(inputs), duration_ms=duration_ms)


@app.post("/preprocess")
async def preprocess(request: AnalyzeRequest):
    inputs = AnalyzeRequest.validate_inputs(request)
    cleaned = preprocess_batch(inputs)
    return {"results": cleaned, "count": len(cleaned)}


@app.get("/health")
async def health():
    return {"status": "healthy", "model": settings.model_name, "device": settings.device}


@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/")
async def root():
    return {
        "service": "Student Burnout - Sentiment Analysis",
        "version": "1.0.0",
        "endpoints": {
            "POST /analyze": "Analyze text(s) for sentiment and stress level",
            "POST /preprocess": "Preprocess text(s) without inference",
            "GET /health": "Health check",
            "GET /metrics": "Prometheus metrics",
        },
    }
