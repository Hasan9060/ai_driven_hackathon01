"""
Logging configuration for the authentication service
"""
import os
import sys
import structlog
import logging
from typing import Any, Dict

def configure_logging() -> None:
    """Configure structured logging"""

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Configure standard logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    )

    # Configure specific loggers
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if os.getenv("DEBUG", "false").lower() == "true" else logging.WARNING
    )
    logging.getLogger("sqlalchemy.pool").setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)

# Create logger instance
logger = structlog.get_logger()

async def log_auth_event(
    event_type: str,
    user_id: str = None,
    ip_address: str = None,
    user_agent: str = None,
    extra: Dict[str, Any] = None
) -> None:
    """Log authentication events with structured data"""

    log_data = {
        "event_type": event_type,
        "user_id": user_id,
        "ip_address": ip_address,
        "user_agent": user_agent,
    }

    if extra:
        log_data.update(extra)

    if event_type in ["login.failed", "password.reset.requested", "account.locked"]:
        logger.warning("Auth security event", **log_data)
    else:
        logger.info("Auth event", **log_data)