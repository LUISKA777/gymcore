from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth_utils import require_gym
from supabase import Client
from datetime import date

router = APIRouter()

class ExpenseCreate(BaseModel):
    category: str
    description: Optional[str] = None
    amount: int
    expense_date: Optional[str] = None

@router.get("/")
def list_expenses(db: Client = Depends(get_db), user=Depends(require_gym)):
    return db.table("expenses").select("*").eq("gym_id", user["gym_id"]).order("expense_date", desc=True).execute().data

@router.post("/")
def create_expense(body: ExpenseCreate, db: Client = Depends(get_db), user=Depends(require_gym)):
    data = body.dict(exclude_none=True)
    data["gym_id"] = user["gym_id"]
    if "expense_date" not in data:
        data["expense_date"] = str(date.today())
    res = db.table("expenses").insert(data).execute()
    return res.data[0]

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Client = Depends(get_db), user=Depends(require_gym)):
    db.table("expenses").delete().eq("id", expense_id).eq("gym_id", user["gym_id"]).execute()
    return {"message": "Gasto eliminado"}
