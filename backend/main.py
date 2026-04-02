from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from routers import auth, gyms, clients, measurements, payments, expenses, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("GymCore API iniciando...")
    yield
    print("GymCore API cerrando...")

app = FastAPI(
    title="GymCore API",
    description="Sistema de gestión para gyms",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/api/auth",         tags=["Auth"])
app.include_router(gyms.router,         prefix="/api/gyms",         tags=["Gyms"])
app.include_router(clients.router,      prefix="/api/clients",      tags=["Clients"])
app.include_router(measurements.router, prefix="/api/measurements", tags=["Measurements"])
app.include_router(payments.router,     prefix="/api/payments",     tags=["Payments"])
app.include_router(expenses.router,     prefix="/api/expenses",     tags=["Expenses"])
app.include_router(dashboard.router,    prefix="/api/dashboard",    tags=["Dashboard"])

@app.get("/")
def root():
    return {"status": "ok", "app": "GymCore API v1.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
