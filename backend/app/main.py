from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(
    title="SkyBrain API",
    description="Real-time Flight Intelligence API",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this should be specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

from app.api import flights, weather, faa, airports, ai
app.include_router(flights.router)
app.include_router(weather.router)
app.include_router(faa.router)
app.include_router(airports.router)
from app.data.pipeline import pipeline

@app.on_event("startup")
async def startup_event():
    pipeline.start()

@app.on_event("shutdown")
async def shutdown_event():
    pipeline.stop()

app.include_router(ai.router)
