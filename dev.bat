@echo off
start "Backend" cmd /k "cd /d C:\Users\10557\Desktop\aaa\server && node src/index.js"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /k "cd /d C:\Users\10557\Desktop\aaa\client && npm run dev"
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"
