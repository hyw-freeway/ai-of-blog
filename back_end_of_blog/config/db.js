/**
 * MySQL 数据库连接配置
 * 使用 mysql2 的 promise API 进行异步操作
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blog_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // TiDB Cloud 需要 SSL 连接
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: true
  } : undefined
});

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ MySQL 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ MySQL 数据库连接失败:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection };
