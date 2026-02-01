from typing import Optional, Dict

class AirportService:
    # Static list of major airports to start with (can be expanded or replaced with DB later)
    _airports = {
        "KJFK": {"name": "John F. Kennedy International Airport", "lat": 40.6413, "lon": -73.7781, "city": "New York", "country": "USA"},
        "KLAX": {"name": "Los Angeles International Airport", "lat": 33.9416, "lon": -118.4085, "city": "Los Angeles", "country": "USA"},
        "EGLL": {"name": "Heathrow Airport", "lat": 51.4700, "lon": -0.4543, "city": "London", "country": "UK"},
        "EGKK": {"name": "Gatwick Airport", "lat": 51.1537, "lon": -0.1821, "city": "London", "country": "UK"},
        "LFPG": {"name": "Charles de Gaulle Airport", "lat": 49.0097, "lon": 2.5479, "city": "Paris", "country": "France"},
        "EDDF": {"name": "Frankfurt Airport", "lat": 50.0379, "lon": 8.5622, "city": "Frankfurt", "country": "Germany"},
        "OMDB": {"name": "Dubai International Airport", "lat": 25.2532, "lon": 55.3657, "city": "Dubai", "country": "UAE"},
        "RJTT": {"name": "Haneda Airport", "lat": 35.5494, "lon": 139.7798, "city": "Tokyo", "country": "Japan"},
        "WSSS": {"name": "Changi Airport", "lat": 1.3644, "lon": 103.9915, "city": "Singapore", "country": "Singapore"},
        "YSSY": {"name": "Sydney Kingsford Smith Airport", "lat": -33.9399, "lon": 151.1753, "city": "Sydney", "country": "Australia"},
        "KSFO": {"name": "San Francisco International Airport", "lat": 37.6213, "lon": -122.3790, "city": "San Francisco", "country": "USA"},
        "KORD": {"name": "O'Hare International Airport", "lat": 41.9742, "lon": -87.9073, "city": "Chicago", "country": "USA"},
        "KATL": {"name": "Hartsfield-Jackson Atlanta International Airport", "lat": 33.6407, "lon": -84.4277, "city": "Atlanta", "country": "USA"},
        "VIDP": {"name": "Indira Gandhi International Airport", "lat": 28.5562, "lon": 77.1000, "city": "New Delhi", "country": "India"},
        "VABB": {"name": "Chhatrapati Shivaji Maharaj International Airport", "lat": 19.0896, "lon": 72.8656, "city": "Mumbai", "country": "India"},
        "ZSPD": {"name": "Shanghai Pudong International Airport", "lat": 31.1443, "lon": 121.8083, "city": "Shanghai", "country": "China"},
        "ZBAA": {"name": "Beijing Capital International Airport", "lat": 40.0799, "lon": 116.6031, "city": "Beijing", "country": "China"},
        "VHHH": {"name": "Hong Kong International Airport", "lat": 22.3080, "lon": 113.9185, "city": "Hong Kong", "country": "China"},
    }

    def get_airport(self, code: str) -> Optional[Dict]:
        """Look up airport by ICAO code (case-insensitive)."""
        return self._airports.get(code.upper())
