from typing import List, Optional
from fastapi import APIRouter
from app.models.schemas import FlightState
from app.services.opensky import opensky_service
from app.data.pipeline import store

router = APIRouter(prefix="/flights", tags=["Flights"])

@router.get("/live", response_model=List[FlightState])
async def get_live_flights(
    lamin: float = None, 
    lomin: float = None, 
    lamax: float = None, 
    lomax: float = None
):
    """
    Get live flights from the local cached Pipeline.
    """
    # Use store instead of direct service call
    flights = store.get_all()
    
    # If store is empty, try one direct fetch immediately (fallback)
    if not flights:
        print("Store empty, fetching directly...")
        flights = await opensky_service.get_all_flights()
        store.update(flights)

    # Filter if bounds provided (client side filtering usually, but we support it here)
    if lamin and lomin and lamax and lomax:
        return [
            f for f in flights 
            if f.latitude and f.longitude and
            lamin <= f.latitude <= lamax and
            lomin <= f.longitude <= lomax
        ]
        
    return flights

@router.get("/{icao24}/track")
async def get_flight_track(icao24: str):
    """Get historical track for a specific flight."""
    return store.get_history(icao24)
