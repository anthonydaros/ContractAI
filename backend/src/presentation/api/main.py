"""
Main FastAPI application entry point.

This module configures the FastAPI application, middleware, and routes
for the AI Contract Negotiator API.
"""
import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv, find_dotenv

# Load environment variables from root .env (searches parent directories)
load_dotenv(find_dotenv(usecwd=True))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Contract Negotiator API",
    description="Backend API for AI Contract Negotiator MVP",
    version="0.1.0",
)

# Configure CORS from environment variables
# SECURITY: Load allowed origins from env, default to localhost for development
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
allowed_origins = [origin.strip() for origin in allowed_origins]  # Clean whitespace

logger.info(f"CORS configured for origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
)


@app.get("/health")
async def health_check() -> dict:
    """
    Health check endpoint for container orchestration.

    Returns:
        dict: Status object with service health information.
    """
    return {"status": "healthy", "service": "contract-negotiator-backend"}

from .routes import upload, contracts, analysis
app.include_router(upload.router)
app.include_router(contracts.router)
app.include_router(analysis.router)
