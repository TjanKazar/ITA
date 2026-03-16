from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.database import engine
from app.core.logging import get_logger
from app.routers import auth, users

log = get_logger("hoops.auth")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting HOOPS Auth Service")
    yield
    log.info("HOOPS Auth Service shutting down")


app = FastAPI(
    title="HOOPS Auth Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(auth.router)
app.include_router(users.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "service": "hoops-auth"}


@app.exception_handler(Exception)
async def unhandled_exception(request: Request, exc: Exception):
    log.error("Unhandled exception on %s: %s", request.url, exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
