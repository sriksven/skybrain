from fastapi import APIRouter, HTTPException
from app.services.weather import WeatherService

router = APIRouter(prefix="/weather", tags=["weather"])
service = WeatherService()

@router.get("/{airport_code}")
async def get_airport_weather(airport_code: str):
    """Get current weather for an airport."""
    weather = await service.get_current_weather(airport_code)
    if not weather:
        raise HTTPException(status_code=404, detail="Airport not found or weather unavailable")
    return weather
