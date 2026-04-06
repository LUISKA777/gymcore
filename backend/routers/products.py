from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth_utils import require_gym
from supabase import Client

router = APIRouter()

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    buy_price: int = 0
    sell_price: int
    stock: int = 0
    category: Optional[str] = 'General'

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    buy_price: Optional[int] = None
    sell_price: Optional[int] = None
    stock: Optional[int] = None
    category: Optional[str] = None
    active: Optional[bool] = None

@router.get("/")
def list_products(db: Client = Depends(get_db), user=Depends(require_gym)):
    return db.table("products").select("*").eq("gym_id", user["gym_id"]).eq("active", True).order("name").execute().data

@router.post("/")
def create_product(body: ProductCreate, db: Client = Depends(get_db), user=Depends(require_gym)):
    data = body.dict()
    data["gym_id"] = int(user["gym_id"])
    res = db.table("products").insert(data).execute()
    return res.data[0]

@router.patch("/{product_id}")
def update_product(product_id: int, body: ProductUpdate, db: Client = Depends(get_db), user=Depends(require_gym)):
    updates = {k: v for k, v in body.dict().items() if v is not None}
    res = db.table("products").update(updates).eq("id", product_id).eq("gym_id", user["gym_id"]).execute()
    return res.data[0]

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Client = Depends(get_db), user=Depends(require_gym)):
    db.table("products").update({"active": False}).eq("id", product_id).eq("gym_id", user["gym_id"]).execute()
    return {"message": "Producto eliminado"}
