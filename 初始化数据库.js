const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
    let connection = null;
    
    try {
        console.log('正在连接MySQL服务器...');
        
        // 连接到MySQL服务器（不指定数据库）
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        });

        console.log('MySQL连接成功！');

        // 创建数据库
        const dbName = process.env.DB_NAME || 'MyWeb';
        console.log(`正在创建数据库: ${dbName}...`);
        
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`数据库 ${dbName} 创建成功！`);

        // 切换到新数据库
        await connection.query(`USE \`${dbName}\``);
        console.log(`已切换到数据库: ${dbName}`);

        // 创建用户表
        console.log('正在创建用户表...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('用户表创建成功！');

        // 创建文档表
        console.log('正在创建文档表...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                filename VARCHAR(255) NOT NULL,
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_filename (filename)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('文档表创建成功！');

        // 检查并创建默认管理员
        console.log('正在检查默认管理员账户...');
        const [adminRows] = await connection.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
        
        if (adminRows.length === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.query(
                "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
                ['admin', 'admin@example.com', hashedPassword, 'admin']
            );
            console.log('默认管理员账户已创建: admin / admin123');
        } else {
            console.log('管理员账户已存在，跳过创建');
        }

        console.log('\n========================================');
        console.log('数据库初始化完成！');
        console.log('========================================');
        console.log(`数据库名称: ${dbName}`);
        console.log('数据表: users, documents');
        console.log('默认管理员: admin / admin123');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n数据库初始化失败:');
        console.error('错误信息:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n提示: 用户名或密码错误，请检查 .env 文件中的配置');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n提示: 无法连接到MySQL服务器，请确保MySQL服务已启动');
        } else {
            console.error('\n完整错误:', error);
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('数据库连接已关闭');
        }
    }
}

// 运行初始化
initDatabase();


