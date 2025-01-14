const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');

// 获取商品列表
router.get('/products', async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    
    // 如果指定了分类，添加到查询条件
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query);
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取商品列表失败'
    });
  }
});

// 获取商品详情
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }
    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取商品详情失败'
    });
  }
});

// 管理员路由
router.post('/admin/products', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权限操作'
      });
    }

    const product = new Product(req.body);
    await product.save();
    res.json({
      success: true,
      message: '商品创建成功',
      product
    });
  } catch (error) {
    console.error('创建商品失败:', error);
    res.status(500).json({
      success: false,
      message: '创建商品失败'
    });
  }
});

router.put('/admin/products/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权限操作'
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    res.json({
      success: true,
      message: '商品更新成功',
      product
    });
  } catch (error) {
    console.error('更新商品失败:', error);
    res.status(500).json({
      success: false,
      message: '更新商品失败'
    });
  }
});

router.delete('/admin/products/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权限操作'
      });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    res.json({
      success: true,
      message: '商品删除成功'
    });
  } catch (error) {
    console.error('删除商品失败:', error);
    res.status(500).json({
      success: false,
      message: '删除商品失败'
    });
  }
});

module.exports = router; 