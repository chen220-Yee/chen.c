import request from './config'

export const statsApi = {
  // 获取仪表盘统计数据
  getDashboardStats() {
    return request.get('/stats/dashboard')
  },

  // 获取销售统计数据
  getSalesStats() {
    return request.get('/stats/sales')
  }
} 