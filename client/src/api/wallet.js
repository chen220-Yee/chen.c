import request from './config'

export const walletApi = {
  // 获取钱包信息
  getWalletInfo() {
    return request.get('/wallet/info')
  },
  
  // 提交充值请求
  submitRecharge(amount) {
    return request.post('/wallet/recharge', { amount })
  },
  
  // 获取充值请求列表(管理员)
  getRechargeRequests() {
    return request.get('/wallet/requests')
  },
  
  // 处理充值请求(管理员)
  handleRechargeRequest(userId, requestId, status) {
    return request.put(`/wallet/requests/${userId}/${requestId}`, { status })
  }
} 