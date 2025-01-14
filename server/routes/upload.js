const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 根据请求类型决定存储目录
    let uploadDir;
    switch (req.query.type) {
      case 'avatar':
        uploadDir = path.join(__dirname, '../uploads/avatars');
        break;
      case 'product':
        uploadDir = path.join(__dirname, '../uploads/products');
        break;
      default:
        uploadDir = path.join(__dirname, '../uploads/posts');
    }

    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 添加文件类型前缀
    const prefix = req.query.type || 'post';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 只接受图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只能上传图片文件!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制 5MB
  }
});

// 文件上传路由
router.post('/', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    // 根据上传类型构建正确的URL路径
    let fileUrl;
    switch (req.query.type) {
      case 'avatar':
        fileUrl = `/api/uploads/avatars/${req.file.filename}`;
        break;
      case 'product':
        fileUrl = `/api/uploads/products/${req.file.filename}`;
        break;
      default:
        fileUrl = `/api/uploads/posts/${req.file.filename}`;
    }
    
    console.log('文件上传成功:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      url: fileUrl
    });

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败'
    });
  }
});

// 错误处理中间件
router.use((error, req, res, next) => {
  console.error('上传路由错误:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小不能超过2MB'
      });
    }
  }
  res.status(500).json({
    success: false,
    message: error.message || '文件上传失败'
  });
});

module.exports = router; 