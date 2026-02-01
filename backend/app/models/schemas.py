from pydantic import BaseModel
from typing import List, Optional

class FlightState(BaseModel):
    icao24: str
    callsign: Optional[str] = None
    origin_country: str
    time_position: Optional[int] = None
    last_contact: int
    longitude: Optional[float] = None
    latitude: Optional[float] = None
    baro_altitude: Optional[float] = None
    on_ground: bool
    velocity: Optional[float] = None
    true_track: Optional[float] = None
    vertical_rate: Optional[float] = None
    sensors: Optional[List[int]] = None
    geo_altitude: Optional[float] = None
    squawk: Optional[str] = None
    spi: bool
    position_source: int
    category: int = 0

class AircraftResponse(BaseModel):
    time: int
    states: List[FlightState]
