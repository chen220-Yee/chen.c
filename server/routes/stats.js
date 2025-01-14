const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const Order = require('../models/Order');
const Product = require('../models/Product');

// 获取仪表盘统计数据
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }

    // 获取用户总数
    const totalUsers = await User.countDocuments();
    
    // 获取今日新增用户数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsers = await User.countDocuments({
      createTime: { $gte: today }
    });

    // 获取笔记总数
    const totalPosts = await Post.countDocuments();

    // 获取今日新增笔记数
    const todayPosts = await Post.countDocuments({
      createTime: { $gte: today }
    });

    // 获取评论总数
    const posts = await Post.find();
    const totalComments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);

    // 获取各分类笔记数量
    const categoryStats = await Post.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // 获取最近12个月的笔记发布趋势
    const monthlyStats = await Post.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createTime' },
            month: { $month: '$createTime' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        userStats: {
          total: totalUsers,
          today: todayUsers
        },
        postStats: {
          total: totalPosts,
          today: todayPosts,
          comments: totalComments
        },
        categoryStats: categoryStats,
        monthlyStats: monthlyStats
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

// 获取销售统计数据
router.get('/sales', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }

    // 获取总销售额和订单数
    const totalStats = await Order.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // 按商品分类统计销量
    const categoryStats = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          quantity: { $sum: '$products.quantity' },
          sales: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }
        }
      },
      {
        $project: {
          category: '$_id',
          quantity: 1,
          sales: 1,
          _id: 0
        }
      }
    ]);

    // 按具体商品统计销量和销售额
    const productStats = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$products.productId',
          name: { $first: '$product.name' },
          quantity: { $sum: '$products.quantity' },
          sales: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }
        }
      },
      {
        $project: {
          name: 1,
          quantity: 1,
          sales: 1,
          _id: 0
        }
      },
      { $sort: { sales: -1 } },
      { $limit: 10 } // 只取销售额前10的商品
    ]);

    // 按日期统计销售趋势
    const salesTrend = await Order.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createTime' }
          },
          sales: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const response = {
      success: true,
      data: {
        total: totalStats[0] || { totalSales: 0, totalOrders: 0 },
        categories: categoryStats,
        products: productStats,
        trend: salesTrend
      }
    };

    console.log('返回的响应数据:', response);
    res.json(response);
  } catch (error) {
    console.error('获取销售统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取销售统计失败'
    });
  }
});

module.exports = router; 