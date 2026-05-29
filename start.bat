@echo off
chcp 65001 > nul
echo [导航站] 启动中...

echo [1/3] 启动 MySQL + Redis (Docker)...
docker-compose up -d
timeout /t 5 /nobreak > nul

echo [2/3] 启动后端服务 (端口 3000)...
start "Nav Server" cmd /k "cd server && npm start"
timeout /t 3 /nobreak > nul

echo [3/3] 启动前端开发服务 (端口 5173)...
start "Nav Client" cmd /k "cd client && npm run dev"

echo.
echo ✅ 启动完成！
echo    前台: http://localhost:5173
echo    后台: http://localhost:5173/admin
echo    API:  http://localhost:3000/api/health
echo.
echo 默认管理员账号: admin / admin123
pause
