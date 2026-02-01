import httpx
from typing import List, Dict, Any
import time

class FAAService:
    # Official FAA NAS Status API
    BASE_URL = "https://nasstatus.faa.gov/api/airport-status-information"
    
    _cache = None
    _cache_time = 0
    _cache_ttl = 60 # Cache for 1 minute
    
    async def get_alerts(self) -> List[Dict[str, Any]]:
        """Fetch active FAA programs (Ground Stops, Delays, etc)."""
        
        # Check cache
        if self._cache and (time.time() - self._cache_time < self._cache_ttl):
            return self._cache

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.BASE_URL)
                response.raise_for_status()
                data = response.json()
                
                alerts = []
                
                # The API returns a list of dictionaries with status info
                for item in data:
                    # We are interested in items that have some delay info
                    # Common fields: ARPT (airport), GROUND_STOP (GS), GND_DELAY (GD), ARRIVAL_DELAY (ALD), DEP_DELAY (DD)
                    # Note: Field names in this API can be tricky, typically capital keys.
                    
                    airport = item.get("ARPT")
                    if not airport:
                        continue
                        
                    status_list = []
                    
                    # Check Ground Stop
                    if item.get("QT_GS") or "Ground Stop" in str(item):
                        # The API structure varies, sometimes checking simple text or specific keys is safer
                        # Let's inspect the "Status" or specific delay fields if available
                        pass

                    # Simplified parsing based on common FAA JSON structure:
                    # Look for explicit programs
                    # Example item: {"ARPT": "EWR", "Reason": "Volume", "AvgDelay": "45 mins", ...}
                    
                    # Consolidate critical info
                    reason = item.get("Reason", "")
                    avg_delay = item.get("AvgDelay", "")
                    
                    update = {
                        "airport": airport,
                        "status": "",
                        "reason": reason,
                        "delay": avg_delay,
                        "url": f"https://www.fly.faa.gov/flyfaa/flyfaaindex.jsp?ARPT={airport}"
                    }
                    
                    is_alert = False
                    
                    # Explicit checking for types (Schema varies, relying on presence of delay info)
                    if "Ground Stop" in str(item):
                         update["status"] = "Ground Stop"
                         is_alert = True
                    elif "Ground Delay" in str(item) or item.get("GND_DELAY"):
                         update["status"] = "Ground Delay"
                         is_alert = True
                    elif "Closure" in str(item):
                         update["status"] = "Airport Closure"
                         is_alert = True
                    elif "Arrival Delay" in str(item) or item.get("ARRIVAL_DELAY"):
                         update["status"] = "Arrival Delay"
                         is_alert = True
                    elif "Departure Delay" in str(item) or item.get("DEP_DELAY"):
                         update["status"] = "Departure Delay"
                         is_alert = True

                    if is_alert:
                        alerts.append(update)
                
                self._cache = alerts
                self._cache_time = time.time()
                return alerts
                
            except Exception as e:
                print(f"Error fetching FAA data: {e}")
                return []
