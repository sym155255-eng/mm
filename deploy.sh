#!/bin/bash
# =============================================
# 导航站一键部署脚本
# 用法：bash deploy.sh
# =============================================
set -e

REPO="https://github.com/aa1558686/aa.git"
DEPLOY_DIR="/opt/nav"
PORT=3000

echo ""
echo "========================================"
echo "  导航站一键部署"
echo "========================================"
echo ""

# ── 1. 安装系统依赖 ──────────────────────────
echo "[1/6] 安装系统依赖..."
apt-get update -y -q
apt-get install -y -q build-essential python3 unzip curl git

# ── 2. 安装 Node.js 20 ──────────────────────
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt 18 ]]; then
  echo "[2/6] 安装 Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - -q
  apt-get install -y -q nodejs
else
  echo "[2/6] Node.js 已安装: $(node -v)"
fi

# ── 3. 安装 PM2 ─────────────────────────────
if ! command -v pm2 &>/dev/null; then
  echo "[3/6] 安装 PM2..."
  npm install -g pm2 -q
else
  echo "[3/6] PM2 已安装"
fi

# ── 4. 拉取代码 ─────────────────────────────
echo "[4/6] 拉取代码..."
if [ -d "$DEPLOY_DIR/.git" ]; then
  echo "  → 已有仓库，执行 git pull"
  git -C "$DEPLOY_DIR" pull
else
  echo "  → 克隆仓库到 $DEPLOY_DIR"
  git clone "$REPO" "$DEPLOY_DIR"
fi

cd "$DEPLOY_DIR"

# ── 5. 安装依赖 & 构建前端 ──────────────────
echo "[5/6] 安装依赖并构建..."

echo "  → 服务端依赖"
npm install --prefix server --production

echo "  → 前端依赖 & 构建"
npm install --prefix client
npm run build --prefix client

# ── 6. 环境变量 ─────────────────────────────
if [ ! -f "server/.env" ]; then
  echo "[6/6] 创建 server/.env..."
  cat > server/.env << EOF
PORT=${PORT}
JWT_SECRET=$(openssl rand -hex 32)
EOF
  echo "  → JWT_SECRET 已随机生成，请妥善保存"
else
  echo "[6/6] server/.env 已存在，跳过"
fi

# ── 7. 启动/重启服务 ─────────────────────────
echo ""
echo "启动服务..."
cd "$DEPLOY_DIR/server"
if pm2 list | grep -q "^│.*nav.*│"; then
  pm2 restart nav
else
  pm2 start src/index.js --name nav
fi
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

# ── 完成提示 ────────────────────────────────
echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
echo "  服务地址: http://localhost:${PORT}"
echo "  健康检查: curl http://localhost:${PORT}/api/health"
echo ""
echo "  Nginx 反向代理配置（粘贴到 server {} 块内）："
echo ""
echo "    location / {"
echo "      proxy_pass http://127.0.0.1:${PORT};"
echo "      proxy_set_header Host \$host;"
echo "      proxy_set_header X-Real-IP \$remote_addr;"
echo "    }"
echo ""
echo "  PM2 常用命令："
echo "    pm2 status       查看状态"
echo "    pm2 logs nav     查看日志"
echo "    pm2 restart nav  重启服务"
echo ""
