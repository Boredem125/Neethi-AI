"""
NEETHI AI — FastAPI Entry Point
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.core.config import settings
from app.api.routes import router

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(levelname)s | %(message)s")
logger = logging.getLogger("neethi")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("NEETHI AI — ನೀತಿ Starting...")
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    from app.services.groq_service import groq_service
    logger.info(f"Groq API: {'configured' if groq_service.is_available() else 'NOT configured'}")
    yield
    logger.info("NEETHI AI shutting down")


app = FastAPI(
    title="NEETHI AI — ನೀತಿ",
    description="AI-powered tender evaluation for Karnataka government procurement.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"name": "NEETHI AI — ನೀತಿ", "tagline": "ನ್ಯಾಯ ಖಚಿತ. ನಿರ್ಣಯ ಸ್ಪಷ್ಟ.", "version": settings.APP_VERSION, "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
