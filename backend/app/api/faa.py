from fastapi import APIRouter, HTTPException
from app.services.faa import FAAService
from typing import List, Dict, Any

router = APIRouter(prefix="/faa", tags=["faa"])
service = FAAService()

@router.get("/alerts")
async def get_faa_alerts() -> List[Dict[str, Any]]:
    """Get active FAA airport alerts (Ground Stops, Delays)."""
    alerts = await service.get_alerts()
    return alerts
