"""
Application configuration
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

# Get the directory of this file
current_dir = Path(__file__).parent
env_file = current_dir.parent / ".env"


class Settings(BaseSettings):
    """Application settings"""

    # Cohere Configuration
    cohere_api_key: str

    # Qdrant Configuration
    qdrant_url: str
    qdrant_api_key: str
    qdrant_collection_name: str = "book_content"

    # Database Configuration
    database_url: str

    # Application Configuration
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 43200  # 30 days

    # Frontend Configuration
    frontend_url: str
    docs_base_url: str

    # Performance Settings
    max_content_chunks: int = 5
    embedding_batch_size: int = 50
    request_timeout: int = 30

    # Development Settings
    debug: bool = False
    environment: str = "development"

    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60

    # Monitoring
    log_level: str = "INFO"
    prometheus_port: int = 8001

    class Config:
        env_file = env_file
        case_sensitive = False


# Global settings instance
settings = Settings()