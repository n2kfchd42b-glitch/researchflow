from datetime import datetime, timedelta
from typing import Optional
import hashlib
import hmac
import base64
import json
import os

# ── Minimal pure-Python HS256 JWT (no external crypto dependency) ────────────

class JWTError(Exception):
    pass

class _JWT:
    @staticmethod
    def _b64url_encode(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

    @staticmethod
    def _b64url_decode(s: str) -> bytes:
        pad = 4 - len(s) % 4
        return base64.urlsafe_b64decode(s + '=' * (pad % 4))

    def encode(self, payload: dict, key: str, algorithm: str = 'HS256') -> str:
        header = self._b64url_encode(json.dumps({'alg': 'HS256', 'typ': 'JWT'}).encode())
        body   = self._b64url_encode(json.dumps(payload, default=str).encode())
        sig_input = f"{header}.{body}".encode()
        sig = hmac.new(key.encode(), sig_input, hashlib.sha256).digest()
        return f"{header}.{body}.{self._b64url_encode(sig)}"

    def decode(self, token: str, key: str, algorithms=None) -> dict:
        try:
            header_b64, body_b64, sig_b64 = token.split('.')
        except ValueError:
            raise JWTError("Invalid token format")
        sig_input = f"{header_b64}.{body_b64}".encode()
        expected_sig = hmac.new(key.encode(), sig_input, hashlib.sha256).digest()
        provided_sig = self._b64url_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, provided_sig):
            raise JWTError("Signature verification failed")
        payload = json.loads(self._b64url_decode(body_b64))
        exp = payload.get('exp')
        if exp and datetime.utcnow().timestamp() > exp:
            raise JWTError("Token expired")
        return payload

jwt = _JWT()

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
