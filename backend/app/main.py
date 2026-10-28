import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import settings
from app.db import engine, SessionLocal, init_db
from app.api.v1.brands import router as brands_router
from app.api.v1.knowledge import router as knowledge_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.decisions import router as decisions_router
from app.seed.seed_demo import seed_demo_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("inkloom")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    try:
        init_db()
        logger.info("Database tables initialized.")
        if settings.ENABLE_DEMO_SEED:
            with SessionLocal() as db:
                seed_demo_data(db)
            logger.info("Demo fixtures verified.")
    except Exception as e:
        logger.error(f"Startup initialization error: {e}")
    yield


app = FastAPI(
    title="Inkloom Guardian API",
    version="1.0.0",
    description="Brand-agnostic AI & deterministic content governance engine",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standard Error Envelopes
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": {"code": "INTERNAL_SERVER_ERROR", "message": "An internal error occurred."}},
    )


# Health Check Endpoint
@app.get("/health", tags=["system"])
def health_check():
    db_status = "connected"
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unavailable: {str(e)}"

    return {
        "status": "healthy" if "unavailable" not in db_status else "degraded",
        "service": "inkloom-guardian-api",
        "version": "1.0.0",
        "database": db_status,
        "ai_enabled": bool(settings.LLM_API_KEY),
        "rules_engine": "active",
    }


# Sample demo draft fixture endpoint
@app.get("/api/v1/demo/fixture", tags=["demo"])
def get_demo_fixture():
    from pathlib import Path
    import json

    if not settings.ENABLE_DEMO_SEED:
        return {"enabled": False}

    fixture_path = Path(__file__).parent / "seed" / "demo_brand.json"
    if not fixture_path.exists():
        return {"enabled": False}

    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return {
        "enabled": True,
        "brand_slug": data.get("brand", {}).get("slug"),
        "sample_draft": data.get("sample_draft", {}),
    }


# Register v1 routes
app.include_router(brands_router, prefix="/api/v1")
app.include_router(knowledge_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")
app.include_router(decisions_router, prefix="/api/v1")
