/**
 * AI 服务配置
 * 支持多种 AI 提供商：DeepSeek、硅基流动、通义千问、OpenAI
 */
require('dotenv').config();

const AI_CONFIG = {
  provider: process.env.AI_PROVIDER || 'deepseek',
  apiKey: process.env.AI_API_KEY || '',
  baseUrl: process.env.AI_BASE_URL || 'https://api.deepseek.com/v1',
  model: process.env.AI_MODEL || 'deepseek-chat',
  timeout: parseInt(process.env.AI_TIMEOUT) || 30000,
};

const EMBEDDING_CONFIG = {
  apiKey: process.env.EMBEDDING_API_KEY || process.env.AI_API_KEY || '',
  baseUrl: process.env.EMBEDDING_BASE_URL || 'https://api.siliconflow.cn/v1',
  model: process.env.EMBEDDING_MODEL || 'BAAI/bge-m3',
};

const PROMPTS = {
  summary: `请为以下文章生成一个精简的中文摘要，要求：
1. 字数控制在80-100字
2. 突出文章核心观点和主题
3. 语言简洁流畅
4. 只返回摘要内容，不要加任何前缀或说明

文章内容：
{content}`,

  tags: `分析以下文章内容，提取3-5个最能代表文章主题的关键词标签。

要求：
1. 每个标签2-4个字
2. 标签之间用英文逗号分隔
3. 只返回标签，不要其他任何内容
4. 优先使用技术领域通用术语

文章标题：{title}
文章内容：{content}`,

  proofread: `请对以下中文文章进行校对，修正错别字和语法问题。

要求：
1. 只修正明显的错别字和语法错误
2. 保持原文的写作风格和Markdown格式
3. 不要改变文章的结构和内容含义
4. 直接返回修正后的完整文章，不要加任何说明

原文：
{content}`,
};

module.exports = {
  AI_CONFIG,
  EMBEDDING_CONFIG,
  PROMPTS,
};
