from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app import routes
from app.database import engine, Base, SessionLocal
from app.models import User, UserRole
from app.auth import get_password_hash
import os

# Создаем таблицы
Base.metadata.create_all(bind=engine)

# Создаем папки, если их нет
os.makedirs("uploads", exist_ok=True)
os.makedirs("temp", exist_ok=True)

# Создаем первого админа, если его нет
def create_first_admin():
    db = SessionLocal()
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if not admin:
        any_user = db.query(User).first()
        if not any_user:
            admin_user = User(
                email="admin@example.com",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Создан администратор по умолчанию: admin / admin123")
    db.close()

create_first_admin()

app = FastAPI(title="Digital Collections API")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ВАЖНО: Монтируем папку uploads для статической раздачи файлов
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(routes.router)

@app.get("/")
def root():
    return {"message": "Digital Collections API v2"}