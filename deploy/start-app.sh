#!/bin/bash
# ============================================
# 项目启动脚本 - 上传代码后执行
# ============================================
set -e

APP_DIR="/var/www/peng-ip-website"

if [ ! -d "$APP_DIR" ]; then
    echo "错误：项目目录 $APP_DIR 不存在"
    echo "请先上传项目代码"
    exit 1
fi

cd "$APP_DIR"

echo "=========================================="
echo "  启动项目"
echo "=========================================="

# 1. 安装依赖
echo ""
echo "[1/5] 安装依赖..."
npm install

# 2. 生成 Prisma 客户端
echo ""
echo "[2/5] 生成 Prisma 客户端..."
npx prisma generate

# 3. 初始化数据库
echo ""
echo "[3/5] 初始化数据库..."
if [ ! -f "$APP_DIR/dev.db" ]; then
    node deploy/init-db.js
    echo "数据库初始化完成"
else
    echo "数据库已存在，跳过初始化"
fi

# 4. 构建项目
echo ""
echo "[4/5] 构建项目（可能需要 1-2 分钟）..."
npm run build

# 5. PM2 启动
echo ""
echo "[5/5] 启动应用..."
pm2 stop peng-website 2>/dev/null || true
pm2 delete peng-website 2>/dev/null || true
pm2 start npm --name "peng-website" -- start
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "访问地址：http://$(curl -s ifconfig.me)"
echo ""
echo "常用命令："
echo "  pm2 logs peng-website    # 查看日志"
echo "  pm2 restart peng-website # 重启应用"
echo "  pm2 status               # 查看状态"
echo "=========================================="
