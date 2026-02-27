/**
 * Express 应用入口
 * 配置中间件、路由和启动服务器
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/db');
const articlesRouter = require('./routes/articles');
const authRouter = require('./routes/auth');
const uploadRouter = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors()); // 允许跨域请求
app.use(express.json({ limit: '50mb' })); // 解析 JSON 请求体
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // 解析 URL 编码的请求体

// 静态文件服务 - 提供上传文件的访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 统一响应格式的工具函数
app.use((req, res, next) => {
  res.success = (data, msg = '成功') => {
    res.json({ code: 200, msg, data });
  };
  res.error = (msg = '服务器错误', code = 500) => {
    res.json({ code, msg, data: null });
  };
  next();
});

// 路由配置
app.use('/api/articles', articlesRouter);
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);

// 根路由 - 健康检查
app.get('/', (req, res) => {
  res.success({ status: 'running' }, '博客 API 服务运行中');
});

// 404 处理
app.use((req, res) => {
  res.error('接口不存在', 404);
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.error(err.message || '服务器内部错误', 500);
});

// 启动服务器
async function startServer() {
  // 测试数据库连接
  await testConnection();
  
  app.listen(PORT, () => {
    console.log(`✓ 服务器启动成功，监听端口 ${PORT}`);
    console.log(`  本地访问: http://localhost:${PORT}`);
  });
}

startServer();
