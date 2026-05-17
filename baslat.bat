@echo off
echo TravelMind baslatiliyor...

echo Backend baslatiliyor...
start "" cmd /k "cd /d %~dp0backend && C:\Users\bilge\travelmind\backend\venv\Scripts\activate.bat && uvicorn main:app --reload"

timeout /t 2 /nobreak > nul

echo Frontend baslatiliyor...
start "" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak > nul

start "" "http://localhost:5173"

echo Tamamdir!