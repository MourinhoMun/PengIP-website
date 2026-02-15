#!/bin/bash
# ============================================
# 服务器更新脚本 - 用于拉取新代码并应用变更
# ============================================
set -e

APP_DIR="/var/www/peng-ip-website"

# 检查目录是否存在
if [ ! -d "$APP_DIR" ]; then
    echo "错误：项目目录 $APP_DIR 不存在"
    echo "请先使用 initial setup 脚本部署项目"
    exit 1
fi

cd "$APP_DIR"

echo "=========================================="
echo "  开始更新项目..."
echo "=========================================="

# 1. 拉取最新代码
echo "[1/5] 拉取最新代码..."
git pull origin main || echo "Git拉取失败，请手动检查或确认为最新代码"

# 2. 安装新依赖 (如 jsonwebtoken)
echo "[2/5] 安装依赖..."
npm install

# 3. 生成 Prisma Client
echo "[3/5] 更新数据库客户端..."
npx prisma generate

# 4. 执行数据库迁移 (重要: 应用 Schema 变更)
echo "[4/5] 执行数据库迁移..."
# 注意: 这里使用 migrate deploy 仅应用于生产环境，不生成新迁移文件
npx prisma migrate deploy

# 5. 构建并重启
echo "[5/5] 构建并重启服务..."
npm run build
pm2 restart peng-website || pm2 start npm --name "peng-website" -- start

echo "=========================================="
echo "  更新完成！"
echo "=========================================="
