/**
 * AI 功能路由
 * 提供摘要生成、标签提取、语法纠错等 AI 增强功能
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { pool } = require('../config/db');
const { AI_CONFIG, PROMPTS } = require('../config/ai');
const { 
  generateSummary, 
  generateTags, 
  proofread,
  generateArticleEmbedding,
  callAIStream
} = require('../services/aiService');

/**
 * POST /api/ai/summary
 * 生成文章摘要（公开接口）
 * 请求体: { content: string }
 */
router.post('/summary', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length < 50) {
      return res.error('文章内容太短，无法生成摘要', 400);
    }
    
    const summary = await generateSummary(content);
    res.success({ summary }, '摘要生成成功');
  } catch (error) {
    console.error('生成摘要错误:', error);
    res.error(error.message || '摘要生成失败', 500);
  }
});

/**
 * GET /api/ai/summary/stream/:articleId
 * 流式生成文章摘要（公开接口）
 * 使用 Server-Sent Events 实时推送生成内容
 */
router.get('/summary/stream/:articleId', async (req, res) => {
  const { articleId } = req.params;
  const { regenerate } = req.query;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const [rows] = await pool.execute(
      'SELECT id, content, ai_summary FROM articles WHERE id = ?',
      [articleId]
    );
    
    if (rows.length === 0) {
      res.write(`data: ${JSON.stringify({ error: '文章不存在' })}\n\n`);
      res.end();
      return;
    }
    
    const article = rows[0];
    
    if (article.ai_summary && regenerate !== 'true') {
      res.write(`data: ${JSON.stringify({ content: article.ai_summary, done: true, cached: true })}\n\n`);
      res.end();
      return;
    }
    
    if (!article.content || article.content.trim().length < 50) {
      res.write(`data: ${JSON.stringify({ error: '文章内容太短' })}\n\n`);
      res.end();
      return;
    }
    
    const truncatedContent = article.content.substring(0, 3000);
    const prompt = PROMPTS.summary.replace('{content}', truncatedContent);
    
    const stream = await callAIStream([
      { role: 'user', content: prompt }
    ], { maxTokens: 200, temperature: 0.5 });
    
    let fullSummary = '';
    
    stream.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullSummary += content;
              res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
            }
          } catch (e) {
          }
        }
      }
    });
    
    stream.on('end', async () => {
      if (fullSummary) {
        try {
          await pool.execute(
            'UPDATE articles SET ai_summary = ? WHERE id = ?',
            [fullSummary.trim(), articleId]
          );
        } catch (e) {
          console.error('保存摘要失败:', e);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true, summary: fullSummary.trim() })}\n\n`);
      res.end();
    });
    
    stream.on('error', (error) => {
      console.error('流式生成错误:', error);
      res.write(`data: ${JSON.stringify({ error: '生成失败' })}\n\n`);
      res.end();
    });
    
  } catch (error) {
    console.error('流式摘要错误:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || '服务错误' })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/ai/tags
 * 生成文章标签（需要登录）
 * 请求体: { title: string, content: string }
 */
router.post('/tags', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!content || content.trim().length < 20) {
      return res.error('文章内容太短，无法生成标签', 400);
    }
    
    const tags = await generateTags(title, content);
    res.success({ tags }, '标签生成成功');
  } catch (error) {
    console.error('生成标签错误:', error);
    res.error(error.message || '标签生成失败', 500);
  }
});

/**
 * POST /api/ai/proofread
 * 语法纠错（需要登录）
 * 请求体: { content: string }
 */
router.post('/proofread', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length < 10) {
      return res.error('内容太短，无需纠错', 400);
    }
    
    const corrected = await proofread(content);
    res.success({ corrected }, '纠错完成');
  } catch (error) {
    console.error('纠错错误:', error);
    res.error(error.message || '纠错失败', 500);
  }
});

/**
 * POST /api/ai/embedding
 * 生成文章向量（需要登录，用于语义搜索）
 * 请求体: { title: string, content: string }
 */
router.post('/embedding', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!content || content.trim().length < 20) {
      return res.error('内容太短，无法生成向量', 400);
    }
    
    const embedding = await generateArticleEmbedding(title, content);
    res.success({ embedding }, '向量生成成功');
  } catch (error) {
    console.error('生成向量错误:', error);
    res.error(error.message || '向量生成失败', 500);
  }
});

module.exports = router;
