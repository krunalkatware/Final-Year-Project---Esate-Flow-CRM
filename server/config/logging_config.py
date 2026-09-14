"""
EstateFlow — Structured Production Logger
=========================================
"""
import logging
import sys


def setup_production_logging():
    """Configures structured logging output for FastAPI & Gunicorn/Uvicorn."""
    logger = logging.getLogger("estateflow")
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            '[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


logger = setup_production_logging()
