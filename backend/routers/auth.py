from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_db
from auth_utils import hash_password, verify_password, create_token, get_current_user, require_admin
from supabase import Client
import random
import string

router = APIRouter()

reset_codes = {}

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterGymRequest(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    whatsapp_number: str | None = None

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

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
        "sub":    str(gym["id"]),
        "email":  gym["email"],
        "role":   gym["role"],
        "name":   gym["name"],
        "gym_id": gym["id"],
    })
    return {"token": token, "role": gym["role"], "name": gym["name"], "email": gym["email"], "gym_id": gym["id"]}

@router.post("/register")
def register_gym(body: RegisterGymRequest, db: Client = Depends(get_db), user=Depends(require_admin)):
    existing = db.table("gyms").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Ya existe un gym con ese correo")
    res = db.table("gyms").insert({
        "name":            body.name,
        "email":           body.email,
        "phone":           body.phone,
        "password_hash":   hash_password(body.password),
        "whatsapp_number": body.whatsapp_number,
        "role":            "owner",
        "active":          True,
    }).execute()
    return {"message": "Gym registrado exitosamente", "id": res.data[0]["id"]}

@router.post("/forgot-password")
def forgot_password(body: LoginRequest, db: Client = Depends(get_db)):
    res = db.table("gyms").select("id, email, name, whatsapp_number").eq("email", body.email).execute()
    if not res.data:
        return {"message": "ok", "whatsapp_number": None}
    gym = res.data[0]
    if not gym.get("whatsapp_number"):
        raise HTTPException(400, "Tu cuenta no tiene WhatsApp registrado. Contactá al administrador.")
    code = ''.join(random.choices(string.digits, k=6))
    reset_codes[body.email] = code
    return {"whatsapp_number": gym["whatsapp_number"], "code": code, "name": gym["name"]}

@router.post("/reset-password")
def reset_password_endpoint(body: ResetPasswordRequest, db: Client = Depends(get_db)):
    stored = reset_codes.get(body.email)
    if not stored or stored != body.code:
        raise HTTPException(400, "Código inválido o expirado")
    db.table("gyms").update({"password_hash": hash_password(body.new_password)}).eq("email", body.email).execute()
    del reset_codes[body.email]
    return {"message": "Contraseña actualizada exitosamente"}

@router.post("/change-password")
def change_password(body: ChangePasswordRequest, db: Client = Depends(get_db), user=Depends(get_current_user)):
    gym = db.table("gyms").select("*").eq("id", user["gym_id"]).single().execute().data
    if not verify_password(body.current_password, gym["password_hash"]):
        raise HTTPException(400, "Contraseña actual incorrecta")
    db.table("gyms").update({"password_hash": hash_password(body.new_password)}).eq("id", user["gym_id"]).execute()
    return {"message": "Contraseña actualizada"}

@router.get("/me")
def me(user=Depends(get_current_user)):
    return user
