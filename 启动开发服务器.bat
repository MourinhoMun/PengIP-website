@echo off
chcp 65001 >nul
echo ========================================
echo   鹏哥个人网站 - 开发服务器
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 检查 Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo 错误: 未安装 Node.js，请先安装
    pause
    exit /b 1
)
echo Node.js 已安装

echo.
echo [2/3] 启动开发服务器...
echo.
echo 服务器地址: http://localhost:3000
echo 管理后台:   http://localhost:3000/admin
echo.
echo 管理员账号: admin@pengip.com
echo 管理员密码: admin123
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

npm run dev
