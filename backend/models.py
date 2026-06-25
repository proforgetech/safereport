# pyrefly: ignore [missing-import]
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user") # user or admin
    
    incidents = relationship("Incident", back_populates="reporter")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, index=True)
    description = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String, default="pending")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

    reporter = relationship("User", back_populates="incidents")
    evidence = relationship("Evidence", back_populates="incident")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    file_path = Column(String)
    media_type = Column(String)
    incident_id = Column(Integer, ForeignKey("incidents.id"))

    incident = relationship("Incident", back_populates="evidence")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    message = Column(String)
    area = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
