@echo off
set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
echo ========================================================
echo       Pushing Land of Hell to GitHub
echo       Repository: https://github.com/pookki001-source/Land-of-hell.git
echo ========================================================
echo.
git push -u origin main
echo.
echo ========================================================
pause
