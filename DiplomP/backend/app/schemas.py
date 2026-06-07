from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class UserCreate(BaseModel):
    email: str
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    username: str
    role: UserRole

class UserAdminUpdate(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class CustomFieldDef(BaseModel):
    name: str
    type: str   

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    custom_fields: List[CustomFieldDef] = []

class CollectionOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    custom_fields: List[CustomFieldDef]
    owner_id: int
    image_path: Optional[str] = None

class CollectionAdminOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    owner_id: int
    owner_name: str

class ItemCreate(BaseModel):
    title: str
    custom_values: Dict[str, Any] = {}

class ItemOut(BaseModel):
    id: int
    title: str
    image_path: Optional[str]
    custom_values: Dict[str, Any]
    collection_id: int

class ItemAdminOut(BaseModel):
    id: int
    title: str
    image_path: Optional[str]
    collection_id: int
    collection_name: str
    owner_id: int
    owner_name: str