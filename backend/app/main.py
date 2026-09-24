
import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.routes.products import router
from backend.app.routes.admin import router as admin_router
from backend.app.routes.order import router as orders_router
from backend.app.routes.customer import router as customer_router
from backend.app.routes.store_settings import (
    router as store_settings_router
)
from backend.app.limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

load_dotenv()


# ============================================================
# ENVIRONMENT
# ============================================================

ENVIRONMENT = os.getenv(
    "ENVIRONMENT",
    "development"
).lower()


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="Mimi Luxe API",
    docs_url=(
        "/docs"
        if ENVIRONMENT != "production"
        else None
    ),
    redoc_url=(
        "/redoc"
        if ENVIRONMENT != "production"
        else None
    ),
)

app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler
)

# ============================================================
# ALLOWED FRONTEND ORIGINS
# ============================================================

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://127.0.0.1:5500,http://localhost:5500"
    ).split(",")
    if origin.strip()
]


if not allowed_origins:
    raise RuntimeError(
        "ALLOWED_ORIGINS must contain at least one origin."
    )


# ============================================================
# TRUSTED HOSTS
# ============================================================

allowed_hosts = [
    host.strip()
    for host in os.getenv(
        "ALLOWED_HOSTS",
        "127.0.0.1,localhost"
    ).split(",")
    if host.strip()
]


if not allowed_hosts:
    raise RuntimeError(
        "ALLOWED_HOSTS must contain at least one host."
    )


app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=allowed_hosts,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
    ],
    expose_headers=['X-Total-Count'],
)


# ============================================================
# SECURITY RESPONSE HEADERS
# ============================================================

@app.middleware("http")
async def add_security_headers(
    request: Request,
    call_next
):
    response = await call_next(request)

    response.headers[
        "X-Content-Type-Options"
    ] = "nosniff"

    response.headers[
        "X-Frame-Options"
    ] = "DENY"

    response.headers[
        "Referrer-Policy"
    ] = "strict-origin-when-cross-origin"

    response.headers[
        "Permissions-Policy"
    ] = (
        "camera=(), "
        "microphone=(), "
        "geolocation=()"
    )

    response.headers[
        "X-Permitted-Cross-Domain-Policies"
    ] = "none"

    response.headers[
        "Cross-Origin-Opener-Policy"
    ] = "same-origin"

    if ENVIRONMENT == "production":
        response.headers[
            "Strict-Transport-Security"
        ] = (
            "max-age=31536000; "
            "includeSubDomains"
        )

    return response


# ============================================================
# ROUTES
# ============================================================

app.include_router(router)
app.include_router(admin_router)
app.include_router(orders_router)
app.include_router(customer_router)
app.include_router(store_settings_router)


# ============================================================
# UPLOADS
# ============================================================

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)


# ============================================================
# HEALTH / ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Mimi Luxe API is running"
    }
