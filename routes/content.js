const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const db = require('../database/db');

const router = express.Router();

// 获取数据库连接池（延迟获取）
function getPool() {
    return db.getPool();
}

// 获取所有文档列表（公开）
router.get('/documents', async (req, res) => {
    try {
        const mylogPath = path.join(__dirname, '..', 'public', 'Mylog');
        const documents = [];
        
        // 先从文件系统读取文档
        try {
            const files = await fs.readdir(mylogPath);
            const mdFiles = files.filter(f => f.endsWith('.md'));
            
            for (const file of mdFiles) {
                const title = file.replace('.md', '');
                documents.push({
                    id: `file_${file}`, // 使用文件路径作为临时ID
                    title: title,
                    filename: file,
                    created_at: null,
                    updated_at: null,
                    source: 'file'
                });
            }
        } catch (fileError) {
            console.warn('读取文件系统文档失败:', fileError.message);
        }
        
        // 再从数据库读取文档（如果数据库有数据）
        try {
            const pool = getPool();
            const [dbDocuments] = await pool.query(
                'SELECT id, title, filename, created_at, updated_at FROM documents ORDER BY created_at DESC'
            );
            
            // 合并文档，避免重复（优先使用数据库中的）
            const fileMap = new Map();
            documents.forEach(doc => {
                fileMap.set(doc.filename, doc);
            });
            
            dbDocuments.forEach(doc => {
                if (!fileMap.has(doc.filename)) {
                    documents.push({
                        ...doc,
                        source: 'database'
                    });
                } else {
                    // 如果数据库中有，替换文件系统中的
                    const index = documents.findIndex(d => d.filename === doc.filename);
                    if (index !== -1) {
                        documents[index] = {
                            ...doc,
                            source: 'database'
                        };
                    }
                }
            });
        } catch (dbError) {
            console.warn('读取数据库文档失败:', dbError.message);
        }
        
        // 按文件名排序
        documents.sort((a, b) => a.filename.localeCompare(b.filename));
        
        res.json({ documents });
    } catch (error) {
        console.error('获取文档列表错误:', error);
        res.status(500).json({ error: '获取文档列表失败' });
    }
});

// 获取单个文档内容
router.get('/documents/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '..', 'public', 'Mylog', filename);

        // 先尝试从文件系统读取
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return res.json({ content, source: 'file' });
        } catch (fileError) {
            // 如果文件不存在，从数据库读取
            try {
                const pool = getPool();
                const [rows] = await pool.query('SELECT * FROM documents WHERE filename = ?', [filename]);
                
                if (rows.length === 0) {
                    return res.status(404).json({ error: '文档不存在' });
                }

                res.json({ content: rows[0].content, source: 'database' });
            } catch (dbError) {
                console.error('数据库查询错误:', dbError);
                res.status(500).json({ error: '服务器错误' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;

