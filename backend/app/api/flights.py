from fastapi import APIRouter
from app.services.opensky import OpenSkyService
from typing import List, Optional
from app.models.schemas import FlightState

router = APIRouter(prefix="/flights", tags=["flights"])
service = OpenSkyService()

@router.get("/live", response_model=List[FlightState])
async def get_live_flights(
    lamin: Optional[float] = None, 
    lomin: Optional[float] = None, 
    lamax: Optional[float] = None, 
    lomax: Optional[float] = None
):
    """Get all current live flights, optionally filtered by area."""
    flights = await service.get_all_flights(lamin, lomin, lamax, lomax)
    return flights
