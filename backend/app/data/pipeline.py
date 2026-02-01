import json
import time
import threading
import os
from pathlib import Path
from typing import List, Optional
from app.models.schemas import FlightState
from app.services.opensky import opensky_service

# Simple file-based persistence
DATA_FILE = Path("backend/app/data/flights_cache.json")

class FlightStore:
    def __init__(self):
        self._flights: List[FlightState] = []
        self._history: dict = {} # icao24 -> [(lat, lon, time)]
        self._last_updated: float = 0
        self._lock = threading.Lock()
        self.load_from_disk()

    def load_from_disk(self):
        if DATA_FILE.exists():
            try:
                with open(DATA_FILE, "r") as f:
                    data = json.load(f)
                    # Convert dicts back to models if necessary, or just store dicts
                    # For performance, we might just store dicts and cast on read if strict
                    self._flights = [FlightState(**item) for item in data]
                    self._last_updated = os.path.getmtime(DATA_FILE)
            except Exception as e:
                print(f"Failed to load cache: {e}")

    def save_to_disk(self):
        try:
            DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(DATA_FILE, "w") as f:
                json.dump([f.dict() for f in self._flights], f)
        except Exception as e:
            print(f"Failed to save cache: {e}")

    def update(self, flights: List[FlightState]):
        current_time = time.time()
        with self._lock:
            self._flights = flights
            self._last_updated = current_time
            
            # Update history
            for f in flights:
                if f.icao24 and f.latitude and f.longitude:
                    if f.icao24 not in self._history:
                        self._history[f.icao24] = []
                    
                    # Avoid duplicates if pos hasn't changed (simple check)
                    history = self._history[f.icao24]
                    if not history or (history[-1][0] != f.latitude or history[-1][1] != f.longitude):
                        history.append((f.latitude, f.longitude, current_time))
            
            # Cleanup old history (older than 60 mins)
            # & cleanup history for flights not seen recently? 
            # For now, just simplistic window pruning
            cutoff = current_time - 3600
            for icao in list(self._history.keys()):
                self._history[icao] = [pt for pt in self._history[icao] if pt[2] > cutoff]
                if not self._history[icao]:
                    del self._history[icao]
                    
        # Save async or sync? Sync for now for safety.
        self.save_to_disk()

    def get_all(self) -> List[FlightState]:
        with self._lock:
            return self._flights
            
    def get_history(self, icao24: str) -> List[dict]:
        with self._lock:
            points = self._history.get(icao24, [])
            return [{"lat": p[0], "lon": p[1], "time": p[2]} for p in points]

    @property
    def last_updated(self) -> float:
        return self._last_updated

store = FlightStore()

class DataPipeline:
    def __init__(self):
        self.running = False
        self.thread = None

    def start(self):
        if self.running: return
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()
        print("Data Pipeline started [OpenSky -> Local Store]")

    def stop(self):
        self.running = False

    def _loop(self):
        while self.running:
            try:
                print("Pipeline: Fetching live data...")
                
                # Run async service method in this thread
                import asyncio
                flights = asyncio.run(opensky_service.get_all_flights())
                
                if flights:
                    store.update(flights)
                    print(f"Pipeline: Updated {len(flights)} flights.")
                else:
                    # If store is empty and we failed to get data (e.g. rate limit),
                    # inject some mock data for demo purposes so the app isn't empty.
                    if not store.get_all():
                        print("Pipeline: Injecting MOCK DATA (OpenSky Rate Limited & Cache Empty)")
                        current_t = int(time.time())
                        mock_flights = [
                            FlightState(icao24="a00001", callsign="UAL123", origin_country="United Kingdom", longitude=-71.0096, latitude=42.3656, baro_altitude=1000, velocity=140, true_track=90, vertical_rate=5.5, squawk="1200", category=1, last_contact=current_t, on_ground=False, spi=False, position_source=0, geo_altitude=1000),
                            FlightState(icao24="b00002", callsign="BAW456", origin_country="United Kingdom", longitude=-70.9, latitude=42.3, baro_altitude=5000, velocity=200, true_track=180, vertical_rate=-2.5, squawk="7700", category=1, last_contact=current_t, on_ground=False, spi=False, position_source=0, geo_altitude=5000),
                            FlightState(icao24="c00003", callsign="DLH789", origin_country="Germany", longitude=-71.1, latitude=42.4, baro_altitude=8000, velocity=220, true_track=270, vertical_rate=0, squawk="1200", category=1, last_contact=current_t, on_ground=False, spi=False, position_source=0, geo_altitude=8000),
                            FlightState(icao24="d00004", callsign="AFR111", origin_country="France", longitude=-71.05, latitude=42.35, baro_altitude=2500, velocity=160, true_track=45, vertical_rate=8.2, squawk="1200", category=1, last_contact=current_t, on_ground=False, spi=False, position_source=0, geo_altitude=2500)
                        ]
                        store.update(mock_flights)
                    else:
                        print("Pipeline: No flights fetched. Keeping old cache.")
                    
            except Exception as e:
                print(f"Pipeline Error: {e}")
            
            # Rate limit compliance: 10 seconds
            time.sleep(10)

pipeline = DataPipeline()
