#!/bin/bash

# ==========================================
# 鹏哥IP品牌网站 - 服务器备份脚本
# ==========================================

# 设置变量
APP_DIR="/var/www/peng-ip-website"
BACKUP_DIR="$APP_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_FILE="dev.db"

# 确保备份目录存在
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "  开始备份 - $TIMESTAMP"
echo "=========================================="

cd "$APP_DIR" || { echo "❌ 错误: 找不到目录 $APP_DIR"; exit 1; }

# 1. 备份数据库 (如果存在)
if [ -f "$DB_FILE" ]; then
    echo "正在备份数据库..."
    cp "$DB_FILE" "$BACKUP_DIR/db_$TIMESTAMP.sqlite"
    echo "✅ 数据库已备份: $BACKUP_DIR/db_$TIMESTAMP.sqlite"
else
    echo "⚠️ 警告: 未找到数据库文件 $DB_FILE"
fi

# 2. 备份核心代码和配置
# 排除 node_modules, .next, .git, backups 目录
echo "正在备份代码文件..."
tar --exclude='./node_modules' \
    --exclude='./.next' \
    --exclude='./.git' \
    --exclude='./backups' \
    -czf "$BACKUP_DIR/code_$TIMESTAMP.tar.gz" .

echo "✅ 代码已备份: $BACKUP_DIR/code_$TIMESTAMP.tar.gz"

# 3. 清理旧备份 (保留最近 7 天的备份)
echo "正在清理 7 天前的旧备份..."
find "$BACKUP_DIR" -type f -mtime +7 -name "*.gz" -delete
find "$BACKUP_DIR" -type f -mtime +7 -name "*.sqlite" -delete

echo "=========================================="
echo "  备份完成！"
echo "  备份存放于: $BACKUP_DIR"
echo "=========================================="
ls -lh "$BACKUP_DIR" | grep "$TIMESTAMP"
