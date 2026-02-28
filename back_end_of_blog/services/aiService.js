/**
 * AI 服务封装
 * 提供摘要生成、标签提取、语法纠错、向量嵌入等功能
 */
const axios = require('axios');
const { AI_CONFIG, EMBEDDING_CONFIG, PROMPTS } = require('../config/ai');

/**
 * 调用 AI 聊天接口
 */
async function callAI(messages, options = {}) {
  const { model = AI_CONFIG.model, maxTokens = 500, temperature = 0.7 } = options;
  
  if (!AI_CONFIG.apiKey) {
    throw new Error('AI API Key 未配置，请在环境变量中设置 AI_API_KEY');
  }

  try {
    const response = await axios.post(
      `${AI_CONFIG.baseUrl}/chat/completions`,
      {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: AI_CONFIG.timeout,
      }
    );
    return response.data;
  } catch (error) {
    console.error('AI API 调用失败:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'AI 服务调用失败');
  }
}

/**
 * 流式调用 AI 聊天接口
 */
async function callAIStream(messages, options = {}) {
  const { model = AI_CONFIG.model, maxTokens = 500, temperature = 0.7 } = options;
  
  if (!AI_CONFIG.apiKey) {
    throw new Error('AI API Key 未配置');
  }

  const response = await axios.post(
    `${AI_CONFIG.baseUrl}/chat/completions`,
    {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    },
    {
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: AI_CONFIG.timeout,
      responseType: 'stream',
    }
  );
  
  return response.data;
}

/**
 * 生成文章摘要
 */
async function generateSummary(content) {
  if (!content || content.trim().length < 50) {
    return null;
  }

  const truncatedContent = content.substring(0, 3000);
  const prompt = PROMPTS.summary.replace('{content}', truncatedContent);
  
  const response = await callAI([
    { role: 'user', content: prompt }
  ], { maxTokens: 200, temperature: 0.5 });

  return response.choices[0].message.content.trim();
}

/**
 * 生成文章标签
 */
async function generateTags(title, content) {
  if (!content || content.trim().length < 20) {
    return '';
  }

  const truncatedContent = content.substring(0, 2000);
  const prompt = PROMPTS.tags
    .replace('{title}', title || '无标题')
    .replace('{content}', truncatedContent);
  
  const response = await callAI([
    { role: 'user', content: prompt }
  ], { maxTokens: 100, temperature: 0.3 });

  const tags = response.choices[0].message.content.trim();
  return tags.replace(/，/g, ',').replace(/\s+/g, '');
}

/**
 * 语法纠错
 */
async function proofread(content) {
  if (!content || content.trim().length < 10) {
    return content;
  }

  const prompt = PROMPTS.proofread.replace('{content}', content);
  
  const response = await callAI([
    { role: 'user', content: prompt }
  ], { maxTokens: Math.min(content.length * 2, 4000), temperature: 0.3 });

  return response.choices[0].message.content.trim();
}

/**
 * 获取文本的向量嵌入
 */
async function getEmbedding(text) {
  if (!EMBEDDING_CONFIG.apiKey) {
    throw new Error('Embedding API Key 未配置');
  }

  const truncatedText = text.substring(0, 8000);

  try {
    const response = await axios.post(
      `${EMBEDDING_CONFIG.baseUrl}/embeddings`,
      {
        model: EMBEDDING_CONFIG.model,
        input: truncatedText,
      },
      {
        headers: {
          'Authorization': `Bearer ${EMBEDDING_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    return response.data.data[0].embedding;
  } catch (error) {
    console.error('Embedding API 调用失败:', error.response?.data || error.message);
    throw new Error('向量生成失败');
  }
}

/**
 * 计算两个向量的余弦相似度
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * 语义搜索
 */
async function semanticSearch(query, articles, threshold = 0.5) {
  const queryEmbedding = await getEmbedding(query);
  
  const results = articles
    .filter(article => article.embedding)
    .map(article => {
      let embedding = article.embedding;
      if (typeof embedding === 'string') {
        try {
          embedding = JSON.parse(embedding);
        } catch {
          return null;
        }
      }
      
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      return {
        ...article,
        similarity,
      };
    })
    .filter(item => item && item.similarity > threshold)
    .sort((a, b) => b.similarity - a.similarity);
  
  return results;
}

/**
 * 为文章生成向量嵌入
 */
async function generateArticleEmbedding(title, content) {
  const text = `${title}\n\n${content}`.substring(0, 8000);
  return await getEmbedding(text);
}

module.exports = {
  callAI,
  callAIStream,
  generateSummary,
  generateTags,
  proofread,
  getEmbedding,
  cosineSimilarity,
  semanticSearch,
  generateArticleEmbedding,
};
