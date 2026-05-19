@echo off
cd /d "%~dp0"
echo Starting Glacier Moon server...
echo.
echo Opening http://localhost:8000 in your browser...
echo Close this window to stop the server.
echo.
start http://localhost:8000
python -m http.server 8000 --bind 127.0.0.1
