from __future__ import annotations

# Configure matplotlib to use 'Agg' backend (non-interactive)
import matplotlib
matplotlib.use('Agg')  # Must be set before importing pyplot

import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.utils import get_openapi

from app.config import get_settings
from app.db.db import init_db
from app.middleware.auth_middleware import AuthMiddleware
from app.routes import auth as auth_routes
from app.routes import ehr as ehr_routes
from app.routes import fhir as fhir_routes
from app.routes import ml as ml_routes
from app.routes import patients as patients_routes
from app.routes import reports as reports_routes
from app.routes import twin as twin_routes
from app.utils.logger import get_logger

# Initialize settings and logger
settings = get_settings()
logger = get_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="DigiTwin Backend",
    description="FastAPI backend for DigiTwin medical digital twin platform.",
    version="0.1.0",
)

# ------------------------------
# Data directories
# ------------------------------
data_dir = Path("data")
data_dir.mkdir(exist_ok=True)
(data_dir / "ehr").mkdir(exist_ok=True)
(data_dir / "fhir").mkdir(exist_ok=True)
(data_dir / "ml").mkdir(exist_ok=True)

# Static file mount
app.mount("/static", StaticFiles(directory="data"), name="static")

# ------------------------------
# CORS Configuration
# ------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# ------------------------------
# Auth Middleware
# ------------------------------
app.add_middleware(
    AuthMiddleware,
    exempt_paths=["/health", "/openapi.json", "/docs", "/redoc", "/static", "/ml/pkpd-simulate"],
)


# ------------------------------
# Validation Handler
# ------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation error on %s: %s", request.url.path, exc.errors())
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


# ------------------------------
# Health
# ------------------------------
@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok"}


# ------------------------------
# Routers
# ------------------------------
app.include_router(auth_routes.router)
app.include_router(patients_routes.router)
app.include_router(fhir_routes.router)
app.include_router(ml_routes.router)
app.include_router(reports_routes.router)
app.include_router(ehr_routes.router)
app.include_router(twin_routes.router)


# ------------------------------
# Startup
# ------------------------------
@app.on_event("startup")
async def on_startup():
    logger.info("Starting DigiTwin backend in %s mode", settings.environment)
    init_db()
    logger.info("Database initialized")


@app.on_event("shutdown")
async def on_shutdown():
    logger.info("Shutting down DigiTwin backend")


# ---------------------------------------------------
# NEW: ENABLE SWAGGER JWT AUTH (Authorize button)
# ---------------------------------------------------
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="DigiTwin Backend",
        version="0.1.0",
        description="FastAPI backend for DigiTwin medical digital twin platform.",
        routes=app.routes,
    )

    # Add Bearer authentication scheme
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter Firebase ID Token. Format: Bearer <token>",
        }
    }

    # Apply security to all endpoints automatically
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method.setdefault("security", [{"BearerAuth": []}])

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

