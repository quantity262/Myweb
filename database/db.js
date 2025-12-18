const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let pool = null;

// 创建数据库连接池
function createPool() {
    return mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'MyWeb',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
}

// 初始化数据库
async function init() {
    try {
        // 先连接到MySQL服务器（不指定数据库）
        const tempPool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            waitForConnections: true,
            connectionLimit: 10
        });

        // 创建数据库（如果不存在）
        const dbName = process.env.DB_NAME || 'MyWeb';
        await tempPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`数据库 ${dbName} 已准备就绪`);

        // 关闭临时连接
        await tempPool.end();

        // 创建正式连接池
        pool = createPool();

        // 创建表
        await createTables();

        // 创建默认管理员账户
        await createDefaultAdmin();

        return pool;
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    }
}

// 创建数据表
async function createTables() {
    const connection = await pool.getConnection();
    try {
        // 创建用户表
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

        // 创建文档表
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

        // 创建留言表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                username VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('数据表创建完成');
    } finally {
        connection.release();
    }
}

// 创建默认管理员账户
async function createDefaultAdmin() {
    const connection = await pool.getConnection();
    try {
        // 检查是否已存在管理员
        const [rows] = await connection.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
        
        if (rows.length === 0) {
            // 创建默认管理员：admin / admin123
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.query(
                "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
                ['admin', 'admin@example.com', hashedPassword, 'admin']
            );
            console.log('默认管理员账户已创建: admin / admin123');
        }
    } finally {
        connection.release();
    }
}

// 获取数据库连接池
function getPool() {
    if (!pool) {
        throw new Error('数据库未初始化，请先调用 init()');
    }
    return pool;
}

// 关闭数据库连接
async function close() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

module.exports = {
    init,
    getPool,
    close
};
