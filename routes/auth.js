const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// 获取数据库连接池（延迟获取）
function getPool() {
    return db.getPool();
}

// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: '请填写所有字段' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: '密码至少需要6个字符' });
        }

        try {
            const pool = getPool();
            // 检查用户名是否已存在
            const [usernameRows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
            if (usernameRows.length > 0) {
                return res.status(400).json({ error: '用户名已存在' });
            }

            // 检查邮箱是否已存在
            const [emailRows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            if (emailRows.length > 0) {
                return res.status(400).json({ error: '邮箱已被注册' });
            }

            // 创建新用户
            const hashedPassword = await bcrypt.hash(password, 10);
            const [result] = await pool.query(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, hashedPassword]
            );

            // 生成JWT token
            const token = jwt.sign(
                { id: result.insertId, username, role: 'user' },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                message: '注册成功',
                token,
                user: {
                    id: result.insertId,
                    username,
                    email,
                    role: 'user'
                }
            });
        } catch (error) {
            console.error('注册错误:', error);
            res.status(500).json({ error: '服务器错误' });
        }
    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: '请填写用户名和密码' });
        }

        try {
            const pool = getPool();
            const [rows] = await pool.query(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [username, username]
            );

            if (rows.length === 0) {
                return res.status(401).json({ error: '用户名或密码错误' });
            }

            const user = rows[0];
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: '用户名或密码错误' });
            }

            // 生成JWT token
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                message: '登录成功',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('登录错误:', error);
            res.status(500).json({ error: '服务器错误' });
        }
    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: '未提供访问令牌' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const pool = getPool();
        
        const [rows] = await pool.query(
            'SELECT id, username, email, role FROM users WHERE id = ?',
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: '用户不存在' });
        }

        res.json({ user: rows[0] });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(403).json({ error: '无效的访问令牌' });
        }
        console.error('获取用户信息错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 修改密码（需要认证）
router.post('/change-password', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: '未提供访问令牌' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: '请填写所有字段' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: '新密码至少需要6个字符' });
        }

        const pool = getPool();
        
        // 获取当前用户信息
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: '用户不存在' });
        }

        const user = rows[0];

        // 验证当前密码
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: '当前密码错误' });
        }

        // 更新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: '密码修改成功' });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(403).json({ error: '无效的访问令牌' });
        }
        console.error('修改密码错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;

