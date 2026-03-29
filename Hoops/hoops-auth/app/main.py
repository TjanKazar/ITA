from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.database import Base, engine
from app.core.logging import get_logger
from app.routers import auth, ranking, users

log = get_logger("hoops.user")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting HOOPS User Service")
    Base.metadata.create_all(bind=engine)
    yield
    log.info("HOOPS User Service shutting down")


app = FastAPI(
    title="HOOPS User Service",
    description="User management, authentication, and ranking",
    version="0.2.0",
    lifespan=lifespan,
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(ranking.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "service": "hoops-user"}


@app.exception_handler(Exception)
async def unhandled_exception(request: Request, exc: Exception):
    log.error("Unhandled exception on %s: %s", request.url, exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})