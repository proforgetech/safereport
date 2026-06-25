@echo off
echo Starting SafeReport Frontend (Expo)...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo node_modules not found. Installing dependencies...
    npm install
)
echo.
echo Select how to run the frontend:
echo [1] Start Expo Developer Tools (Metro Bundler) - Recommended for Expo Go app
echo [2] Start directly in Web Browser
echo [3] Start for Android Emulator
echo [4] Start for iOS Simulator
echo.
set /p choice="Enter choice (1-4) [Default is 1]: "
if "%choice%"=="2" (
    npm run web
) else if "%choice%"=="3" (
    npm run android
) else if "%choice%"=="4" (
    npm run ios
) else (
    npm start
)
pause
