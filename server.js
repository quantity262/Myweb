const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const contentRoutes = require('./routes/content');
const messageRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 3000;

// 确保数据库目录存在
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'database'))) {
    fs.mkdirSync(path.join(__dirname, 'database'));
}

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（前端）
app.use(express.static(path.join(__dirname, 'public')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api', messageRoutes);

// 初始化数据库
db.init().then(() => {
    console.log('数据库初始化完成');
    
    // 启动服务器
    app.listen(PORT, () => {
        console.log(`服务器运行在 http://localhost:${PORT}`);
        console.log(`前端访问地址: http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('数据库初始化失败:', err);
    process.exit(1);
});

