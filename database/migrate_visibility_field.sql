-- =====================================================
-- 文章访问权限字段迁移脚本
-- 给 articles 表新增 visible_to_guest 字段：
--   1 = 访客可见（默认），0 = 仅管理员可见
-- 使用方法: mysql -u root -p blog_db < migrate_visibility_field.sql
-- =====================================================

USE blog_db;

-- 添加 visible_to_guest 字段（如果不存在）
SET @dbname = DATABASE();
SET @tablename = 'articles';
SET @columnname = 'visible_to_guest';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE articles ADD COLUMN visible_to_guest TINYINT(1) NOT NULL DEFAULT 1 COMMENT ''是否允许访客阅读：1=允许（默认），0=仅管理员'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 兼容旧数据：把 NULL 设置为默认值 1
UPDATE articles SET visible_to_guest = 1 WHERE visible_to_guest IS NULL;

-- 显示迁移结果
SELECT '迁移完成：visible_to_guest 字段已就绪' AS message;
DESCRIBE articles;
