from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import hashlib
import os

SECRET_KEY = "researchflow-secret-key-change-in-production"
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

users_db: dict = {}

def hash_password(password: str) -> str:
    salt = os.urandom(32)
    key  = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return salt.hex() + ':' + key.hex()

def verify_password(plain: str, hashed: str) -> bool:
    try:
        salt_hex, key_hex = hashed.split(':')
        salt = bytes.fromhex(salt_hex)
        key  = hashlib.pbkdf2_hmac('sha256', plain.encode(), salt, 100000)
        return key.hex() == key_hex
    except Exception:
        return False

def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire    = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

def register_user(name: str, email: str, password: str, role: str) -> dict:
    if email in users_db:
        raise ValueError("Email already registered")
    user = {
        "id":            email,
        "name":          name,
        "email":         email,
        "role":          role,
        "password_hash": hash_password(password),
        "created_at":    datetime.utcnow().isoformat()
    }
    users_db[email] = user
    return {k: v for k, v in user.items() if k != "password_hash"}

def login_user(email: str, password: str) -> dict:
    user = users_db.get(email)
    if not user:
        raise ValueError("Invalid email or password")
    if not verify_password(password, user["password_hash"]):
        raise ValueError("Invalid email or password")
    token = create_token({"sub": email, "role": user["role"]})
    return {
        "token": token,
        "user":  {k: v for k, v in user.items() if k != "password_hash"}
    }
