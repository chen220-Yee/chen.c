const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// 获取购物车列表
router.get('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.productId');
    
    if (!cart) {
      return res.json({
        success: true,
        cart: { items: [] }
      });
    }
    
    res.json({
      success: true,
      cart: cart
    });
  } catch (error) {
    console.error('获取购物车失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取购物车失败'
    });
  }
});

// 添加商品到购物车
router.post('/', auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // 验证商品是否存在
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      // 如果购物车不存在，创建新的购物车
      cart = new Cart({
        userId: req.user.id,
        items: [{ productId, quantity }]
      });
    } else {
      // 如果购物车已存在，检查商品是否已在购物车中
      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (itemIndex > -1) {
        // 如果商品已存在，更新数量
        cart.items[itemIndex].quantity += quantity;
      } else {
        // 如果商品不存在，添加新商品
        cart.items.push({ productId, quantity });
      }
    }

    await cart.save();

    // 返回填充了商品详情的购物车数据
    const populatedCart = await Cart.findById(cart._id)
      .populate('items.productId');

    res.json({
      success: true,
      message: '已添加到购物车',
      cart: populatedCart
    });
  } catch (error) {
    console.error('添加到购物车失败:', error);
    res.status(500).json({
      success: false,
      message: '添加到购物车失败',
      error: error.message
    });
  }
});

// 更新购物车商品数量
router.put('/:productId', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '购物车不存在'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === req.params.productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新购物车失败'
    });
  }
});

// 删除购物车商品
router.delete('/:productId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '购物车不存在'
      });
    }

    cart.items = cart.items.filter(
      item => item.productId.toString() !== req.params.productId
    );

    await cart.save();
    res.json({
      success: true,
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除商品失败'
    });
  }
});

module.exports = router; 