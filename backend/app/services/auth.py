"""
auth.py — JWT + DB-persisted user accounts (Feature #45)

Token lifecycle
───────────────
• POST /auth/register → creates user in SQLite → sets httpOnly cookie
• POST /auth/login    → verifies password     → sets httpOnly cookie
• GET  /auth/me       → reads cookie          → returns user profile
• PUT  /auth/profile  → reads cookie          → updates name/institution/country
• POST /auth/logout   → deletes cookie
"""

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

# ── Crypto helpers ────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    salt = os.urandom(32)
    key  = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return salt.hex() + ":" + key.hex()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        salt_hex, key_hex = hashed.split(":")
        salt = bytes.fromhex(salt_hex)
        key  = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt, 100_000)
        return key.hex() == key_hex
    except Exception:
        return False


def create_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ── DB helpers ────────────────────────────────────────────────────────────────

def _user_dict(user) -> dict:
    """Serialise a User ORM row, never exposing password_hash."""
    return {
        "id":          user.id,
        "name":        user.name,
        "email":       user.email,
        "role":        user.role,
        "institution": user.institution or user.organisation or "",
        "country":     user.country or "",
        "created_at":  user.created_at.isoformat() if user.created_at else "",
    }


# ── Auth operations ───────────────────────────────────────────────────────────

def register_user(
    db,
    name:        str,
    email:       str,
    password:    str,
    role:        str,
    institution: str = "",
    country:     str = "",
) -> dict:
    from app.models.database import User

    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise ValueError("Email already registered")

    user = User(
        id            = str(uuid.uuid4()),
        name          = name,
        email         = email,
        role          = role,
        organisation  = institution,   # keep legacy column in sync
        institution   = institution,
        country       = country,
        password_hash = hash_password(password),
        created_at    = datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_dict(user)


def login_user(db, email: str, password: str) -> dict:
    from app.models.database import User

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.password_hash:
        raise ValueError("Invalid email or password")
    if not verify_password(password, user.password_hash):
        raise ValueError("Invalid email or password")

    token = create_token({"sub": email, "role": user.role})
    return {"token": token, "user": _user_dict(user)}


def get_user_by_email(db, email: str) -> Optional[dict]:
    from app.models.database import User

    user = db.query(User).filter(User.email == email).first()
    return _user_dict(user) if user else None


def update_user_profile(db, email: str, data: dict) -> dict:
    from app.models.database import User

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise ValueError("User not found")

    allowed = {"name", "institution", "country"}
    for key, value in data.items():
        if key not in allowed:
            continue
        setattr(user, key, value)
        if key == "institution":
            user.organisation = value   # keep legacy column in sync

    db.commit()
    db.refresh(user)
    return _user_dict(user)
