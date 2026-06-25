@echo off
echo Starting both SafeReport Backend and Frontend...
start "SafeReport Backend" cmd /c "%~dp0run_backend.bat"
start "SafeReport Frontend" cmd /c "%~dp0run_frontend.bat"
echo.
echo Both servers have been launched in separate windows!
echo You can close this window now.
timeout /t 5
