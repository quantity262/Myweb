#!/bin/bash

echo "=========================================="
echo "开始部署 MyWeb 网站..."
echo "=========================================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未安装 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 MySQL
if ! command -v mysql &> /dev/null; then
    echo "警告: 未检测到 MySQL，请确保 MySQL 已安装并运行"
fi

# 安装依赖
echo "正在安装依赖..."
npm install

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "警告: 未找到 .env 文件，请创建并配置 .env 文件"
    echo "示例内容："
    echo "DB_HOST=localhost"
    echo "DB_USER=root"
    echo "DB_PASSWORD=你的密码"
    echo "DB_NAME=MyWeb"
    echo "JWT_SECRET=你的随机密钥"
    echo "PORT=3000"
    exit 1
fi

# 初始化数据库
echo "正在初始化数据库..."
npm run init-db

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "正在安装 PM2..."
    npm install -g pm2
fi

# 停止旧服务（如果存在）
pm2 stop myweb 2>/dev/null
pm2 delete myweb 2>/dev/null

# 启动服务
echo "正在启动服务..."
pm2 start server.js --name myweb

# 设置开机自启
pm2 startup
pm2 save

echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo "服务状态: pm2 status"
echo "查看日志: pm2 logs myweb"
echo "重启服务: pm2 restart myweb"
echo "停止服务: pm2 stop myweb"
echo "=========================================="


