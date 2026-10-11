@echo off
echo ========================================================
echo        Starting Land of Hell: Idle Online
echo ========================================================

start "Land of Hell Server" cmd /k "cd /d %~dp0server && npm.cmd run dev"
timeout /t 3 /nobreak > nul
start "Land of Hell Client" cmd /k "cd /d %~dp0client && npm.cmd run dev"

timeout /t 2 /nobreak > nul
start http://localhost:3000

echo Game servers started!
echo Browser opened at http://localhost:3000
