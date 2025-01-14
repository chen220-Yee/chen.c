import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import axios from 'axios'

// 创建应用实例
const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 添加全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Error Info:', info)
}

// 添加全局属性
app.config.globalProperties.$axios = axios
app.config.globalProperties.$baseUrl = import.meta.env.VITE_API_URL || '/api'

// 添加请求拦截器日志
axios.interceptors.request.use(config => {
  console.log('Sending request:', config.url, config.data)
  return config
})

// 添加响应拦截器日志
axios.interceptors.response.use(
  response => {
    console.log('Response success:', response.data)
    return response
  },
  error => {
    console.log('Response error:', error)
    return Promise.reject(error)
  }
)

// 配置 axios
axios.defaults.baseURL = '/api'
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

app.use(router)
app.use(ElementPlus)
app.mount('#app')
