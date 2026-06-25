# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import List, Optional
import datetime

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True

class EvidenceBase(BaseModel):
    file_path: str
    media_type: str

class EvidenceCreate(EvidenceBase):
    pass

class Evidence(EvidenceBase):
    id: int
    incident_id: int

    class Config:
        from_attributes = True

class IncidentBase(BaseModel):
    type: str
    description: str
    latitude: float
    longitude: float

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    status: Optional[str] = None

class Incident(IncidentBase):
    id: int
    status: str
    timestamp: datetime.datetime
    user_id: int
    evidence: List[Evidence] = []

    class Config:
        from_attributes = True

class AlertBase(BaseModel):
    message: str
    area: str

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    id: int
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
