from fastapi import APIRouter, HTTPException, Query
from app.services.airports import AirportService
from app.services.opensky import OpenSkyService
from typing import Dict, Any, List

router = APIRouter(prefix="/airports", tags=["airports"])
airport_service = AirportService()
opensky_service = OpenSkyService()

@router.get("/nearest")
async def get_nearest_airport(lat: float, lon: float):
    """Find the nearest major airport to coordinates."""
    airport = airport_service.find_nearest(lat, lon)
    if not airport:
        raise HTTPException(status_code=404, detail="No nearby airport found")
    return airport

@router.get("/{icao}/arrivals")
async def get_airport_arrivals(icao: str) -> List[Dict[str, Any]]:
    """Get recent arrivals for an airport."""
    return await opensky_service.get_airport_flights(icao, "arrival")

@router.get("/{icao}/departures")
async def get_airport_departures(icao: str) -> List[Dict[str, Any]]:
    """Get recent departures for an airport."""
    return await opensky_service.get_airport_flights(icao, "departure")
