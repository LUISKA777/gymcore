from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth_utils import require_admin, require_gym, get_current_user
from supabase import Client

router = APIRouter()

class GymUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    active: Optional[bool] = None

@router.get("/")
def list_gyms(db: Client = Depends(get_db), user=Depends(require_admin)):
    return db.table("gyms").select("id, name, email, phone, whatsapp_number, active, role, created_at").order("name").execute().data

@router.get("/me")
def my_gym(db: Client = Depends(get_db), user=Depends(require_gym)):
    res = db.table("gyms").select("*").eq("id", user["gym_id"]).single().execute()
    return res.data

@router.patch("/{gym_id}")
def update_gym(gym_id: int, body: GymUpdate, db: Client = Depends(get_db), user=Depends(get_current_user)):
    if user["role"] != "admin" and str(user["gym_id"]) != str(gym_id):
        raise HTTPException(403, "No tenés permiso")
    updates = {k: v for k, v in body.dict().items() if v is not None}
    res = db.table("gyms").update(updates).eq("id", gym_id).execute()
    return res.data[0]

@router.delete("/{gym_id}")
def delete_gym(gym_id: int, db: Client = Depends(get_db), user=Depends(require_admin)):
    db.table("gyms").delete().eq("id", gym_id).execute()
    return {"message": "Gym eliminado"}
