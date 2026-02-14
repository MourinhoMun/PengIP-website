#!/bin/bash
# ============================================
# 鹏哥IP品牌网站 - 服务器一键部署脚本
# 适用系统：Ubuntu 22.04
# ============================================
set -e

echo "=========================================="
echo "  开始部署 - 鹏哥IP品牌网站"
echo "=========================================="

# 1. 更新系统
echo ""
echo "[1/6] 更新系统包..."
apt update -y && apt upgrade -y

# 2. 安装 Node.js 20
echo ""
echo "[2/6] 安装 Node.js 20..."
if command -v node &> /dev/null; then
    echo "Node.js 已安装: $(node -v)"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo "Node.js 安装完成: $(node -v)"
fi

# 3. 安装全局工具
echo ""
echo "[3/6] 安装 PM2 和 Git..."
npm install -g pm2
apt install -y git nginx

# 4. 创建项目目录
echo ""
echo "[4/6] 创建项目目录..."
mkdir -p /var/www

# 5. 配置 Nginx
echo ""
echo "[5/6] 配置 Nginx..."
cat > /etc/nginx/sites-available/peng-website << 'NGINX_CONF'
server {
    listen 80;
    server_name _;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # 上传大小限制
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # 静态资源缓存
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_CONF

# 启用站点配置
ln -sf /etc/nginx/sites-available/peng-website /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
systemctl enable nginx

# 6. 配置防火墙
echo ""
echo "[6/6] 配置防火墙..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo ""
echo "=========================================="
echo "  服务器环境部署完成！"
echo "=========================================="
echo ""
echo "Node.js: $(node -v)"
echo "NPM:     $(npm -v)"
echo "PM2:     $(pm2 -v)"
echo "Nginx:   $(nginx -v 2>&1)"
echo ""
echo "下一步：上传项目代码到 /var/www/peng-ip-website"
echo "=========================================="
