-- FAQ 功能数据库迁移脚本
-- 为 articles 表添加 ai_faq 字段，用于缓存 AI 生成的常见问题

-- 添加 ai_faq 字段（JSON 类型，存储问答数组）
ALTER TABLE articles ADD COLUMN IF NOT EXISTS ai_faq JSON DEFAULT NULL;

-- 如果上面的语句报错（MySQL 5.7 不支持 IF NOT EXISTS），使用下面的语句：
-- ALTER TABLE articles ADD COLUMN ai_faq JSON DEFAULT NULL;

-- 验证字段是否添加成功
-- DESCRIBE articles;
