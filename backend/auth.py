from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_db
from auth_utils import hash_password, verify_password, create_token, get_current_user, require_admin
from supabase import Client

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterGymRequest(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    whatsapp_number: str | None = None

@router.post("/login")
def login(body: LoginRequest, db: Client = Depends(get_db)):
    res = db.table("gyms").select("*").eq("email", body.email).single().execute()
    if not res.data:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    gym = res.data
    if not gym.get("active"):
        raise HTTPException(status_code=403, detail="Cuenta desactivada")
    if not verify_password(body.password, gym["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    token = create_token({
        "sub":   str(gym["id"]),
        "email": gym["email"],
        "role":  gym["role"],
        "name":  gym["name"],
        "gym_id": gym["id"],
    })
    return {"token": token, "role": gym["role"], "name": gym["name"], "email": gym["email"], "gym_id": gym["id"]}

@router.post("/register")
def register_gym(body: RegisterGymRequest, db: Client = Depends(get_db), user=Depends(require_admin)):
    existing = db.table("gyms").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Ya existe un gym con ese correo")
    res = db.table("gyms").insert({
        "name":          body.name,
        "email":         body.email,
        "phone":         body.phone,
        "password_hash": hash_password(body.password),
        "whatsapp_number": body.whatsapp_number,
        "role":          "owner",
        "active":        True,
    }).execute()
    return {"message": "Gym registrado exitosamente", "id": res.data[0]["id"]}

@router.get("/me")
def me(user=Depends(get_current_user)):
    return user
