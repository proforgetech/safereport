@echo off
echo Starting SafeReport Backend (FastAPI)...
cd /d "%~dp0backend"
if not exist "venv" (
    echo Virtual environment venv not found. Creating one...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)
echo Running uvicorn server on http://0.0.0.0:8000...
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
