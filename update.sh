#!/usr/bin/env bash
# 一键更新脚本：拉取最新代码 → 构建前端 → 重启服务
# 用法：./update.sh
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "========== 更新导航站 =========="
echo "📥 拉取最新代码..."
# 丢弃服务器上被 npm/构建 自动修改的文件，避免 git pull 冲突
git checkout -- . 2>/dev/null || true
git pull

echo "📦 构建前端..."
cd "$ROOT/client"
npm install
npm run build

echo "🔄 重启服务..."
cd "$ROOT/server"
npm install --omit=dev
pm2 restart nav-site

echo ""
echo "✅ 更新完成！手机/电脑刷新页面即可看到最新效果。"
