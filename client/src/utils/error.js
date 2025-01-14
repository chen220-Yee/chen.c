import { ElMessage } from 'element-plus'

export const handleError = (error, defaultMessage = '操作失败') => {
  console.error('API Error:', error)
  
  // 处理网络错误
  if (!error.response) {
    ElMessage.error('网络连接失败，请检查网络设置')
    return
  }

  // 处理特定状态码
  switch (error.response.status) {
    case 400:
      ElMessage.error(error.response.data.message || '请求参数错误')
      break
    case 404:
      ElMessage.error(error.response.data.message || '请求的资源不存在')
      break
    case 500:
      ElMessage.error(error.response.data.message || '服务器内部错误')
      break
    default:
      ElMessage.error(error.response.data.message || defaultMessage)
  }
} 