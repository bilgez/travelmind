@echo off
echo TravelMind baslatiliyor...

echo Docker (PostgreSQL) baslatiliyor...
docker compose up -d

timeout /t 3 /nobreak > nul

echo Backend baslatiliyor...
start "" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak > nul

echo Frontend baslatiliyor...
start "" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak > nul

echo Tarayici aciliyor...
start "" "http://localhost:5173"