from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.ai.engine import ai_engine
from app.services.opensky import opensky_service

router = APIRouter(prefix="/ai", tags=["AI"])

class ChatRequest(BaseModel):
    message: str
    context: str = ""

class ExplainRequest(BaseModel):
    icao24: str

@router.post("/chat")
async def chat_with_skybrain(request: ChatRequest):
    """
    Chat with SkyBrain about flights, airports, or weather.
    """
    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    response = await ai_engine.chat(request.message, request.context)
    return {"reply": response}

@router.post("/explain/{icao24}")
async def explain_flight(icao24: str):
    """
    Get a plain English explanation of a specific flight's status.
    """
    # Fetch real-time data for the flight
    # We can reuse get_all_flights but filtering is expensive. 
    # For now, let's just get the full list and find it, or use OpenSky's specific endpoint if we had it.
    # Since we don't have a single flight endpoint in service yet, we'll scan the cache/live list.
    
    # Optimization: in a real app, we'd have a specific lookup or Redis cache.
    # Here we'll grab all and filter.
    all_flights = await opensky_service.get_all_flights()
    flight = next((f for f in all_flights if f.icao24.lower() == icao24.lower()), None)
    
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found in live feed")
    
    # Convert Pydantic model to dict
    flight_data = flight.dict()
    
    explanation = await ai_engine.explain_flight(flight_data)
    return {"explanation": explanation}
