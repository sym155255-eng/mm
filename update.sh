#!/usr/bin/env bash
# 一键更新脚本（服务器免构建版）：本地已构建好 dist 并提交，服务器只拉取 + 重启
# 用法：cd ~/ddd && bash update.sh
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "========== 更新导航站 =========="
echo "📥 拉取最新代码（含已构建好的前端 dist）..."
# 丢弃服务器上可能被改动的文件，避免 git pull 冲突
git checkout -- . 2>/dev/null || true
git pull

echo "📦 安装后端依赖（如有更新）..."
cd "$ROOT/server"
npm install --omit=dev

echo "🔄 重启服务..."
pm2 restart nav-site

echo ""
echo "✅ 更新完成！前端已是本地构建好的版本，服务器无需 build。"
echo "   （前端改动 = 在本地 npm --prefix client run build 后提交推送）"
