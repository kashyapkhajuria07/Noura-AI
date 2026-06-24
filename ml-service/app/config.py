from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_name: str = "distilbert-base-uncased-finetuned-sst-2-english"
    device: str = "cpu"
    max_length: int = 512
    batch_size: int = 32
    stress_positive_threshold: float = 0.6
    stress_negative_threshold: float = 0.9
    port: int = 8000
    log_level: str = "info"

    class Config:
        env_prefix = "ML_"


settings = Settings()
