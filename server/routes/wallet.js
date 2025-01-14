const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// 获取钱包信息
router.get('/info', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 格式化余额，保留两位小数
    const balance = user.wallet ? Number(user.wallet.balance.toFixed(2)) : 0;
    
    res.json({
      success: true,
      data: {
        balance,
        rechargeRequests: user.wallet?.rechargeRequests || []
      }
    });
  } catch (error) {
    console.error('获取钱包信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取钱包信息失败'
    });
  }
});

// 提交充值请求
router.post('/recharge', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '充值金额必须大于0'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 初始化钱包如果不存在
    if (!user.wallet) {
      user.wallet = {
        balance: 0,
        rechargeRequests: []
      };
    }
    
    user.wallet.rechargeRequests.push({
      amount,
      status: 'pending',
      createTime: new Date()
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: '充值申请已提交'
    });
  } catch (error) {
    console.error('提交充值申请失败:', error);
    res.status(500).json({
      success: false,
      message: '提交充值申请失败'
    });
  }
});

// 管理员获取所有充值请求
router.get('/requests', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }

    const users = await User.find({
      'wallet.rechargeRequests.status': 'pending'
    });

    const requests = users.reduce((acc, user) => {
      const pendingRequests = user.wallet.rechargeRequests
        .filter(req => req.status === 'pending')
        .map(req => ({
          userId: user._id,
          username: user.username,
          ...req.toObject()
        }));
      return [...acc, ...pendingRequests];
    }, []);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('获取充值请求失败:', error);
    res.status(500).json({
      success: false,
      message: '获取充值请求失败'
    });
  }
});

// 处理充值请求
router.put('/requests/:userId/:requestId', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }

    const { status } = req.body;
    const user = await User.findById(req.params.userId);
    const request = user.wallet.rechargeRequests.id(req.params.requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: '充值请求不存在'
      });
    }

    request.status = status;
    if (status === 'approved') {
      // 使用 toFixed 处理精度问题
      user.wallet.balance = Number((user.wallet.balance + request.amount).toFixed(2));
    }

    await user.save();

    res.json({
      success: true,
      message: '处理成功'
    });
  } catch (error) {
    console.error('处理充值请求失败:', error);
    res.status(500).json({
      success: false,
      message: '处理充值请求失败'
    });
  }
});

module.exports = router; 