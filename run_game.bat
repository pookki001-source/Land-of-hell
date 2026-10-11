@echo off
echo ========================================================
echo        Starting Path of Exile: Idle Online
echo ========================================================

start "POE Idle Server" cmd /k "cd /d %~dp0server && npm.cmd run dev"
timeout /t 3 /nobreak > nul
start "POE Idle Client" cmd /k "cd /d %~dp0client && npm.cmd run dev"

timeout /t 2 /nobreak > nul
start http://localhost:3000

echo Game servers started!
echo Browser opened at http://localhost:3000
