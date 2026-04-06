from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from auth_utils import require_gym
from supabase import Client

router = APIRouter()

class SaleItem(BaseModel):
    product_id: int
    name: str
    qty: int
    price: int

class SaleCreate(BaseModel):
    items: List[SaleItem]
    total: int
    payment_method: str
    sinpe_ref: Optional[str] = None
    created_by: Optional[str] = None

@router.get("/")
def list_sales(db: Client = Depends(get_db), user=Depends(require_gym)):
    return db.table("sales").select("*").eq("gym_id", user["gym_id"]).order("created_at", desc=True).limit(100).execute().data

@router.post("/")
def create_sale(body: SaleCreate, db: Client = Depends(get_db), user=Depends(require_gym)):
    if body.payment_method not in ["efectivo", "sinpe"]:
        raise HTTPException(400, "Metodo de pago invalido")

    for item in body.items:
        product = db.table("products").select("stock, name").eq("id", item.product_id).single().execute().data
        if not product:
            raise HTTPException(404, f"Producto no encontrado")
        if product["stock"] < item.qty:
            raise HTTPException(400, f"Stock insuficiente para {product['name']}")

    for item in body.items:
        product = db.table("products").select("stock").eq("id", item.product_id).single().execute().data
        new_stock = product["stock"] - item.qty
        if new_stock <= 0:
            db.table("products").delete().eq("id", item.product_id).execute()
        else:
            db.table("products").update({"stock": new_stock}).eq("id", item.product_id).execute()

    res = db.table("sales").insert({
        "gym_id":         int(user["gym_id"]),
        "items":          [i.dict() for i in body.items],
        "total":          body.total,
        "payment_method": body.payment_method,
        "sinpe_ref":      body.sinpe_ref,
        "created_by":     body.created_by or user.get("name", ""),
    }).execute()
    return res.data[0]

@router.get("/summary")
def sales_summary(db: Client = Depends(get_db), user=Depends(require_gym)):
    from datetime import date
    today = str(date.today())
    first_of_month = str(date.today().replace(day=1))

    today_sales = db.table("sales").select("total, payment_method").eq("gym_id", user["gym_id"]).gte("created_at", today).execute().data
    month_sales = db.table("sales").select("total, payment_method").eq("gym_id", user["gym_id"]).gte("created_at", first_of_month).execute().data

    return {
        "today_total":    sum(s["total"] for s in today_sales),
        "today_count":    len(today_sales),
        "month_total":    sum(s["total"] for s in month_sales),
        "month_count":    len(month_sales),
        "today_efectivo": sum(s["total"] for s in today_sales if s["payment_method"] == "efectivo"),
        "today_sinpe":    sum(s["total"] for s in today_sales if s["payment_method"] == "sinpe"),
    }
