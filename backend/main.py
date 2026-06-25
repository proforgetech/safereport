# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
# pyrefly: ignore [missing-import]
from fastapi.responses import FileResponse
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
import os
import shutil

from database import engine, get_db
import models
import schemas
import auth

# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SafeReport API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@app.post("/auth/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = auth.get_user(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    
    # Automatically grant admin role if email contains "admin"
    role = "admin" if "admin" in user.email.lower() else "user"
    
    db_user = models.User(email=user.email, hashed_password=hashed_password, role=role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.post("/incidents", response_model=schemas.Incident)
def create_incident(incident: schemas.IncidentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Compatible with Pydantic V2 and V1
    incident_data = incident.model_dump() if hasattr(incident, 'model_dump') else incident.dict()
    db_incident = models.Incident(**incident_data, user_id=current_user.id)
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    return db_incident

@app.get("/incidents", response_model=List[schemas.Incident])
def read_incidents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    incidents = db.query(models.Incident).offset(skip).limit(limit).all()
    return incidents

@app.post("/incidents/{incident_id}/evidence", response_model=schemas.Evidence)
def upload_evidence(incident_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_evidence = models.Evidence(file_path=file_path, media_type=file.content_type, incident_id=incident_id)
    db.add(db_evidence)
    db.commit()
    db.refresh(db_evidence)
    return db_evidence

@app.get("/uploads/{filename}")
def get_upload(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@app.get("/alerts", response_model=List[schemas.Alert])
def read_alerts(db: Session = Depends(get_db)):
    alerts = db.query(models.Alert).order_by(models.Alert.timestamp.desc()).all()
    return alerts

@app.post("/alerts", response_model=schemas.Alert)
def create_alert(alert: schemas.AlertCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to create alerts")
    
    alert_data = alert.model_dump() if hasattr(alert, 'model_dump') else alert.dict()
    db_alert = models.Alert(**alert_data)
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

@app.get("/users/me/incidents", response_model=List[schemas.Incident])
def read_user_incidents(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    incidents = db.query(models.Incident).filter(models.Incident.user_id == current_user.id).order_by(models.Incident.timestamp.desc()).all()
    return incidents

@app.patch("/incidents/{incident_id}", response_model=schemas.Incident)
def update_incident(incident_id: int, incident_update: schemas.IncidentUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Check if user is admin or the owner of the incident
    if current_user.role != "admin" and db_incident.user_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized to update this incident")

    if incident_update.status is not None:
        db_incident.status = incident_update.status
        
    db.commit()
    db.refresh(db_incident)
    return db_incident
