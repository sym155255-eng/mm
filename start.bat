@echo off
chcp 65001 >nul
title 导航站

set ROOT=%~dp0

where node >nul 2>&1
if errorlevel 1 (
    echo 未找到 Node.js，请先安装后重试
    pause
    exit /b
)

echo [1/3] 检查服务端依赖...
cd /d %ROOT%server
if not exist node_modules call npm install --registry https://registry.npmmirror.com

echo [2/3] 检查客户端依赖并构建...
cd /d %ROOT%client
if not exist node_modules call npm install --registry https://registry.npmmirror.com
call npm run build

echo [3/3] 启动服务...
cd /d %ROOT%server
start "" "http://localhost:3001"
node src/index.js
pause
