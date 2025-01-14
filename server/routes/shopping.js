const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// 管理员API
// 获取商品列表(管理员)
router.get('/admin/products', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }

    console.log('Fetching products for admin...');
    const products = await Product.find().lean().exec();
    console.log('Raw products from database:', products);
    
    // 处理字段名不一致的问题
    const formattedProducts = products.map(product => {
      try {
        const formatted = {
          _id: product._id,
          name: product.name || product.goodsName || '',
          price: product.price || 0,
          stock: product.stock || 0,
          description: product.description || product.goodsContent || '',
          picture: product.picture || '/default-product.png',
          category: product.category || 'other',
          createdAt: product.createdAt || new Date()
        };
        console.log(`Formatted product ${product._id}:`, formatted);
        return formatted;
      } catch (err) {
        console.error('Error formatting product:', err, product);
        return null;
      }
    }).filter(Boolean); // 过滤掉可能的 null 值

    console.log('Final formatted products:', formattedProducts);
    res.json({ 
      success: true, 
      products: formattedProducts 
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取商品列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 创建商品(管理员)
router.post('/admin/products', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '创建商品失败' 
    });
  }
});

// 更新商品(管理员)
router.put('/admin/products/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '更新商品失败' 
    });
  }
});

// 删除商品(管理员)
router.delete('/admin/products/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '删除商品失败' 
    });
  }
});

// 用户API
// 获取商品列表(用户)
router.get('/products', async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    
    if (category && category !== 'recommend') {
      query.category = category;
    }
    
    const products = await Product.find(query).sort({ createdAt: -1 });
    
    // 处理字段名不一致的问题
    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.name || product.goodsName,
      price: product.price,
      stock: product.stock || 0,
      description: product.description || product.goodsContent,
      picture: product.picture,
      category: product.category,
      createdAt: product.createdAt
    }));

    res.json({
      success: true,
      products: formattedProducts
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取商品列表失败'
    });
  }
});

// 获取商品详情(用户)
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    // 格式化商品数据
    const formattedProduct = {
      _id: product._id,
      name: product.name || product.goodsName || '',
      price: product.price || 0,
      stock: product.stock || 0,
      description: product.description || product.goodsContent || '',
      picture: product.picture || '/default-product.png',
      category: product.category || 'other',
      createdAt: product.createdAt || new Date()
    };

    res.json({
      success: true,
      product: formattedProduct
    });
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取商品详情失败'
    });
  }
});

// 添加测试路由
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Shopping routes are working' 
  });
});

module.exports = router; 