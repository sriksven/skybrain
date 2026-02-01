import httpx
from typing import List, Optional, Dict, Any
from app.models.schemas import FlightState
import time
import json

class OpenSkyService:
    BASE_URL = "https://opensky-network.org/api"
    
    # Simple in-memory cache to respect rate limits
    _cache = {}
    _cache_ttl = 10  # 10 seconds cache
    
    async def get_all_flights(self, lamin: float = None, lomin: float = None, lamax: float = None, lomax: float = None) -> List[FlightState]:
        """Fetch all visible flights, optionally filtered by bounding box."""
        
        # Create a unique cache key based on parameters
        params_key = f"{lamin}_{lomin}_{lamax}_{lomax}" if all(v is not None for v in [lamin, lomin, lamax, lomax]) else "global"
        cache_key = f"flights_{params_key}"
        
        current_time = time.time()
        
        if cache_key in self._cache:
            timestamp, data = self._cache[cache_key]
            if current_time - timestamp < self._cache_ttl:
                return data
                
        async with httpx.AsyncClient() as client:
            try:
                params = {}
                if all(v is not None for v in [lamin, lomin, lamax, lomax]):
                    params = {
                        "lamin": lamin,
                        "lomin": lomin,
                        "lamax": lamax,
                        "lomax": lomax
                    }

                response = await client.get(f"{self.BASE_URL}/states/all", params=params)
                response.raise_for_status()
                data = response.json()
                
                states = []
                if data.get("states"):
                    for s in data["states"]:
                        # OpenSky returns a list of values, map to our model
                        flight = FlightState(
                            icao24=s[0],
                            callsign=s[1].strip() if s[1] else None,
                            origin_country=s[2],
                            time_position=s[3],
                            last_contact=s[4],
                            longitude=s[5],
                            latitude=s[6],
                            baro_altitude=s[7],
                            on_ground=s[8],
                            velocity=s[9],
                            true_track=s[10],
                            vertical_rate=s[11],
                            sensors=s[12],
                            geo_altitude=s[13],
                            squawk=s[14],
                            spi=s[15],
                            position_source=s[16],
                            category=s[17] if len(s) > 17 else 0
                        )
                        states.append(flight)
                
                self._cache[cache_key] = (current_time, states)
                return states
            except Exception as e:
                print(f"Error fetching OpenSky data: {e}")
                return []

    async def get_airport_flights(self, airport_code: str, mode: str) -> List[Dict[str, Any]]:
        """
        Fetch arrivals or departures for an airport.
        mode: 'arrival' or 'departure'
        """
        # OpenSky requires time window (begin, end). 
        # We'll ask for the last 2 hours to get recent activity.
        end_time = int(time.time())
        begin_time = end_time - 7200 # 2 hours ago
        
        endpoint = "arrival" if mode == "arrival" else "departure"
        
        async with httpx.AsyncClient() as client:
            try:
                params = {
                   "airport": airport_code,
                   "begin": begin_time,
                   "end": end_time
                }
                response = await client.get(f"{self.BASE_URL}/flights/{endpoint}", params=params)
                if response.status_code == 404:
                    return [] # No data found
                response.raise_for_status()
                return response.json()
                
            except Exception as e:
                print(f"Error fetching airport {mode}s: {e}")
                return []

# Singleton instance
opensky_service = OpenSkyService()
