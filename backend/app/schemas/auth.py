from pydantic import BaseModel, Field
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Unique login identifier")
    password: Optional[str] = Field("Clinic@123", min_length=6, description="Cleartext password (hashed with bcrypt)")
    full_name: str = Field(..., min_length=2, max_length=100, description="Full staff name")
    role: str = Field(..., description="RECEPTIONIST, DOCTOR, CASHIER, ADMIN")
    email: Optional[str] = None
    phone: Optional[str] = None
