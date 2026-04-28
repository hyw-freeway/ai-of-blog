/**
 * 文章路由
 * 处理文章的增删改查接口
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const { semanticSearch, generateArticleEmbedding, generateTags } = require('../services/aiService');
const { AI_CONFIG } = require('../config/ai');

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
 * 获取文章列表（公开接口），支持分页
 * 查询参数：
 *   - keyword:  模糊搜索标题和内容
 *   - semantic: 'true' 启用语义搜索
 *   - page:     页码，从 1 开始（默认 1）
 *   - pageSize: 每页条数（默认 10，最大 100）
 * 返回：{ list, total, page, pageSize, totalPages }
 */
router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { keyword, semantic } = req.query;
    // 是否为已登录的管理员（管理员可看全部，访客仅能看 visible_to_guest = 1）
    const isAdmin = !!req.user;

    // 解析分页参数
    let page = parseInt(req.query.page, 10);
    let pageSize = parseInt(req.query.pageSize, 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 10;
    if (pageSize > 100) pageSize = 100;
    const offset = (page - 1) * pageSize;

    const buildPager = (total) => ({
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    });

    // 语义搜索模式（先全量计算相似度，再在内存中分页）
    if (semantic === 'true' && keyword && keyword.trim() && AI_CONFIG.apiKey) {
      try {
        const visibilitySql = isAdmin ? '' : ' WHERE visible_to_guest = 1';
        const [allRows] = await pool.execute(
          `SELECT id, title, tags, createTime, author, content, ai_summary, embedding, visible_to_guest FROM articles${visibilitySql}`
        );

        const searchResults = await semanticSearch(keyword.trim(), allRows);
        const total = searchResults.length;
        const pageItems = searchResults.slice(offset, offset + pageSize);

        const list = pageItems.map(article => ({
          id: article.id,
          title: article.title,
          tags: article.tags,
          createTime: article.createTime,
          author: article.author,
          summary: article.ai_summary || cleanSummary(article.content),
          images: extractImages(article.content).slice(0, 4),
          files: extractFiles(article.content).slice(0, 5),
          visibleToGuest: article.visible_to_guest === 1,
          similarity: Math.round(article.similarity * 100)
        }));

        return res.success({ list, ...buildPager(total) }, '语义搜索成功');
      } catch (err) {
        console.error('语义搜索失败，回退到关键词搜索:', err.message);
      }
    }

    // 常规关键词搜索 / 全量列表（数据库层分页）
    const whereClauses = [];
    const whereParams = [];

    if (!isAdmin) {
      whereClauses.push('visible_to_guest = 1');
    }

    if (keyword && keyword.trim()) {
      const searchTerm = `%${keyword.trim()}%`;
      whereClauses.push('(title LIKE ? OR content LIKE ?)');
      whereParams.push(searchTerm, searchTerm);
    }

    const whereSql = whereClauses.length ? ` WHERE ${whereClauses.join(' AND ')}` : '';

    // 先查询总数
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM articles${whereSql}`,
      whereParams
    );
    const total = countRows[0]?.total || 0;

    // mysql2 对 LIMIT/OFFSET 占位符兼容性差，这里直接拼接安全的整数值
    const listSql =
      `SELECT id, title, tags, createTime, author, content, ai_summary, visible_to_guest FROM articles${whereSql}` +
      ` ORDER BY createTime DESC LIMIT ${pageSize} OFFSET ${offset}`;

    const [rows] = await pool.execute(listSql, whereParams);

    const list = rows.map(article => ({
      id: article.id,
      title: article.title,
      tags: article.tags,
      createTime: article.createTime,
      author: article.author,
      summary: article.ai_summary || cleanSummary(article.content),
      images: extractImages(article.content).slice(0, 4),
      files: extractFiles(article.content).slice(0, 5),
      visibleToGuest: article.visible_to_guest === 1
    }));

    res.success(
      { list, ...buildPager(total) },
      keyword ? '搜索成功' : '获取文章列表成功'
    );
  } catch (error) {
    console.error('获取文章列表错误:', error);
    res.error('获取文章列表失败', 500);
  }
});

/**
 * GET /api/articles/:id
 * 获取单篇文章详情（公开接口）
 * AI 摘要由前端通过流式 API 单独请求
 */
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM articles WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.error('文章不存在', 404);
    }

    const article = rows[0];

    // 仅管理员可阅读的文章，访客不可见
    if (!req.user && article.visible_to_guest !== 1) {
      return res.error('该文章仅管理员可见', 403);
    }

    // 统一布尔字段返回（前端使用 visibleToGuest）
    article.visibleToGuest = article.visible_to_guest === 1;

    res.success(article, '获取文章详情成功');
  } catch (error) {
    console.error('获取文章详情错误:', error);
    res.error('获取文章详情失败', 500);
  }
});

/**
 * POST /api/articles
 * 创建新文章（需要管理员权限）
 * 请求体: { title, content, tags }
 * 如果未提供标签，自动调用 AI 生成
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    let { tags } = req.body;
    const author = req.user.username;

    // 访客可见性，默认 true（向后兼容旧客户端）
    const visibleToGuest = req.body.visibleToGuest === undefined
      ? 1
      : (req.body.visibleToGuest ? 1 : 0);

    // 参数校验
    if (!title || !content) {
      return res.error('标题和内容不能为空', 400);
    }

    // 如果没有标签且配置了 AI，自动生成标签
    if ((!tags || !tags.trim()) && AI_CONFIG.apiKey) {
      try {
        tags = await generateTags(title, content);
        console.log('AI 自动生成标签:', tags);
      } catch (err) {
        console.error('AI 生成标签失败:', err.message);
        tags = '';
      }
    }

    const [result] = await pool.execute(
      'INSERT INTO articles (title, content, tags, author, visible_to_guest) VALUES (?, ?, ?, ?, ?)',
      [title, content, tags || '', author, visibleToGuest]
    );

    const articleId = result.insertId;
    
    // 异步生成向量嵌入（用于语义搜索）
    if (AI_CONFIG.apiKey) {
      generateArticleEmbedding(title, content)
        .then(async (embedding) => {
          if (embedding) {
            await pool.execute(
              'UPDATE articles SET embedding = ? WHERE id = ?',
              [JSON.stringify(embedding), articleId]
            );
          }
        })
        .catch(err => console.error('异步生成向量失败:', err.message));
    }
    
    res.success({
      id: articleId,
      title,
      tags: tags || '',
      author,
      visibleToGuest: visibleToGuest === 1,
      autoTags: !req.body.tags && tags ? true : false
    }, tags && !req.body.tags ? '文章发布成功，AI 已自动生成标签' : '文章发布成功');
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

    // 访客可见性：未传则保留原值
    const visibleToGuest = req.body.visibleToGuest === undefined
      ? existing[0].visible_to_guest
      : (req.body.visibleToGuest ? 1 : 0);

    // 内容变化时清空 AI 摘要，让系统重新生成
    const contentChanged = existing[0].content !== content;

    await pool.execute(
      'UPDATE articles SET title = ?, content = ?, tags = ?, ai_summary = ?, visible_to_guest = ? WHERE id = ?',
      [title, content, tags || '', contentChanged ? null : existing[0].ai_summary, visibleToGuest, id]
    );
    
    // 异步更新向量嵌入
    if (AI_CONFIG.apiKey && contentChanged) {
      generateArticleEmbedding(title, content)
        .then(async (embedding) => {
          if (embedding) {
            await pool.execute(
              'UPDATE articles SET embedding = ? WHERE id = ?',
              [JSON.stringify(embedding), id]
            );
          }
        })
        .catch(err => console.error('异步更新向量失败:', err.message));
    }
    
    res.success({ id, title, tags, visibleToGuest: visibleToGuest === 1 }, '文章更新成功');
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
