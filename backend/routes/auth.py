from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from database import get_db
from models.user import User
from services.auth import hash_password, verify_password, create_access_token
from services.auth_deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

# Gelen veriyi tanımlayan şemalar
class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Şifre uzunluğu kontrol
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Sifre en az 6 karakter olmalidir")
    
    # Email daha önce kullanılmış mı?
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu email zaten kayitli")
    
    # Yeni kullanıcı oluştur
    new_user = User(
        email=request.email,
        username=request.username,
        hashed_password=hash_password(request.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Kayit basarili!", "username": new_user.username}

class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "username": current_user.username}

@router.put("/profile")
def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if request.username and request.username.strip() and request.username != current_user.username:
        taken = db.query(User).filter(User.username == request.username, User.id != current_user.id).first()
        if taken:
            raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış")
        current_user.username = request.username.strip()

    if request.new_password:
        if not request.current_password:
            raise HTTPException(status_code=400, detail="Mevcut şifre gerekli")
        if not verify_password(request.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Mevcut şifre yanlış")
        if len(request.new_password) < 6:
            raise HTTPException(status_code=400, detail="Yeni şifre en az 6 karakter olmalıdır")
        current_user.hashed_password = hash_password(request.new_password)

    db.commit()
    db.refresh(current_user)
    return {"message": "Profil güncellendi", "username": current_user.username}

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Kullanıcı var mı?
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Email veya sifre yanlis")
    
    # Şifre doğru mu?
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email veya sifre yanlis")
    
    # JWT token üret
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "username": user.username, "user_id": user.id}