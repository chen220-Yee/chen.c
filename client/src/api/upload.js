import request from './config'

export const uploadApi = {
  uploadFile(formData) {
    return request.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: progressEvent => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log('上传进度:', percentCompleted);
      }
    })
  }
} 