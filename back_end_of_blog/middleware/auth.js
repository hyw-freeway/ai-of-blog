/**
 * JWT 认证中间件
 * 验证请求头中的 Authorization token
 */
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

/**
 * 验证 JWT token 的中间件
 * 需要在请求头中携带: Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.error('未提供认证令牌', 401);
  }
  
  // 提取 token（格式：Bearer xxx）
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.error('认证令牌格式错误', 401);
  }
  
  const token = parts[1];
  
  try {
    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // 将解码后的用户信息挂载到 req 对象
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.error('认证令牌已过期，请重新登录', 401);
    }
    return res.error('认证令牌无效', 401);
  }
}

/**
 * 生成 JWT token
 * @param {Object} payload - 需要编码的数据
 * @returns {string} JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

module.exports = { authMiddleware, generateToken };
