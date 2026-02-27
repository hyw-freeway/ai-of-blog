/**
 * 认证路由
 * 处理管理员登录相关接口
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { generateToken } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * 管理员登录
 * 请求体: { username, password }
 * 返回: { token, username }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 参数校验
    if (!username || !password) {
      return res.error('用户名和密码不能为空', 400);
    }
    
    // 查询管理员账号
    const [rows] = await pool.execute(
      'SELECT id, username FROM admin WHERE username = ? AND password = ?',
      [username, password]
    );
    
    if (rows.length === 0) {
      return res.error('用户名或密码错误', 401);
    }
    
    const admin = rows[0];
    
    // 生成 JWT token
    const token = generateToken({
      id: admin.id,
      username: admin.username
    });
    
    res.success({
      token,
      username: admin.username
    }, '登录成功');
    
  } catch (error) {
    console.error('登录错误:', error);
    res.error('登录失败，请稍后重试', 500);
  }
});

/**
 * GET /api/auth/verify
 * 验证 token 是否有效（可选接口，用于前端检查登录状态）
 */
router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.error('未提供认证令牌', 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.success({ username: decoded.username }, 'token 有效');
  } catch (error) {
    res.error('token 无效或已过期', 401);
  }
});

module.exports = router;
