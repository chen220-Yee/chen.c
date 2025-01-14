const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const bcrypt = require('bcryptjs');

// 创建订单
router.post('/', auth, async (req, res) => {
  try {
    const { products, totalAmount, payPassword } = req.body;

    // 验证支付密码
    const user = await User.findById(req.user.id);
    const isValidPassword = await bcrypt.compare(payPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: '支付密码错误'
      });
    }

    // 检查余额
    if (user.wallet.balance < totalAmount) {
      return res.status(400).json({
        success: false,
        message: '余额不足'
      });
    }

    // 检查库存并更新
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `商品 ${product?.name || item.productId} 库存不足`
        });
      }
      product.stock -= item.quantity;
      await product.save();
    }

    // 创建订单
    const order = new Order({
      userId: req.user.id,
      products,
      totalAmount,
      status: 'paid'
    });
    await order.save();

    // 扣除余额
    user.wallet.balance = Number((user.wallet.balance - totalAmount).toFixed(2));
    await user.save();

    // 清空已购买的商品
    const cart = await Cart.findOne({ userId: req.user.id });
    if (cart) {
      const purchasedProductIds = products.map(item => item.productId.toString());
      cart.items = cart.items.filter(item => 
        !purchasedProductIds.includes(item.productId.toString())
      );
      await cart.save();
    }

    res.json({
      success: true,
      message: '支付成功',
      order
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败'
    });
  }
});

// 获取订单列表
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // 获取总数（只统计已支付订单）
    const total = await Order.countDocuments({ 
      userId: req.user.id,
      status: 'paid'  // 只统计已支付订单
    });

    // 获取订单列表并填充商品信息（只获取已支付订单）
    const orders = await Order.find({ 
      userId: req.user.id,
      status: 'paid'  // 只获取已支付订单
    })
      .populate({
        path: 'products.productId',
        select: 'name picture price'
      })
      .sort({ createTime: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      orders,
      total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败'
    });
  }
});

// 取消订单
router.put('/:orderId/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.id,
      status: 'pending'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在或无法取消'
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: '订单已取消',
      order
    });
  } catch (error) {
    console.error('取消订单失败:', error);
    res.status(500).json({
      success: false,
      message: '取消订单失败'
    });
  }
});

module.exports = router; 