/**
 * 文章路由
 * 处理文章的增删改查接口
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// 从内容中提取图片 URL
function extractImages(content) {
  if (!content) return [];
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const images = [];
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }
  return images;
}

// 从内容中提取文件（非图片）
function extractFiles(content) {
  if (!content) return [];
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  const files = [];
  
  // 获取所有图片 URL 用于排除
  const imageUrls = new Set();
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    imageUrls.add(match[1]);
  }
  
  // 文件扩展名列表
  const fileExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|md|zip|rar|7z)$/i;
  
  // 提取文件链接
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[2];
    const name = match[1].replace(/^[📄📎]\s?/, '').trim();
    // 只保留文件链接（排除图片和普通链接）
    if (!imageUrls.has(url) && fileExtensions.test(url)) {
      const isPdf = url.toLowerCase().endsWith('.pdf');
      files.push({ name, url, isPdf });
    }
  }
  return files;
}

// 清理摘要中的 Markdown 语法
function cleanSummary(content) {
  if (!content) return '';
  return content
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/[#*`_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200);
}

/**
 * GET /api/articles
 * 获取所有文章列表（公开接口）
 * 支持搜索：?keyword=xxx 模糊搜索标题和内容
 * 返回文章列表，包含图片和文件信息
 */
router.get('/', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    let sql = `SELECT id, title, tags, createTime, author, content FROM articles`;
    let params = [];
    
    // 如果有搜索关键词，添加模糊搜索条件
    if (keyword && keyword.trim()) {
      const searchTerm = `%${keyword.trim()}%`;
      sql += ` WHERE title LIKE ? OR content LIKE ?`;
      params = [searchTerm, searchTerm];
    }
    
    sql += ` ORDER BY createTime DESC`;
    
    const [rows] = await pool.execute(sql, params);
    
    // 处理每篇文章，提取图片和文件
    const articles = rows.map(article => ({
      id: article.id,
      title: article.title,
      tags: article.tags,
      createTime: article.createTime,
      author: article.author,
      summary: cleanSummary(article.content),
      images: extractImages(article.content).slice(0, 4), // 最多返回4张图片
      files: extractFiles(article.content).slice(0, 5) // 最多返回5个文件
    }));
    
    res.success(articles, keyword ? '搜索成功' : '获取文章列表成功');
  } catch (error) {
    console.error('获取文章列表错误:', error);
    res.error('获取文章列表失败', 500);
  }
});

/**
 * GET /api/articles/:id
 * 获取单篇文章详情（公开接口）
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(
      'SELECT * FROM articles WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.error('文章不存在', 404);
    }
    
    res.success(rows[0], '获取文章详情成功');
  } catch (error) {
    console.error('获取文章详情错误:', error);
    res.error('获取文章详情失败', 500);
  }
});

/**
 * POST /api/articles
 * 创建新文章（需要管理员权限）
 * 请求体: { title, content, tags }
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const author = req.user.username;
    
    // 参数校验
    if (!title || !content) {
      return res.error('标题和内容不能为空', 400);
    }
    
    const [result] = await pool.execute(
      'INSERT INTO articles (title, content, tags, author) VALUES (?, ?, ?, ?)',
      [title, content, tags || '', author]
    );
    
    res.success({
      id: result.insertId,
      title,
      tags,
      author
    }, '文章发布成功');
  } catch (error) {
    console.error('创建文章错误:', error);
    res.error('文章发布失败', 500);
  }
});

/**
 * PUT /api/articles/:id
 * 更新文章（需要管理员权限）
 * 请求体: { title, content, tags }
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;
    const author = req.user.username;
    
    // 检查文章是否存在且属于当前用户
    const [existing] = await pool.execute(
      'SELECT * FROM articles WHERE id = ? AND author = ?',
      [id, author]
    );
    
    if (existing.length === 0) {
      return res.error('文章不存在或无权限编辑', 404);
    }
    
    // 参数校验
    if (!title || !content) {
      return res.error('标题和内容不能为空', 400);
    }
    
    await pool.execute(
      'UPDATE articles SET title = ?, content = ?, tags = ? WHERE id = ?',
      [title, content, tags || '', id]
    );
    
    res.success({ id, title, tags }, '文章更新成功');
  } catch (error) {
    console.error('更新文章错误:', error);
    res.error('文章更新失败', 500);
  }
});

/**
 * DELETE /api/articles/:id
 * 删除文章（需要管理员权限）
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const author = req.user.username;
    
    // 检查文章是否存在且属于当前用户
    const [existing] = await pool.execute(
      'SELECT * FROM articles WHERE id = ? AND author = ?',
      [id, author]
    );
    
    if (existing.length === 0) {
      return res.error('文章不存在或无权限删除', 404);
    }
    
    await pool.execute('DELETE FROM articles WHERE id = ?', [id]);
    
    res.success(null, '文章删除成功');
  } catch (error) {
    console.error('删除文章错误:', error);
    res.error('文章删除失败', 500);
  }
});

module.exports = router;
