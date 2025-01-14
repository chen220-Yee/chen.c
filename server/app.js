const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const shoppingRoutes = require('./routes/shopping');
const uploadRoutes = require('./routes/upload');
const path = require('path');
const cartRoutes = require('./routes/cart');
const fs = require('fs');
const statsRouter = require('./routes/stats');
const walletRouter = require('./routes/wallet');
const orderRouter = require('./routes/order');
const productRouter = require('./routes/product');

// 加载环境变量
dotenv.config();

const app = express();

// CORS 配置
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 确保上传目录存在
const uploadDirs = [
  path.join(__dirname, 'uploads/posts'),
  path.join(__dirname, 'uploads/avatars'),
  path.join(__dirname, 'uploads/products')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 静态文件服务
app.use('/api/uploads/posts', express.static(path.join(__dirname, 'uploads/posts')));
app.use('/api/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars')));
app.use('/api/uploads/products', express.static(path.join(__dirname, 'uploads/products')));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/stats', statsRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/order', orderRouter);
app.use('/api/shopping', productRouter);

// 添加路由日志
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers
  });
  next();
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: err.message
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 连接数据库
mongoose.connect(process.env.DATABASE_URL)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  }); 