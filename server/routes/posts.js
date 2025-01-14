const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/posts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 检查文件是否已经存在
    const uploadDir = path.join(__dirname, '../uploads/posts');
    const files = fs.readdirSync(uploadDir);
    const existingFile = files.find(f => f === file.originalname);
    
    if (existingFile) {
      // 如果文件已存在，直接使用现有文件名
      cb(null, existingFile);
    } else {
      // 如果是新文件，生成新的文件名
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
    }
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('只支持 jpg、jpeg、png、gif 格式的图片！'));
  }
};

// 创建 multer 实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制5MB
    files: 9 // 最多9个文件
  },
  fileFilter: fileFilter
});

// 检查点赞状态
router.get('/like/check/:id', auth, async (req, res) => {
  try {
    console.log('检查点赞状态请求:', {
      postId: req.params.id,
      userId: req.user.id
    });

    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: '帖子ID不能为空'
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    // 确保 likes 数组存在
    if (!post.likes) {
      post.likes = [];
      await post.save();
    }

    const isLiked = post.likes.includes(req.user.id);
    
    console.log('检查点赞状态结果:', {
      postId: req.params.id,
      userId: req.user.id,
      isLiked,
      likesCount: post.likes.length
    });

    res.json({
      success: true,
      isLiked,
      likesCount: post.likes.length
    });
  } catch (error) {
    console.error('检查点赞状态失败:', error);
    res.status(500).json({
      success: false,
      message: '检查点赞状态失败',
      error: error.message
    });
  }
});

// 点赞帖子
router.post('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    // 检查是否已经点赞
    const isLiked = post.likes.includes(req.user.id);
    if (isLiked) {
      return res.status(400).json({
        success: false,
        message: '已经点赞过了'
      });
    }

    // 添加点赞
    post.likes.push(req.user.id);
    await post.save();

    // 返回更新后的点赞数
    res.json({
      success: true,
      message: '点赞成功',
      likesCount: post.likes.length,
      userId: req.user.id
    });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({
      success: false,
      message: '点赞失败'
    });
  }
});

// 取消点赞
router.delete('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    const index = post.likes.indexOf(req.user.id);
    if (index === -1) {
      return res.status(400).json({
        success: false,
        message: '尚未点赞'
      });
    }

    // 移除点赞
    post.likes.splice(index, 1);
    await post.save();

    // 返回更新后的点赞数
    res.json({
      success: true,
      message: '取消点赞成功',
      likesCount: post.likes.length,
      userId: req.user.id
    });
  } catch (error) {
    console.error('取消点赞失败:', error);
    res.status(500).json({
      success: false,
      message: '取消点赞失败'
    });
  }
});

// 获取用户点赞的帖子列表
router.get('/likes', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      likes: req.user.id
    })
    .populate('userId', 'username avatar')
    .sort({ createTime: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Post.countDocuments({ likes: req.user.id });

    res.json({
      success: true,
      posts,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('获取点赞列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取点赞列表失败'
    });
  }
});

// 检查收藏状态
router.get('/collect/check/:id', auth, async (req, res) => {
  try {
    console.log('检查收藏状态请求:', {
      postId: req.params.id,
      userId: req.user.id
    });

    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: '帖子ID不能为空'
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    // 确保 collections 数组存在
    if (!post.collections) {
      post.collections = [];
      await post.save();
    }

    const isCollected = post.collections.includes(req.user.id);
    
    console.log('检查收藏状态结果:', {
      postId: req.params.id,
      userId: req.user.id,
      isCollected,
      collectionsCount: post.collections.length
    });

    res.json({
      success: true,
      isCollected,
      collectionsCount: post.collections.length
    });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    res.status(500).json({
      success: false,
      message: '检查收藏状态失败',
      error: error.message
    });
  }
});

// 获取收藏列表
router.get('/collections', auth, async (req, res) => {
  try {
    console.log('获取收藏列表请求:', {
      userId: req.user.id,
      page: req.query.page,
      limit: req.query.limit
    });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // 查找用户收藏的帖子
    const posts = await Post.find({
      'collections': req.user.id
    })
    .populate('userId', 'username avatar')  // 确保正确填充用户信息
    .sort({ createTime: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Post.countDocuments({ 'collections': req.user.id });

    // 打印查询结果
    console.log('收藏列表查询结果:', {
      total,
      postsCount: posts.length,
      samplePost: posts[0]
    });

    res.json({
      success: true,
      posts,
      total,
      page,
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('获取收藏列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取收藏列表失败',
      error: error.message
    });
  }
});

// 收藏帖子
router.post('/collect/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    // 检查是否已经收藏
    const isCollected = post.collections.includes(req.user.id);
    if (isCollected) {
      return res.status(400).json({
        success: false,
        message: '已经收藏过了'
      });
    }

    // 添加收藏
    post.collections.push(req.user.id);
    await post.save();

    // 返回更新后的收藏数
    res.json({
      success: true,
      message: '收藏成功',
      collectionsCount: post.collections.length,
      userId: req.user.id
    });
  } catch (error) {
    console.error('收藏失败:', error);
    res.status(500).json({
      success: false,
      message: '收藏失败'
    });
  }
});

// 取消收藏
router.delete('/collect/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    const index = post.collections.indexOf(req.user.id);
    if (index === -1) {
      return res.status(400).json({
        success: false,
        message: '尚未收藏'
      });
    }

    // 移除收藏
    post.collections.splice(index, 1);
    await post.save();

    // 返回更新后的收藏数
    res.json({
      success: true,
      message: '取消收藏成功',
      collectionsCount: post.collections.length,
      userId: req.user.id
    });
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json({
      success: false,
      message: '取消收藏失败'
    });
  }
});

// 获取用户帖子列表
router.get('/user', auth, async (req, res) => {
  try {
    console.log('获取用户帖子请求开始，用户ID:', req.user.id);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // 确保用户ID存在
    if (!req.user.id) {
      return res.status(400).json({
        success: false,
        message: '用户ID不存在'
      });
    }

    const posts = await Post.find({ userId: req.user.id })
      .populate('userId', 'username avatar')
      .sort({ createTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ userId: req.user.id });

    console.log('查询结果:', {
      userId: req.user.id,
      postsCount: posts.length,
      total
    });

    const formattedPosts = posts.map(post => ({
      id: post._id,
      title: post.title,
      content: post.content,
      coverUrl: post.coverUrl || '/images/default-post-cover.svg',
      category: post.category,
      createTime: post.createTime,
      likes: post.likes?.length || 0,
      collections: post.collections?.length || 0,
      comments: post.comments?.length || 0
    }));

    res.json({
      posts: formattedPosts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取用户帖子列表失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取用户帖子列表失败',
      error: error.message
    });
  }
});

// 获取帖子详情
router.get('/detail/:id', auth, async (req, res) => {
  try {
    console.log('获取帖子详情请求:', {
      postId: req.params.id,
      userId: req.user.id
    });

    // 确保 ID 格式正确
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: '无效的帖子ID'
      });
    }

    // 使用 aggregate 获取实时统计数据
    const [post] = await Post.aggregate([
      { 
        $match: { 
          _id: new mongoose.Types.ObjectId(req.params.id) 
        } 
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          collectionsCount: { $size: { $ifNull: ['$collections', []] } },
          commentsCount: { $size: { $ifNull: ['$comments', []] } }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          coverUrl: 1,
          category: 1,
          createTime: 1,
          images: 1,
          comments: 1,
          likesCount: 1,
          collectionsCount: 1,
          commentsCount: 1,
          userId: {
            _id: '$userInfo._id',
            username: '$userInfo.username',
            avatar: { $ifNull: ['$userInfo.avatar', '/default-avatar.png'] }
          }
        }
      }
    ]);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    console.log('返回的帖子详情:', post);

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取帖子详情失败',
      error: error.message
    });
  }
});

// 获取帖子列表（用户端）
router.get('/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const query = {
      status: 'normal'  // 只获取正常状态的帖子
    };
    
    if (category !== 'recommend') {
      query.category = category;
    }

    // 使用 aggregate 来获取完整的用户信息和统计数据
    const posts = await Post.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          collectionsCount: { $size: { $ifNull: ['$collections', []] } },
          userId: {
            _id: '$userInfo._id',
            username: '$userInfo.username',
            avatar: { $ifNull: ['$userInfo.avatar', '/default-avatar.png'] }
          }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          coverUrl: 1,
          category: 1,
          createTime: 1,
          images: 1,
          status: 1,
          likesCount: 1,
          collectionsCount: 1,
          userId: 1
        }
      },
      { $sort: { createTime: -1 } },
      { $skip: (page - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    // 获取总数
    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取帖子列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取帖子列表失败'
    });
  }
});

// 获取用户自己的帖子列表
router.get('/user/posts', auth, async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    
    const posts = await Post.find({ 
      userId: req.user.id,
      // 用户可以看到自己所有状态的帖子
    })
    .sort({ createTime: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户帖子失败'
    });
  }
});

// 搜索帖子
router.get('/search', auth, async (req, res) => {
  try {
    const { keyword, page = 1, limit = 12 } = req.query;
    
    const query = {
      status: 'normal',  // 只搜索正常状态的帖子
      $or: [
        { title: new RegExp(keyword, 'i') },
        { content: new RegExp(keyword, 'i') }
      ]
    };

    const posts = await Post.find(query)
      .populate('userId', 'username avatar')
      .sort({ createTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '搜索失败'
    });
  }
});

// 评论帖子
router.post('/comment/:id', auth, async (req, res) => {
  try {
    console.log('添加评论请求:', {
      postId: req.params.id,
      userId: req.user.id,
      content: req.body.content
    });

    if (!req.body.content) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    // 创建新评论
    const newComment = {
      userId: req.user.id,
      content: req.body.content,
      createTime: new Date()
    };

    // 添加评论到帖子
    post.comments.push(newComment);
    await post.save();

    // 获取完整的评论信息（包括用户信息）
    const populatedPost = await Post.findById(post._id)
      .populate('comments.userId', 'username avatar');

    const addedComment = populatedPost.comments[populatedPost.comments.length - 1];

    // 格式化返回的评论数据
    const formattedComment = {
      id: addedComment._id,
      content: addedComment.content,
      createTime: addedComment.createTime,
      user: {
        username: addedComment.userId.username,
        avatar: addedComment.userId.avatar || '/default-avatar.png'
      }
    };

    res.json({
      success: true,
      message: '评论成功',
      comment: formattedComment
    });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({
      success: false,
      message: '添加评论失败',
      error: error.message
    });
  }
});

// 获取帖子评论列表
router.get('/comments/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('comments.userId', 'username avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    // 格式化评论数据
    const comments = post.comments.map(comment => ({
      id: comment._id,
      content: comment.content,
      createTime: comment.createTime,
      user: {
        username: comment.userId.username,
        avatar: comment.userId.avatar || '/default-avatar.png'
      }
    }));

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评论列表失败',
      error: error.message
    });
  }
});

// 删除评论
router.delete('/comment/:postId/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    // 检查是否是评论作者
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除此评论'
      });
    }

    comment.remove();
    await post.save();

    res.json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({
      success: false,
      message: '删除评论失败',
      error: error.message
    });
  }
});

// 发布帖子路由
router.post('/', auth, upload.array('images', 9), async (req, res) => {
  try {
    const { title, content, category } = req.body;
    
    // 处理图片路径
    const images = req.files ? req.files.map(file => `/api/uploads/posts/${file.filename}`) : [];
    
    const post = new Post({
      userId: req.user.id,
      title,
      content,
      category,
      images,
      coverUrl: images.length > 0 ? images[0] : undefined
    });

    await post.save();
    
    res.json({
      success: true,
      message: '发布成功',
      post
    });
  } catch (error) {
    console.error('发布帖子失败:', error);
    res.status(500).json({
      success: false,
      message: '发布失败'
    });
  }
});

// 删除帖子
router.delete('/:id', auth, async (req, res) => {
  try {
    // 添加详细的请求日志
    console.log('删除请求详情:', {
      postId: req.params.id,
      userId: req.user.id,
      isValidId: mongoose.Types.ObjectId.isValid(req.params.id),
      headers: req.headers,
      auth: req.user
    });

    // 验证 ID 格式
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('无效的帖子ID');
      return res.status(400).json({
        success: false,
        message: '无效的帖子ID'
      });
    }

    // 查找帖子并打印结果
    const post = await Post.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    console.log('查找到的帖子:', post);
    
    if (!post) {
      console.log('帖子不存在或无权删除');
      return res.status(404).json({ 
        success: false,
        message: '帖子不存在或无权删除' 
      });
    }

    // 执行删除操作
    console.log('开始删除帖子...');
    const result = await Post.deleteOne({ 
      _id: req.params.id,
      userId: req.user.id  // 确保只能删除自己的帖子
    });
    console.log('删除结果:', result);
    
    if (result.deletedCount === 1) {
      console.log('删除成功');
      res.json({ 
        success: true,
        message: '删除成功' 
      });
    } else {
      console.log('删除失败: 未找到要删除的帖子');
      res.status(500).json({
        success: false,
        message: '删除失败',
        error: '删除操作未能完成'
      });
    }
  } catch (error) {
    console.error('删除帖子时发生错误:', {
      error: error.message,
      stack: error.stack,
      postId: req.params.id,
      userId: req.user.id
    });
    
    res.status(500).json({ 
      success: false,
      message: '删除失败',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 修改帖子
router.put('/:id', auth, upload.array('images', 9), async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const existingImages = Array.isArray(req.body.existingImages) 
      ? req.body.existingImages 
      : req.body.existingImages ? [req.body.existingImages] : [];
    
    const post = await Post.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: '帖子不存在或无权修改' 
      });
    }

    // 更新基本信息
    if (title) post.title = title;
    if (content) post.content = content;
    if (category) post.category = category;

    // 处理图片
    const newImages = req.files ? req.files.map(file => `/api/uploads/posts/${file.filename}`) : [];
    
    // 合并保留的旧图片和新上传的图片
    post.images = [...existingImages, ...newImages];

    // 更新封面图
    if (post.images.length > 0) {
      post.coverUrl = post.images[0];
    }

    await post.save();
    
    res.json({ 
      success: true,
      message: '修改成功', 
      post 
    });
  } catch (error) {
    console.error('修改帖子失败:', error);
    res.status(500).json({ 
      success: false,
      message: '修改失败' 
    });
  }
});

// 添加一个测试路由来检查数据库中的帖子
router.get('/debug/posts', auth, async (req, res) => {
  try {
    const posts = await Post.find({}).populate('userId');
    console.log('所有帖子:', posts);
    res.json({
      success: true,
      total: posts.length,
      posts: posts.map(post => ({
        id: post._id,
        userId: post.userId,
        title: post.title,
        createTime: post.createTime
      }))
    });
  } catch (error) {
    console.error('调试查询失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 搜索帖子
router.get('/search', auth, async (req, res) => {
  try {
    let { keyword, page = 1, limit = 12 } = req.query;
    
    // 解码搜索关键词
    keyword = decodeURIComponent(keyword).trim();
    
    console.log('搜索请求:', {
      keyword,
      page,
      limit
    });

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      });
    }

    // 使用正则表达式构建搜索条件
    const searchRegex = new RegExp(keyword, 'i'); // 'i' 表示不区分大小写
    const searchQuery = {
      $or: [
        { title: searchRegex },
        { category: searchRegex }
      ]
    };

    // 执行搜索查询
    const posts = await Post.find(searchQuery)
      .populate('userId', 'username avatar')
      .sort({ createTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // 获取总数
    const total = await Post.countDocuments(searchQuery);

    console.log('搜索结果:', {
      keyword,
      total,
      found: posts.length,
      query: searchQuery
    });

    // 格式化返回数据
    const formattedPosts = posts.map(post => ({
      _id: post._id,
      title: post.title,
      content: post.content,
      coverUrl: post.coverUrl || '/images/default-post-cover.svg',
      category: post.category,
      createTime: post.createTime,
      likesCount: post.likes?.length || 0,
      collectionsCount: post.collections?.length || 0,
      commentsCount: post.comments?.length || 0,
      userId: {
        _id: post.userId._id,
        username: post.userId.username,
        avatar: post.userId.avatar || '/default-avatar.png'
      },
      // 确定匹配类型
      matchType: post.title.toLowerCase().includes(keyword.toLowerCase()) ? 'title' : 'category'
    }));

    res.json({
      success: true,
      posts: formattedPosts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('搜索处理失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索失败',
      error: error.message
    });
  }
});

// 添加一个简单的测试路由
router.get('/test/all', auth, async (req, res) => {
  try {
    const posts = await Post.find();
    res.json({
      success: true,
      count: posts.length,
      posts: posts.map(p => ({
        id: p._id,
        title: p.title,
        category: p.category
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 添加一个测试路由
router.get('/test/search/:keyword', auth, async (req, res) => {
  try {
    const { keyword } = req.params;
    const searchQuery = {
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { category: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } }
      ]
    };

    const posts = await Post.find(searchQuery).lean();
    
    res.json({
      success: true,
      count: posts.length,
      posts: posts.map(p => ({
        id: p._id,
        title: p.title,
        category: p.category,
        userId: p.userId
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 添加测试路由
router.get('/test/data', auth, async (req, res) => {
  try {
    const posts = await Post.find().lean();
    console.log('数据库中的所有帖子:', {
      total: posts.length,
      samples: posts.slice(0, 3).map(p => ({
        id: p._id,
        title: p.title,
        category: p.category
      }))
    });
    
    res.json({
      success: true,
      total: posts.length,
      posts: posts.map(p => ({
        id: p._id,
        title: p.title,
        category: p.category
      }))
    });
  } catch (error) {
    console.error('测试查询失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取所有笔记（管理员）
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }

    const { search } = req.query;
    console.log('搜索关键词:', search); // 添加日志

    const query = search
      ? {
          $or: [
            { content: new RegExp(search, 'i') },
            { title: new RegExp(search, 'i') }
          ]
        }
      : {};

    const posts = await Post.find(query)
      .populate('userId', 'username avatar')
      .sort({ createTime: -1 });

    console.log('查询到的笔记:', posts.length);

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('获取笔记列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取笔记列表失败'
    });
  }
});

// 更新笔记状态
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }

    const { status } = req.body;
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '笔记不存在'
      });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新状态失败'
    });
  }
});

module.exports = router; 