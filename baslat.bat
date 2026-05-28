@echo off
echo TravelMind baslatiliyor...

echo PostgreSQL servisi baslatiliyor...
net start postgresql-x64-18 2>nul
if %errorlevel% neq 0 (
    net start PostgreSQL18 2>nul
    if %errorlevel% neq 0 echo PostgreSQL zaten calisiyor veya servis adi farkli.
)

timeout /t 2 /nobreak > nul

echo Backend baslatiliyor...
start "" cmd /k "cd /d "%~dp0backend" && "%~dp0backend\venv\Scripts\activate.bat" && uvicorn main:app --reload"

timeout /t 2 /nobreak > nul

echo Frontend baslatiliyor...
start "" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 4 /nobreak > nul

start "" "http://localhost:5173"

echo Tamamdir!
