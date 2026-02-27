-- =====================================================
-- 个人博客数据库初始化脚本
-- 使用方法: mysql -u root -p < init.sql
-- =====================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS blog_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE blog_db;

-- =====================================================
-- 管理员表
-- =====================================================
CREATE TABLE IF NOT EXISTS admin (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '管理员ID',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 预设管理员账号 (用户名: admin, 密码: 123456)
INSERT INTO admin (username, password) VALUES ('admin', '123456')
ON DUPLICATE KEY UPDATE username = username;

-- =====================================================
-- 文章表
-- =====================================================
CREATE TABLE IF NOT EXISTS articles (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '文章ID',
  title VARCHAR(200) NOT NULL COMMENT '文章标题',
  content TEXT NOT NULL COMMENT '文章正文',
  tags VARCHAR(200) DEFAULT '' COMMENT '文章标签（逗号分隔）',
  createTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  author VARCHAR(50) COMMENT '作者（关联管理员用户名）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章表';

-- 插入示例文章
INSERT INTO articles (title, content, tags, author) VALUES 
('欢迎来到我的博客', 
'# 欢迎

这是我的第一篇博客文章。

## 关于这个博客

这个博客使用 React + Node.js + MySQL 技术栈构建，采用简约高级的设计风格。

### 主要功能

- 文章列表浏览
- 文章详情查看
- 管理员登录
- 文章发布与管理

希望你喜欢这个博客！', 
'技术,博客,React', 
'admin'),

('技术栈介绍', 
'# 本博客技术栈

## 前端
- **React 18** - 用户界面构建
- **Vite** - 快速开发构建工具
- **React Router** - 路由管理
- **Axios** - HTTP 请求

## 后端
- **Node.js** - 运行时环境
- **Express** - Web 框架
- **JWT** - 身份认证
- **MySQL** - 数据存储

## 设计理念
简约、高级、响应式，专注内容展示。', 
'技术,前端,后端', 
'admin');

-- 显示创建结果
SELECT '数据库初始化完成！' AS message;
SELECT * FROM admin;
SELECT id, title, author, createTime FROM articles;
