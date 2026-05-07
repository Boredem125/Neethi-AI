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

# Global flag to ensure we only try to seed once per instance startup
_seeded = False

@app.middleware("http")
async def ensure_seeded_middleware(request, call_next):
    global _seeded
    if not _seeded and request.url.path.startswith("/api"):
        try:
            from app.core.seed import run_auto_seed
            run_auto_seed()
            _seeded = True
        except Exception as e:
            logger.error(f"Seeding failed: {e}")
    return await call_next(request)

# Use /api prefix locally, but strip it for Vercel since Vercel's routePrefix already handles it
api_prefix = "" if os.getenv("VERCEL") else "/api"
app.include_router(router, prefix=api_prefix)


@app.get("/")
async def root():
    return {"name": "NEETHI AI — ನೀತಿ", "tagline": "ನ್ಯಾಯ ಖಚಿತ. ನಿರ್ಣಯ ಸ್ಪಷ್ಟ.", "version": settings.APP_VERSION, "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
