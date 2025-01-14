import request from './config'

export const shoppingApi = {
  // 获取商品列表(用户)
  getProducts(category) {
    return request.get('/shopping/products', {
      params: { category }
    }).catch(error => {
      console.error('获取商品列表失败:', error);
      throw error;
    });
  },

  // 获取商品详情(用户)
  getProductDetail(id) {
    return request.get(`/shopping/products/${id}`).catch(error => {
      console.error('获取商品详情失败:', error);
      throw error;
    });
  }
} 