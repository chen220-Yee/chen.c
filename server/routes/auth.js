const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const mongoose = require('mongoose');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // 确保这个目录存在
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// 注册
router.post('/register', async (req, res) => {
  try {
    // 添加 CORS 头
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    const { username, password } = req.body;
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建新用户
    const user = new User({
      username,
      password: hashedPassword,
      avatar: req.body.avatar || ''
    });

    // 保存用户
    await user.save();
    
    res.status(201).json({ 
      success: true,
      message: '注册成功' 
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ 
      success: false,
      message: '注册失败',
      error: error.message 
    });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: '用户不存在' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: '密码错误' 
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar || '/default-avatar.png'
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ 
      success: false,
      message: '登录失败',
      error: error.message 
    });
  }
});

// 文件上传路由
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: '没有上传文件' 
      });
    }
    // 修改返回的文件URL路径
    const fileUrl = `/api/uploads/${req.file.filename}`;
    res.json({ 
      url: fileUrl 
    });
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({ 
      message: '文件上传失败'
    });
  }
});

// 获取用户信息
router.get('/user', authMiddleware, async (req, res) => {
  try {
    // 如果是管理员
    if (req.user.isAdmin) {
      return res.json({
        success: true,
        user: {
          id: 'admin',
          username: 'admin',
          avatar: '/default-avatar.png',
          isAdmin: true
        }
      });
    }

    // 普通用户 - 使用聚合管道获取统计数据
    const [userStats] = await User.aggregate([
      {
        $match: { 
          _id: new mongoose.Types.ObjectId(req.user.id) 
        }
      },
      {
        $lookup: {
          from: 'posts',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$userId', '$$userId'] }
              }
            }
          ],
          as: 'posts'
        }
      },
      {
        $addFields: {
          totalLikes: {
            $sum: {
              $map: {
                input: '$posts',
                as: 'post',
                in: { $size: { $ifNull: ['$$post.likes', []] } }
              }
            }
          },
          totalCollections: {
            $sum: {
              $map: {
                input: '$posts',
                as: 'post',
                in: { $size: { $ifNull: ['$$post.collections', []] } }
              }
            }
          },
          postsCount: { $size: '$posts' }
        }
      }
    ]);

    if (!userStats) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      user: {
        id: userStats._id,
        username: userStats.username,
        avatar: userStats.avatar || '/default-avatar.png',
        gender: userStats.gender,
        bio: userStats.bio,
        totalLikes: userStats.totalLikes || 0,
        totalCollections: userStats.totalCollections || 0,
        postsCount: userStats.postsCount || 0
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

// 更新用户信息
router.put('/user', authMiddleware, async (req, res) => {
  try {
    console.log('更新用户信息:', req.body);

    const { username, avatar, gender, bio } = req.body;
    
    // 检查用户名是否已存在（排除当前用户）
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user.id } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名已被使用'
        });
      }
    }

    // 更新用户信息
    const updateData = {};
    if (username) updateData.username = username;
    if (avatar) updateData.avatar = avatar;
    if (gender) updateData.gender = gender;
    if (bio !== undefined) updateData.bio = bio;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '更新成功',
      user
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新失败',
      error: error.message
    });
  }
});

module.exports = router;