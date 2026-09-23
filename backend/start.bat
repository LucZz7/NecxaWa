@echo off
REM NecxaWA backend — one click setup (Windows)
cd /d "%~dp0"

where docker >nul 2>nul
if errorlevel 1 (
  echo Docker nahi mila. Pehle Docker Desktop install karo: https://docs.docker.com/get-docker/
  pause
  exit /b 1
)

if not exist .env (
  for /f %%i in ('powershell -command "[System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N')"') do set KEY=%%i
  echo API_MASTER_KEY=%KEY%> .env
  echo CORS_ORIGINS=*>> .env
  echo Nayi API key bana di gayi.
)

docker compose up -d
echo.
echo ==============================================
echo  NecxaWA backend LIVE hai
echo ==============================================
echo  Backend URL : http://localhost:2785
for /f "tokens=2 delims==" %%k in ('findstr "^API_MASTER_KEY=" .env') do echo  API key     : %%k
echo.
echo Ab console kholo:
echo  https://luczz7.github.io/NecxaWa/console.html
echo Connection me upar wali URL + key daal ke Test dabao,
echo phir session banao aur QR scan karo.
echo ==============================================
pause
