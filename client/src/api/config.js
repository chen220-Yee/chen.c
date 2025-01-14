import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 创建 axios 实例
const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
      console.log('发送请求携带 token:', {
        url: config.url,
        token: token.substring(0, 10) + '...'
      })
    } else {
      console.warn('请求未携带 token')
    }
    
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    console.log('发送请求:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  response => {
    console.log('响应数据:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('响应错误:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      const isAdmin = localStorage.getItem('isAdmin');
      localStorage.removeItem('token');
      if (isAdmin) {
        localStorage.removeItem('isAdmin');
      }
      router.push('/login');
      ElMessage.error(error.response.data.message || '登录已过期，请重新登录');
    }
    return Promise.reject(error);
  }
)

export default instance 