import request from './config'

export const productApi = {
  // 获取商品列表
  getProducts(params) {
    return request.get('/shopping/products', { params })
  },

  // 获取商品详情
  getProductDetail(id) {
    return request.get(`/shopping/products/${id}`)
  },

  // 创建商品(管理员)
  createProduct(data) {
    return request.post('/shopping/admin/products', data)
  },

  // 更新商品(管理员)
  updateProduct(id, data) {
    return request.put(`/shopping/admin/products/${id}`, data)
  },

  // 删除商品(管理员)
  deleteProduct(id) {
    return request.delete(`/shopping/admin/products/${id}`)
  }
} 