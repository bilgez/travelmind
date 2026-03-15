from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
from models.user import User
from services.auth import hash_password, verify_password, create_access_token

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
    return {"access_token": token, "token_type": "bearer", "username": user.username}