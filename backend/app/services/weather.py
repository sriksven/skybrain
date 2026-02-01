import httpx
from typing import Optional, Dict
from app.services.airports import AirportService

class WeatherService:
    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    
    def __init__(self):
        self.airport_service = AirportService()
    
    async def get_current_weather(self, airport_code: str) -> Optional[Dict]:
        """Fetch current weather for a given airport code."""
        airport = self.airport_service.get_airport(airport_code)
        if not airport:
            return None
            
        params = {
            "latitude": airport["lat"],
            "longitude": airport["lon"],
            "current": ["temperature_2m", "relative_humidity_2m", "is_day", "precipitation", "rain", "showers", "snowfall", "weather_code", "wind_speed_10m", "wind_direction_10m"],
            "current": ["temperature_2m", "relative_humidity_2m", "is_day", "precipitation", "rain", "showers", "snowfall", "weather_code", "wind_speed_10m", "wind_direction_10m"],
            "temperature_unit": "celsius",
            "wind_speed_unit": "kmh",
            "precipitation_unit": "inch"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()
                
                current = data.get("current", {})
                return {
                    "airport": airport["name"],
                    "city": airport["city"],
                    "temperature": current.get("temperature_2m"),
                    "wind_speed": current.get("wind_speed_10m"),
                    "wind_direction": current.get("wind_direction_10m"),
                    "condition_code": current.get("weather_code"),
                    "is_day": current.get("is_day")
                }
            except Exception as e:
                print(f"Error fetching weather: {e}")
                return None
