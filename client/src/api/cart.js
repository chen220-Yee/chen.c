import request from './config'

export const cartApi = {
  // 获取购物车列表
  getCartItems() {
    return request.get('/cart').catch(error => {
      console.error('获取购物车请求失败:', error);
      throw error;
    })
  },

  // 添加商品到购物车
  addToCart(productId, quantity) {
    return request.post('/cart', { productId, quantity }).catch(error => {
      console.error('添加购物车请求失败:', error);
      throw error;
    })
  },

  // 更新购物车商品数量
  updateCartItem(productId, quantity) {
    return request.put(`/cart/${productId}`, { quantity }).catch(error => {
      console.error('更新购物车请求失败:', error);
      throw error;
    })
  },

  // 从购物车删除商品
  removeFromCart(productId) {
    return request.delete(`/cart/${productId}`).catch(error => {
      console.error('删除购物车商品请求失败:', error);
      throw error;
    })
  }
} 