from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth_utils import require_gym
from supabase import Client
from datetime import date

router = APIRouter()

class ClientCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    goal: Optional[str] = None
    membership_plan_id: Optional[int] = None
    membership_start: Optional[str] = None
    membership_end: Optional[str] = None
    months_as_client: Optional[int] = 0

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    goal: Optional[str] = None
    membership_plan_id: Optional[int] = None
    membership_start: Optional[str] = None
    membership_end: Optional[str] = None
    active: Optional[bool] = None
    months_as_client: Optional[int] = None

@router.get("/")
def list_clients(db: Client = Depends(get_db), user=Depends(require_gym)):
    return db.table("clients").select("*, membership_plans(name, price, duration_days)").eq("gym_id", user["gym_id"]).order("name").execute().data

@router.get("/expiring-soon")
def expiring_soon(db: Client = Depends(get_db), user=Depends(require_gym)):
    from datetime import timedelta
    tomorrow = str(date.today() + timedelta(days=1))
    week = str(date.today() + timedelta(days=7))
    return db.table("clients").select("*").eq("gym_id", user["gym_id"]).eq("active", True).gte("membership_end", str(date.today())).lte("membership_end", week).order("membership_end").execute().data

@router.get("/overdue")
def overdue_clients(db: Client = Depends(get_db), user=Depends(require_gym)):
    today = str(date.today())
    return db.table("clients").select("*, membership_plans(name, price)").eq("gym_id", user["gym_id"]).eq("active", True).lt("membership_end", today).execute().data

@router.get("/{client_id}")
def get_client(client_id: int, db: Client = Depends(get_db), user=Depends(require_gym)):
    res = db.table("clients").select("*, membership_plans(name, price, duration_days)").eq("id", client_id).eq("gym_id", user["gym_id"]).single().execute()
    if not res.data:
        raise HTTPException(404, "Cliente no encontrado")
    return res.data

@router.post("/")
def create_client(body: ClientCreate, db: Client = Depends(get_db), user=Depends(require_gym)):
    data = body.dict()
    data["gym_id"] = user["gym_id"]
    res = db.table("clients").insert(data).execute()
    return res.data[0]

@router.patch("/{client_id}")
def update_client(client_id: int, body: ClientUpdate, db: Client = Depends(get_db), user=Depends(require_gym)):
    updates = {k: v for k, v in body.dict().items() if v is not None}
    res = db.table("clients").update(updates).eq("id", client_id).eq("gym_id", user["gym_id"]).execute()
    return res.data[0]

@router.delete("/{client_id}")
def delete_client(client_id: int, db: Client = Depends(get_db), user=Depends(require_gym)):
    db.table("clients").update({"active": False}).eq("id", client_id).execute()
    return {"message": "Cliente desactivado"}
