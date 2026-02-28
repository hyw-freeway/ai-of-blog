/**
 * 文件上传路由
 * 处理图片、文件（包括 PDF）的上传
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '../uploads');
const imagesDir = path.join(uploadsDir, 'images');
const filesDir = path.join(uploadsDir, 'files');

[uploadsDir, imagesDir, filesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 生成唯一文件名
const generateFileName = (originalName) => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
};

// 修复中文文件名编码
const decodeFileName = (filename) => {
  try {
    return Buffer.from(filename, 'latin1').toString('utf8');
  } catch (e) {
    return filename;
  }
};

// 图片上传配置
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file.originalname));
  }
});

// 文件上传配置
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filesDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file.originalname));
  }
});

// 图片文件过滤
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'));
  }
};

// 文件过滤（允许 PDF、图片等）
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|md|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'));
  }
};

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadFile = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

/**
 * POST /api/upload/image
 * 上传图片（需要登录）
 */
router.post('/image', authMiddleware, uploadImage.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.error('请选择要上传的图片', 400);
    }
    
    const imageUrl = `/uploads/images/${req.file.filename}`;
    const originalName = decodeFileName(req.file.originalname);
    
    res.success({
      url: imageUrl,
      filename: req.file.filename,
      originalName: originalName,
      size: req.file.size
    }, '图片上传成功');
  } catch (error) {
    console.error('图片上传错误:', error);
    res.error('图片上传失败', 500);
  }
});

/**
 * POST /api/upload/file
 * 上传文件（需要登录）
 */
router.post('/file', authMiddleware, uploadFile.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.error('请选择要上传的文件', 400);
    }
    
    const fileUrl = `/uploads/files/${req.file.filename}`;
    const originalName = decodeFileName(req.file.originalname);
    const ext = path.extname(originalName).toLowerCase();
    const isPdf = ext === '.pdf';
    
    res.success({
      url: fileUrl,
      filename: req.file.filename,
      originalName: originalName,
      size: req.file.size,
      type: ext.substring(1),
      isPdf
    }, '文件上传成功');
  } catch (error) {
    console.error('文件上传错误:', error);
    res.error('文件上传失败', 500);
  }
});

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.error('文件大小超出限制', 400);
    }
    return res.error(error.message, 400);
  }
  res.error(error.message || '上传失败', 500);
});

module.exports = router;
