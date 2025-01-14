import request from './config'

export const orderApi = {
  // 创建订单
  createOrder(data) {
    return request.post('/order', data)
  },

  // 获取订单列表
  getOrders() {
    return request.get('/order')
  },

  // 获取订单详情
  getOrderDetail(orderId) {
    return request.get(`/order/${orderId}`)
  }
} 