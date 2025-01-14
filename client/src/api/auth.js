import request from './config'

export const authApi = {
  // 登录
  login(data) {
    return request.post('/auth/login', data)
  },

  // 注册
  register(data) {
    return request.post('/auth/register', data)
  },

  // 获取用户信息
  getUserInfo() {
    return request.get('/auth/user').catch(error => {
      console.error('获取用户信息失败:', error)
      throw error
    })
  },

  // 更新用户信息
  updateUserInfo(data) {
    return request.put('/auth/user', data).catch(error => {
      console.error('更新用户信息失败:', error)
      throw error
    })
  },

  // 上传头像
  uploadAvatar(formData) {
    return request.post('/auth/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
} 