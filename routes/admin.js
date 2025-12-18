const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const db = require('../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 获取数据库连接池（延迟获取）
function getPool() {
    return db.getPool();
}

// 所有管理员路由都需要认证
router.use(authenticateToken);
router.use(requireAdmin);

// 获取所有用户（包含密码哈希，仅管理员可见）
router.get('/users', async (req, res) => {
    try {
        const pool = getPool();
        const [users] = await pool.query(
            'SELECT id, username, email, password, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({ users });
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({ error: '获取用户列表失败' });
    }
});

// 重置用户密码（管理员）
router.post('/users/:id/reset-password', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: '新密码至少需要6个字符' });
        }

        const pool = getPool();
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const [result] = await pool.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '用户不存在' });
        }

        res.json({ message: '密码已重置' });
    } catch (error) {
        console.error('重置密码错误:', error);
        res.status(500).json({ error: '重置密码失败' });
    }
});

// 删除用户
router.delete('/users/:id', async (req, res) => {
    try {
        const pool = getPool();
        const userId = parseInt(req.params.id);

        // 不能删除自己
        if (userId === req.user.id) {
            return res.status(400).json({ error: '不能删除自己的账户' });
        }

        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '用户不存在' });
        }
        res.json({ message: '用户已删除' });
    } catch (error) {
        console.error('删除用户错误:', error);
        res.status(500).json({ error: '删除用户失败' });
    }
});

// 更新用户角色
router.patch('/users/:id/role', async (req, res) => {
    try {
        const pool = getPool();
        const userId = parseInt(req.params.id);
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: '无效的角色' });
        }

        // 不能修改自己的角色
        if (userId === req.user.id) {
            return res.status(400).json({ error: '不能修改自己的角色' });
        }

        const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '用户不存在' });
        }
        res.json({ message: '角色已更新' });
    } catch (error) {
        console.error('更新角色错误:', error);
        res.status(500).json({ error: '更新角色失败' });
    }
});

// 获取所有文档
router.get('/documents', async (req, res) => {
    try {
        const pool = getPool();
        const [documents] = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
        res.json({ documents });
    } catch (error) {
        console.error('获取文档列表错误:', error);
        res.status(500).json({ error: '获取文档列表失败' });
    }
});

// 创建/更新文档
router.post('/documents', async (req, res) => {
    try {
        const pool = getPool();
        const { title, filename, content } = req.body;

        if (!title || !filename) {
            return res.status(400).json({ error: '请填写标题和文件名' });
        }

        // 检查文档是否已存在
        const [existing] = await pool.query('SELECT * FROM documents WHERE filename = ?', [filename]);

        if (existing.length > 0) {
            // 更新现有文档
            await pool.query(
                'UPDATE documents SET title = ?, content = ? WHERE filename = ?',
                [title, content || '', filename]
            );
            res.json({ message: '文档已更新', id: existing[0].id });
        } else {
            // 创建新文档
            const [result] = await pool.query(
                'INSERT INTO documents (title, filename, content) VALUES (?, ?, ?)',
                [title, filename, content || '']
            );
            res.json({ message: '文档已创建', id: result.insertId });
        }
    } catch (error) {
        console.error('创建/更新文档错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除文档
router.delete('/documents/:id', async (req, res) => {
    try {
        const pool = getPool();
        const docId = parseInt(req.params.id);
        const [result] = await pool.query('DELETE FROM documents WHERE id = ?', [docId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '文档不存在' });
        }
        res.json({ message: '文档已删除' });
    } catch (error) {
        console.error('删除文档错误:', error);
        res.status(500).json({ error: '删除文档失败' });
    }
});

// 获取所有留言（管理员）
router.get('/messages', async (req, res) => {
    try {
        const pool = getPool();
        const [messages] = await pool.query(
            `SELECT m.id, m.user_id, m.username, m.content, m.status, m.created_at, u.email
             FROM messages m
             LEFT JOIN users u ON m.user_id = u.id
             ORDER BY m.created_at DESC`
        );
        res.json({ messages });
    } catch (error) {
        console.error('获取留言列表错误:', error);
        res.status(500).json({ error: '获取留言列表失败' });
    }
});

// 同步文件系统中的markdown文件到数据库
router.post('/documents/sync', async (req, res) => {
    try {
        const mylogPath = path.join(__dirname, '..', 'public', 'Mylog');
        const files = await fs.readdir(mylogPath);
        const mdFiles = files.filter(f => f.endsWith('.md'));

        const results = [];

        const pool = getPool();
        for (const file of mdFiles) {
            try {
                const filePath = path.join(mylogPath, file);
                const content = await fs.readFile(filePath, 'utf-8');
                const title = file.replace('.md', '');

                // 检查文档是否已存在
                const [existing] = await pool.query('SELECT * FROM documents WHERE filename = ?', [file]);

                if (existing.length > 0) {
                    // 更新现有文档
                    await pool.query(
                        'UPDATE documents SET title = ?, content = ? WHERE filename = ?',
                        [title, content, file]
                    );
                    results.push({ file, status: 'success', action: 'updated' });
                } else {
                    // 创建新文档
                    await pool.query(
                        'INSERT INTO documents (title, filename, content) VALUES (?, ?, ?)',
                        [title, file, content]
                    );
                    results.push({ file, status: 'success', action: 'created' });
                }
            } catch (error) {
                results.push({ file, status: 'error', error: error.message });
            }
        }

        res.json({ message: '同步完成', results });
    } catch (error) {
        console.error('同步文档错误:', error);
        res.status(500).json({ error: '同步失败', message: error.message });
    }
});

module.exports = router;

