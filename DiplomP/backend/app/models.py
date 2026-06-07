from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)  # Новая роль
    is_active = Column(Boolean, default=True)  # Блокировка пользователя
    created_at = Column(String(50), nullable=True)  # Дата регистрации (можно добавить datetime)

class Collection(Base):
    __tablename__ = "collections"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text, nullable=True)
    custom_fields = Column(JSON, default=list)  
    image_path = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="collections")
   
User.collections = relationship("Collection", back_populates="owner")

class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    image_path = Column(String, nullable=True)
    custom_values = Column(JSON, default=dict)
    collection_id = Column(Integer, ForeignKey("collections.id"))
    collection = relationship("Collection", back_populates="items")

Collection.items = relationship("Item", back_populates="collection", cascade="all, delete-orphan")