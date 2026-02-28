-- =====================================================
-- AI 功能数据库迁移脚本
-- 用于已有数据库添加 AI 相关字段
-- 使用方法: mysql -u root -p blog_db < migrate_ai_fields.sql
-- =====================================================

USE blog_db;

-- 添加 AI 摘要字段（如果不存在）
SET @dbname = DATABASE();
SET @tablename = 'articles';
SET @columnname = 'ai_summary';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE articles ADD COLUMN ai_summary VARCHAR(500) DEFAULT NULL COMMENT \'AI生成摘要\''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加 embedding 字段（如果不存在）
SET @columnname = 'embedding';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE articles ADD COLUMN embedding JSON DEFAULT NULL COMMENT \'文章向量（语义搜索用）\''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 显示迁移结果
SELECT '迁移完成！' AS message;
DESCRIBE articles;
