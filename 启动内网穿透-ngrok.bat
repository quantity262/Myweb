@echo off
chcp 65001 >nul
echo ==========================================
echo 内网穿透工具 - ngrok
echo ==========================================
echo.

REM 检查 ngrok 是否存在
if not exist "ngrok.exe" (
    echo [错误] 未找到 ngrok.exe
    echo.
    echo 请先下载 ngrok：
    echo 1. 访问 https://ngrok.com/download
    echo 2. 下载 Windows 版本
    echo 3. 将 ngrok.exe 放到此目录
    echo.
    pause
    exit /b
)

REM 检查网站是否运行
echo [1/3] 检查本地服务...
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo [警告] 未检测到本地服务运行在 3000 端口
    echo 请先启动网站：npm start
    echo.
    echo 是否继续？(Y/N)
    set /p continue=
    if /i not "%continue%"=="Y" exit /b
)

echo [2/3] 启动内网穿透...
echo.
echo ==========================================
echo 正在启动 ngrok...
echo 公网地址将在下方显示
echo 按 Ctrl+C 停止
echo ==========================================
echo.

REM 启动 ngrok
ngrok.exe http 3000

pause

