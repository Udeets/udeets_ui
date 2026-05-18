from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.realtime.redis_client import connect_redis, disconnect_redis
from app.realtime.subscription_manager import get_subscription_manager
from app.routers.api_v1 import router as api_v1_router
from app.routers.chat_ws import router as chat_ws_router
from app.routers.health import router as health_router
from app.routers.internal_cron import router as internal_cron_router

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await connect_redis()
    if settings.chat_realtime_enabled:
        await get_subscription_manager().start()
    yield
    await get_subscription_manager().stop()
    await disconnect_redis()


app = FastAPI(title=settings.app_name, lifespan=lifespan)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_origin_regex=r"^https?://(192\.168\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(api_v1_router, prefix=settings.api_v1_prefix)
app.include_router(chat_ws_router, prefix=settings.api_v1_prefix)
app.include_router(internal_cron_router)


@app.options("/{full_path:path}", include_in_schema=False)
async def handle_preflight(request: Request, full_path: str) -> Response:
    origin = request.headers.get("origin", "http://localhost:3000")
    acr_headers = request.headers.get("access-control-request-headers", "*")
    response = Response(status_code=204)
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = acr_headers
    return response
