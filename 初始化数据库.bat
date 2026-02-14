@echo off
chcp 65001 >nul
echo ========================================
echo   鹏哥个人网站 - 初始化数据库
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 同步数据库结构...
call npx prisma db push
if errorlevel 1 (
    echo 错误: 数据库同步失败
    pause
    exit /b 1
)

echo.
echo [2/2] 启动服务器并初始化数据...
echo.
echo 请在浏览器中访问以下地址初始化管理员账户:
echo http://localhost:3000/api/admin/seed
echo.
echo 初始化完成后:
echo - 管理员邮箱: admin@pengip.com
echo - 管理员密码: admin123
echo.

start http://localhost:3000/api/admin/seed
npm run dev
