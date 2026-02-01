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

@router.get("/list")
async def list_airports():
    """Get all supported airports sorted alphabetically by city."""
    return airport_service.get_sorted_list()

@router.get("/search")
async def search_airport(q: str):
    """Search for airport by name, city, or code."""
    result = airport_service.search_by_term(q)
    if not result:
        raise HTTPException(status_code=404, detail="Airport not found")
    return result

@router.get("/{icao}/arrivals")
async def get_airport_arrivals(icao: str) -> List[Dict[str, Any]]:
    """Get recent arrivals for an airport."""
    return await opensky_service.get_airport_flights(icao, "arrival")

@router.get("/{icao}/departures")
async def get_airport_departures(icao: str) -> List[Dict[str, Any]]:
    """Get recent departures for an airport."""
    return await opensky_service.get_airport_flights(icao, "departure")

@router.get("/{icao}/live")
async def get_airport_live_traffic(icao: str):
    """Get live tracking states for flights near this airport (approx 50 mile radius)."""
    airport = airport_service.get_airport(icao)
    if not airport:
        # Fallback for unknown airports? Or just error.
        # For now, if dynamic airport support isn't there, we can't get coords easily.
        # But we only list 20 airports. 
        # If user searches arbitrary airport, our AirportService static list might miss.
        # But for the scope, we stick to the list or let it fail gently.
        raise HTTPException(status_code=404, detail="Airport coordinates not found")
        
    lat, lon = airport["lat"], airport["lon"]
    # Approx 1 degree = 60-69 miles. 
    # Let's do a 1 degree box.
    lamin = lat - 1
    lamax = lat + 1
    lomin = lon - 1
    lomax = lon + 1
    
    return await opensky_service.get_all_flights(lamin=lamin, lomin=lomin, lamax=lamax, lomax=lomax)
