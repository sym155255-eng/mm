#!/usr/bin/env bash
# Linux 服务器一键部署脚本（Node + PM2）
# 用法：chmod +x deploy.sh && ./deploy.sh
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "========== 导航站一键部署 =========="

# 1. 检查 Node
if ! command -v node >/dev/null 2>&1; then
  echo "❌ 未安装 Node.js，请先安装（建议 18+）："
  echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - && sudo apt install -y nodejs"
  exit 1
fi
echo "✅ Node $(node -v)"

# 2. 安装 PM2（进程守护，开机自启）
if ! command -v pm2 >/dev/null 2>&1; then
  echo "📦 安装 PM2..."
  npm install -g pm2
fi

# 3. 后端依赖
echo "📦 安装后端依赖..."
cd "$ROOT/server"
npm install --omit=dev

# 4. 前端依赖 + 构建
echo "📦 构建前端..."
cd "$ROOT/client"
npm install
npm run build

# 5. 用 PM2 启动/重启
echo "🚀 启动服务..."
cd "$ROOT/server"
pm2 delete nav-site 2>/dev/null || true
PORT=${PORT:-3001} pm2 start src/index.js --name nav-site
pm2 save

echo ""
echo "========== 部署完成 =========="
echo "  访问地址: http://你的服务器IP:${PORT:-3001}"
echo "  后台:     http://你的服务器IP:${PORT:-3001}/admin"
echo "  账号:     admin  密码: admin123（请尽快在后台修改）"
echo ""
echo "  常用命令："
echo "    pm2 logs nav-site     # 查看日志"
echo "    pm2 restart nav-site  # 重启"
echo "    pm2 startup           # 设置开机自启（按提示执行一行命令）"
