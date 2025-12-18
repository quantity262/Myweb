const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取数据库连接池（延迟获取）
function getPool() {
    return db.getPool();
}

// 获取所有留言（公开，但需要登录）
router.get('/messages', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const [messages] = await pool.query(
            `SELECT m.id, m.user_id, m.username, m.content, m.created_at, u.role
             FROM messages m
             LEFT JOIN users u ON m.user_id = u.id
             WHERE m.status = 'active'
             ORDER BY m.created_at DESC
             LIMIT 100`
        );
        res.json({ messages });
    } catch (error) {
        console.error('获取留言列表错误:', error);
        res.status(500).json({ error: '获取留言列表失败' });
    }
});

// 创建留言（需要登录）
router.post('/messages', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.id;
        const username = req.user.username;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: '留言内容不能为空' });
        }

        if (content.length > 1000) {
            return res.status(400).json({ error: '留言内容不能超过1000个字符' });
        }

        const pool = getPool();
        const [result] = await pool.query(
            'INSERT INTO messages (user_id, username, content) VALUES (?, ?, ?)',
            [userId, username, content.trim()]
        );

        res.json({
            message: '留言成功',
            messageId: result.insertId
        });
    } catch (error) {
        console.error('创建留言错误:', error);
        res.status(500).json({ error: '留言失败' });
    }
});

// 删除留言（需要管理员权限）
router.delete('/messages/:id', authenticateToken, async (req, res) => {
    try {
        // 检查是否为管理员
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: '需要管理员权限' });
        }

        const messageId = parseInt(req.params.id);
        const pool = getPool();
        
        // 软删除（将状态改为deleted）
        const [result] = await pool.query(
            "UPDATE messages SET status = 'deleted' WHERE id = ?",
            [messageId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '留言不存在' });
        }

        res.json({ message: '留言已删除' });
    } catch (error) {
        console.error('删除留言错误:', error);
        res.status(500).json({ error: '删除留言失败' });
    }
});

module.exports = router;


