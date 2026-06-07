from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Создаем папку для базы данных, если её нет
os.makedirs("data", exist_ok=True)

# SQLite вместо MSSQL
DATABASE_URL = "sqlite:///./data/collections.db"

# Для SQLite нужно отключить проверку внешних ключей в SQLAlchemy
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Нужно для SQLite
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()