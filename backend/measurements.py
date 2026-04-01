from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth_utils import require_gym
from supabase import Client

router = APIRouter()

class MeasurementCreate(BaseModel):
    client_id: int
    date: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    bicep: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hip: Optional[float] = None
    thigh: Optional[float] = None
    body_fat: Optional[float] = None
    muscle_mass: Optional[float] = None
    notes: Optional[str] = None

@router.get("/client/{client_id}")
def get_measurements(client_id: int, db: Client = Depends(get_db), user=Depends(require_gym)):
    return db.table("measurements").select("*").eq("client_id", client_id).order("date", desc=True).execute().data

@router.post("/")
def create_measurement(body: MeasurementCreate, db: Client = Depends(get_db), user=Depends(require_gym)):
    data = body.dict(exclude_none=True)
    res = db.table("measurements").insert(data).execute()
    return res.data[0]

@router.get("/progress/{client_id}")
def get_progress(client_id: int, db: Client = Depends(get_db), user=Depends(require_gym)):
    measurements = db.table("measurements").select("*").eq("client_id", client_id).order("date").execute().data
    if len(measurements) < 2:
        return {"measurements": measurements, "progress": None}

    first = measurements[0]
    last  = measurements[-1]
    fields = ["weight","bicep","chest","waist","hip","thigh","body_fat","muscle_mass"]

    progress = {}
    for f in fields:
        if first.get(f) and last.get(f):
            diff = round(last[f] - first[f], 2)
            pct  = round((diff / first[f]) * 100, 1)
            # Waist, hip, body_fat: lower is better. Others: higher is better
            lower_is_better = f in ["waist", "hip", "body_fat", "weight"]
            improved = (diff < 0) if lower_is_better else (diff > 0)
            progress[f] = {
                "first": first[f],
                "last":  last[f],
                "diff":  diff,
                "pct":   pct,
                "improved": improved,
                "label": "Mejoró" if improved else ("Sin cambio" if diff == 0 else "Empeoró")
            }

    return {"measurements": measurements, "progress": progress}
