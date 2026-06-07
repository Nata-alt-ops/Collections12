from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os, shutil
from datetime import datetime
from app.database import get_db
from app import models, schemas, auth
from PIL import Image
import imagehash
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api")

# ============ АВТОРИЗАЦИЯ ============

@router.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    if existing:
        raise HTTPException(400, "Username or email already exists")
    hashed = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email, 
        username=user.username, 
        hashed_password=hashed,
        role=models.UserRole.USER,  # По умолчанию пользователь
        created_at=datetime.utcnow().isoformat()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = auth.authenticate_user(db, user.username, user.password)
    if not db_user:
        raise HTTPException(400, "Incorrect username or password")
    token = auth.create_access_token({"sub": db_user.username})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.put("/auth/profile", response_model=schemas.UserOut)
def update_profile(
    profile_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if "email" in profile_data:
        existing = db.query(models.User).filter(
            models.User.email == profile_data["email"],
            models.User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(400, "Email already exists")
        current_user.email = profile_data["email"]
    
    if "username" in profile_data:
        existing = db.query(models.User).filter(
            models.User.username == profile_data["username"],
            models.User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(400, "Username already exists")
        current_user.username = profile_data["username"]
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/auth/change-password")
def change_password(
    password_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not auth.verify_password(password_data["current_password"], current_user.hashed_password):
        raise HTTPException(400, "Current password is incorrect")
    
    if len(password_data["new_password"]) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    
    current_user.hashed_password = auth.get_password_hash(password_data["new_password"])
    db.commit()
    new_token = auth.create_access_token({"sub": current_user.username})
    return {"access_token": new_token, "token_type": "bearer"}

# ============ АДМИН-ПАНЕЛЬ ============

# Получение списка всех пользователей
@router.get("/admin/users", response_model=list[schemas.UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin)
):
    users = db.query(models.User).all()
    return users

# Получение конкретного пользователя
@router.get("/admin/users/{user_id}", response_model=schemas.UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user

# Обновление пользователя (роль, статус)
@router.put("/admin/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    user_data: schemas.UserAdminUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    
    if user.id == admin_user.id and user_data.role and user_data.role != models.UserRole.ADMIN:
        raise HTTPException(400, "You cannot demote yourself")
    
    if user_data.email is not None:
        existing = db.query(models.User).filter(
            models.User.email == user_data.email,
            models.User.id != user_id
        ).first()
        if existing:
            raise HTTPException(400, "Email already exists")
        user.email = user_data.email
    
    if user_data.username is not None:
        existing = db.query(models.User).filter(
            models.User.username == user_data.username,
            models.User.id != user_id
        ).first()
        if existing:
            raise HTTPException(400, "Username already exists")
        user.username = user_data.username
    
    if user_data.role is not None:
        user.role = user_data.role
    
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    db.commit()
    db.refresh(user)
    return user

# Удаление пользователя
@router.delete("/admin/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    
    if user.id == admin_user.id:
        raise HTTPException(400, "You cannot delete yourself")
    
    # Удаляем все коллекции пользователя (каскадно удалятся и предметы)
    collections = db.query(models.Collection).filter(models.Collection.owner_id == user_id).all()
    for col in collections:
        db.delete(col)
    
    db.delete(user)
    db.commit()
    return {"ok": True}

# Получение всех коллекций всех пользователей (для админа)
@router.get("/admin/collections", response_model=list[schemas.CollectionAdminOut])
def get_all_collections(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin)
):
    collections = db.query(models.Collection).all()
    result = []
    for col in collections:
        owner = db.query(models.User).filter(models.User.id == col.owner_id).first()
        result.append({
            "id": col.id,
            "name": col.name,
            "description": col.description,
            "owner_id": col.owner_id,
            "owner_name": owner.username if owner else "Unknown"
        })
    return result

# Удаление любой коллекции (админ)
@router.delete("/admin/collections/{col_id}")
def admin_delete_collection(
    col_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin)
):
    col = db.query(models.Collection).filter(models.Collection.id == col_id).first()
    if not col:
        raise HTTPException(404, "Collection not found")
    
    # Удаляем изображения предметов
    for item in col.items:
        if item.image_path and os.path.exists(item.image_path):
            os.remove(item.image_path)
    
    # Удаляем обложку коллекции
    if col.image_path and os.path.exists(col.image_path):
        os.remove(col.image_path)
    
    db.delete(col)
    db.commit()
    return {"ok": True}

# Получение всех предметов (для админа)
@router.get("/admin/items", response_model=list[schemas.ItemAdminOut])
def get_all_items(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin)
):
    items = db.query(models.Item).all()
    result = []
    for item in items:
        collection = db.query(models.Collection).filter(models.Collection.id == item.collection_id).first()
        owner = db.query(models.User).filter(models.User.id == collection.owner_id).first() if collection else None
        result.append({
            "id": item.id,
            "title": item.title,
            "image_path": item.image_path,
            "collection_id": item.collection_id,
            "collection_name": collection.name if collection else "Unknown",
            "owner_id": collection.owner_id if collection else 0,
            "owner_name": owner.username if owner else "Unknown"
        })
    return result

# Удаление любого предмета (админ)
@router.delete("/admin/items/{item_id}")
def admin_delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin)
):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    
    if item.image_path and os.path.exists(item.image_path):
        os.remove(item.image_path)
    
    db.delete(item)
    db.commit()
    return {"ok": True}

# Получение статистики для админ-панели
@router.get("/admin/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin)
):
    total_users = db.query(models.User).count()
    total_admins = db.query(models.User).filter(models.User.role == models.UserRole.ADMIN).count()
    total_collections = db.query(models.Collection).count()
    total_items = db.query(models.Item).count()
    
    # Коллекции по пользователям
    users_with_collections = []
    users = db.query(models.User).all()
    for user in users:
        col_count = db.query(models.Collection).filter(models.Collection.owner_id == user.id).count()
        item_count = 0
        for col in user.collections:
            item_count += len(col.items)
        users_with_collections.append({
            "user_id": user.id,
            "username": user.username,
            "collections_count": col_count,
            "items_count": item_count
        })
    
    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "total_collections": total_collections,
        "total_items": total_items,
        "users_stats": users_with_collections
    }

# ============ КОЛЛЕКЦИИ ============

@router.post("/collections", response_model=schemas.CollectionOut)
def create_collection(col: schemas.CollectionCreate, db: Session = Depends(get_db), user = Depends(auth.get_current_user)):
    db_col = models.Collection(
        name=col.name,
        description=col.description,
        custom_fields=[cf.dict() for cf in col.custom_fields],
        owner_id=user.id
    )
    db.add(db_col)
    db.commit()
    db.refresh(db_col)
    return db_col

@router.get("/collections", response_model=list[schemas.CollectionOut])
def get_collections(db: Session = Depends(get_db), user = Depends(auth.get_current_user)):
    return db.query(models.Collection).filter(models.Collection.owner_id == user.id).all()

@router.get("/collections/{col_id}", response_model=schemas.CollectionOut)
def get_collection(
    col_id: int,
    db: Session = Depends(get_db),
    user = Depends(auth.get_current_user)
):
    collection = db.query(models.Collection).filter(
        models.Collection.id == col_id,
        models.Collection.owner_id == user.id
    ).first()
    if not collection:
        raise HTTPException(404, "Collection not found")
    return collection

@router.put("/collections/{col_id}", response_model=schemas.CollectionOut)
def update_collection(
    col_id: int,
    col: schemas.CollectionCreate,
    db: Session = Depends(get_db),
    user = Depends(auth.get_current_user)
):
    db_col = db.query(models.Collection).filter(
        models.Collection.id == col_id,
        models.Collection.owner_id == user.id
    ).first()
    if not db_col:
        raise HTTPException(404, "Collection not found")
    
    db_col.name = col.name
    db_col.description = col.description
    db_col.custom_fields = [cf.dict() for cf in col.custom_fields]
    db.commit()
    db.refresh(db_col)
    return db_col

@router.delete("/collections/{col_id}")
def delete_collection(col_id: int, db: Session = Depends(get_db), user = Depends(auth.get_current_user)):
    col = db.query(models.Collection).filter(models.Collection.id == col_id, models.Collection.owner_id == user.id).first()
    if not col:
        raise HTTPException(404, "Collection not found")
    
    # Удаляем изображения предметов
    for item in col.items:
        if item.image_path and os.path.exists(item.image_path):
            os.remove(item.image_path)
    
    if col.image_path and os.path.exists(col.image_path):
        os.remove(col.image_path)
    
    db.delete(col)
    db.commit()
    return {"ok": True}

@router.post("/collections/{col_id}/upload")
async def upload_collection_image(
    col_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user = Depends(auth.get_current_user)
):
    db_col = db.query(models.Collection).filter(
        models.Collection.id == col_id,
        models.Collection.owner_id == user.id
    ).first()
    if not db_col:
        raise HTTPException(404, "Collection not found")
    
    os.makedirs("uploads", exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    filename = f"collection_{col_id}_{datetime.utcnow().timestamp()}{ext}"
    filepath = f"uploads/{filename}"
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    if db_col.image_path and os.path.exists(db_col.image_path):
        os.remove(db_col.image_path)
    
    db_col.image_path = filepath
    db.commit()
    return {"image_path": filepath}

# ============ ПРЕДМЕТЫ ============

@router.post("/collections/{col_id}/items", response_model=schemas.ItemOut)
def create_item(col_id: int, item: schemas.ItemCreate, db: Session = Depends(get_db), user = Depends(auth.get_current_user)):
    col = db.query(models.Collection).filter(models.Collection.id == col_id, models.Collection.owner_id == user.id).first()
    if not col:
        raise HTTPException(404, "Collection not found")
    db_item = models.Item(title=item.title, custom_values=item.custom_values, collection_id=col_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/collections/{col_id}/items", response_model=list[schemas.ItemOut])
def get_items(col_id: int, db: Session = Depends(get_db), user = Depends(auth.get_current_user)):
    col = db.query(models.Collection).filter(models.Collection.id == col_id, models.Collection.owner_id == user.id).first()
    if not col:
        raise HTTPException(404, "Collection not found")
    return db.query(models.Item).filter(models.Item.collection_id == col_id).all()

@router.put("/items/{item_id}", response_model=schemas.ItemOut)
def update_item(item_id: int, item_upd: schemas.ItemCreate, db: Session = Depends(get_db), user = Depends(auth.get_current_user)):
    item = db.query(models.Item).join(models.Collection).filter(models.Item.id == item_id, models.Collection.owner_id == user.id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    item.title = item_upd.title
    item.custom_values = item_upd.custom_values
    db.commit()
    db.refresh(item)
    return item

@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), user = Depends(auth.get_current_user)):
    item = db.query(models.Item).join(models.Collection).filter(models.Item.id == item_id, models.Collection.owner_id == user.id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    if item.image_path and os.path.exists(item.image_path):
        os.remove(item.image_path)
    db.delete(item)
    db.commit()
    return {"ok": True}

@router.post("/items/{item_id}/upload")
async def upload_image(item_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), user = Depends(auth.get_current_user)):
    item = db.query(models.Item).join(models.Collection).filter(models.Item.id == item_id, models.Collection.owner_id == user.id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    os.makedirs("uploads", exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    filename = f"item_{item_id}_{datetime.utcnow().timestamp()}{ext}"
    filepath = f"uploads/{filename}"
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    if item.image_path and os.path.exists(item.image_path):
        os.remove(item.image_path)
    item.image_path = filepath
    db.commit()
    return {"image_path": filepath}

# ============ ВИЗУАЛЬНЫЙ ПОИСК ============

@router.post("/items/visual-search/{collection_id}")
async def visual_search(
    collection_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user = Depends(auth.get_current_user)
):
    collection = db.query(models.Collection).filter(
        models.Collection.id == collection_id,
        models.Collection.owner_id == user.id
    ).first()
    if not collection:
        raise HTTPException(404, "Collection not found")
    
    os.makedirs("temp", exist_ok=True)
    temp_path = f"temp/visual_search_{datetime.utcnow().timestamp()}.jpg"
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        img = Image.open(temp_path).convert('RGB')
        img = img.resize((256, 256))
        query_hash = str(imagehash.average_hash(img))
    except Exception as e:
        os.remove(temp_path)
        raise HTTPException(400, "Invalid image file")
    
    os.remove(temp_path)
    
    items = db.query(models.Item).filter(models.Item.collection_id == collection_id).all()
    
    similar_items = []
    for item in items:
        if item.image_path and os.path.exists(item.image_path):
            try:
                item_img = Image.open(item.image_path).convert('RGB')
                item_img = item_img.resize((256, 256))
                item_hash = str(imagehash.average_hash(item_img))
                
                similarity = sum(1 for a, b in zip(query_hash, item_hash) if a == b) / len(query_hash)
                
                if similarity > 0.7:
                    similar_items.append({
                        "id": item.id,
                        "title": item.title,
                        "image_path": item.image_path,
                        "custom_values": item.custom_values,
                        "similarity": round(similarity * 100, 1)
                    })
            except:
                pass
    
    similar_items.sort(key=lambda x: x["similarity"], reverse=True)
    return {"similar_items": similar_items}

# ============ ИЗОБРАЖЕНИЯ ============

@router.get("/image/{filename}")
async def get_image(filename: str):
    file_path = f"uploads/{filename}"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(404, "Image not found")

# В конце файла routes.py добавьте:

@router.get("/images/{item_id}")
async def get_item_image(
    item_id: int,
    db: Session = Depends(get_db),
    user = Depends(auth.get_current_user)
):
    """Получение изображения предмета"""
    item = db.query(models.Item).join(models.Collection).filter(
        models.Item.id == item_id,
        models.Collection.owner_id == user.id
    ).first()
    
    if not item or not item.image_path:
        raise HTTPException(404, "Image not found")
    
    if not os.path.exists(item.image_path):
        raise HTTPException(404, "Image file not found")
    
    return FileResponse(item.image_path)

@router.get("/collections/images/{collection_id}")
async def get_collection_image(
    collection_id: int,
    db: Session = Depends(get_db),
    user = Depends(auth.get_current_user)
):
    """Получение изображения коллекции"""
    collection = db.query(models.Collection).filter(
        models.Collection.id == collection_id,
        models.Collection.owner_id == user.id
    ).first()
    
    if not collection or not collection.image_path:
        raise HTTPException(404, "Image not found")
    
    if not os.path.exists(collection.image_path):
        raise HTTPException(404, "Image file not found")
    
    return FileResponse(collection.image_path)