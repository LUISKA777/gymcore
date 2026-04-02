from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth_utils import require_gym
from supabase import Client
from datetime import date, timedelta

router = APIRouter()

class PaymentCreate(BaseModel):
    client_id: int
    plan_id: int
    amount: int

@router.get("/")
def list_payments(db: Client = Depends(get_db), user=Depends(require_gym)):
    return db.table("payments").select("*, clients(name, phone), membership_plans(name, duration_days)").eq("gym_id", user["gym_id"]).order("paid_at", desc=True).execute().data

@router.post("/")
def create_payment(body: PaymentCreate, db: Client = Depends(get_db), user=Depends(require_gym)):
    plan = db.table("membership_plans").select("*").eq("id", body.plan_id).single().execute().data
    if not plan:
        raise HTTPException(404, "Plan no encontrado")

    client = db.table("clients").select("*").eq("id", body.client_id).single().execute().data
    today = date.today()
    
    # Si tiene membresía vigente, sumar desde la fecha de vencimiento actual
    current_end = client.get("membership_end")
    if current_end and current_end >= str(today):
        base_date = date.fromisoformat(current_end)
    else:
        base_date = today
    
    new_end = base_date + timedelta(days=plan["duration_days"])

    db.table("clients").update({
        "membership_plan_id": body.plan_id,
        "membership_start":   str(today),
        "membership_end":     str(new_end),
    }).eq("id", body.client_id).execute()

    res = db.table("payments").insert({
        "client_id":   body.client_id,
        "gym_id":      int(user["gym_id"]),
        "plan_id":     body.plan_id,
        "amount":      body.amount,
        "approved_by": int(user["gym_id"]),
        "status":      "approved",
    }).execute()
    return res.data[0]