const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证token'
      });
    }

    // 添加对管理员token的特殊处理
    if (token === 'admin-token') {
      req.user = {
        id: 'admin',
        isAdmin: true
      };
      return next();
    }

    // 普通用户token验证
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      isAdmin: false
    };
    next();
  } catch (error) {
    console.error('认证失败:', error);
    res.status(401).json({
      success: false,
      message: '认证失败',
      error: error.message
    });
  }
}; 