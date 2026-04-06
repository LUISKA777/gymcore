from fastapi import APIRouter, Depends
from database import get_db
from auth_utils import require_gym
from supabase import Client
from datetime import date, timedelta

router = APIRouter()

@router.get("/")
def get_dashboard(db: Client = Depends(get_db), user=Depends(require_gym)):
    gym_id = user["gym_id"]
    today = date.today()
    first_of_month = today.replace(day=1)
    last_month_start = (first_of_month - timedelta(days=1)).replace(day=1)
    last_month_end = first_of_month - timedelta(days=1)

    # Clients
    all_clients = db.table("clients").select("*").eq("gym_id", gym_id).execute().data
    active = [c for c in all_clients if c.get("active")]
    overdue = [c for c in active if c.get("membership_end") and c["membership_end"] < str(today)]
    expiring = [c for c in active if c.get("membership_end") and str(today) <= c["membership_end"] <= str(today + timedelta(days=7))]
    new_this_month = [c for c in all_clients if c.get("created_at", "") >= str(first_of_month)]

    # Payments this month
    payments_this_month = db.table("payments").select("amount").eq("gym_id", gym_id).gte("paid_at", str(first_of_month)).execute().data
    income_this_month = sum(p["amount"] for p in payments_this_month)

    # Payments last month
    payments_last_month = db.table("payments").select("amount").eq("gym_id", gym_id).gte("paid_at", str(last_month_start)).lte("paid_at", str(last_month_end)).execute().data
    income_last_month = sum(p["amount"] for p in payments_last_month)

    # Expenses this month
    expenses = db.table("expenses").select("amount, category").eq("gym_id", gym_id).gte("expense_date", str(first_of_month)).execute().data
    total_expenses = sum(e["amount"] for e in expenses)

    # Monthly income last 6 months for chart
    monthly = []
    for i in range(5, -1, -1):
        d = today.replace(day=1) - timedelta(days=i*30)
        m_start = d.replace(day=1)
        m_end = (m_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        p = db.table("payments").select("amount").eq("gym_id", gym_id).gte("paid_at", str(m_start)).lte("paid_at", str(m_end)).execute().data
        monthly.append({
            "month": m_start.strftime("%b"),
            "income": sum(x["amount"] for x in p)
        })

    # Overdue total
    overdue_total = sum(c.get("membership_plans", {}).get("price", 0) if c.get("membership_plans") else 0 for c in overdue)

    # Top clients (most months)
    top_clients = sorted(active, key=lambda c: c.get("months_as_client", 0), reverse=True)[:5]

    # Projected income (avg of last 3 months)
    last_3 = [m["income"] for m in monthly[-3:]]
    projected = int(sum(last_3) / len(last_3)) if last_3 else 0

    return {
        "active_clients":    len(active),
        "overdue_clients":   len(overdue),
        "overdue_list":      overdue[:10],
        "overdue_total":     overdue_total,
        "expiring_soon":     expiring,
        "new_clients":       len(new_this_month),
        "income_this_month": income_this_month,
        "income_last_month": income_last_month,
        "total_expenses":    total_expenses,
        "net_income":        income_this_month - total_expenses,
        "projected_income":  projected,
        "monthly_chart":     monthly,
        "top_clients":       top_clients,
        "diagnosis": {
            "high_overdue":     len(overdue) > len(active) * 0.15,
            "low_retention":    len(expiring) >= 3,
            "income_growing":   income_this_month > income_last_month,
        }
    }

@router.get("/plans")
def list_plans(db: Client = Depends(get_db), user=Depends(require_gym)):
    return db.table("membership_plans").select("*").eq("gym_id", user["gym_id"]).eq("active", True).execute().data

@router.post("/plans")
def create_plan(body: dict, db: Client = Depends(get_db), user=Depends(require_gym)):
    body["gym_id"] = user["gym_id"]
    res = db.table("membership_plans").insert(body).execute()
    return res.data[0]

@router.patch("/plans/{plan_id}")
def update_plan(plan_id: int, body: dict, db: Client = Depends(get_db), user=Depends(require_gym)):
    res = db.table("membership_plans").update(body).eq("id", plan_id).eq("gym_id", user["gym_id"]).execute()
    return res.data[0]
