<template>
  <div class="publish-post">
    <el-form 
      ref="formRef"
      :model="postForm"
      :rules="rules"
      label-width="80px"
      class="post-form"
    >
      <!-- 标题 -->
      <el-form-item label="标题" prop="title">
        <el-input 
          v-model="postForm.title"
          placeholder="请输入标题（2-30字）"
          maxlength="30"
          show-word-limit
        />
      </el-form-item>

      <!-- 分类 -->
      <el-form-item label="分类" prop="category">
        <el-select v-model="postForm.category" placeholder="请选择分类">
          <el-option
            v-for="item in categories"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <!-- 内容 -->
      <el-form-item label="内容" prop="content">
        <el-input
          v-model="postForm.content"
          type="textarea"
          :rows="6"
          placeholder="分享你的故事..."
          maxlength="1000"
          show-word-limit
        />
      </el-form-item>

      <!-- 图片上传 -->
      <el-form-item label="图片">
        <el-upload
          v-model:file-list="fileList"
          action="#"
          list-type="picture-card"
          :http-request="handleUpload"
          :before-upload="beforeUpload"
          :on-remove="handleRemove"
          :on-preview="handlePreview"
          :limit="9"
        >
          <el-icon><Plus /></el-icon>
          <template #tip>
            <div class="upload-tip">
              支持jpg、png、gif格式，单张不超过5MB，最多9张
            </div>
          </template>
        </el-upload>
      </el-form-item>

      <!-- 提交按钮 -->
      <el-form-item>
        <el-button 
          type="primary" 
          :loading="publishing"
          @click="submitForm(formRef)"
        >
          发布
        </el-button>
        <el-button @click="resetForm(formRef)">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible">
      <img :src="previewUrl" alt="Preview" style="width: 100%">
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'
import request from '../api/config'
import { useRouter } from 'vue-router'

const router = useRouter()
const formRef = ref()
const publishing = ref(false)
const fileList = ref([])
const previewVisible = ref(false)
const previewUrl = ref('')

// 分类选项
const categories = [
  { value: 'books', label: '书籍' },
  { value: 'food', label: '美食' },
  { value: 'home', label: '家居' },
  { value: 'fashion', label: '穿搭' },
  { value: 'travel', label: '旅行' },
  { value: 'other', label: '其他' }
]

// 表单数据
const postForm = reactive({
  title: '',
  category: '',
  content: ''
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 30, message: '标题长度在2-30个字符之间', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 10, max: 1000, message: '内容长度在10-1000个字符之间', trigger: 'blur' }
  ]
}

// 上传前验证
const beforeUpload = (file) => {
  const isImage = /^image\/(jpeg|png|gif)$/.test(file.type)
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传jpg、png、gif格式的图片！')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB！')
    return false
  }
  return true
}

// 处理图片上传
const handleUpload = async ({ file }) => {
  try {
    // 检查是否已经上传过这个文件
    const existingFile = fileList.value.find(f => 
      f.raw && f.raw.name === file.name && f.raw.size === file.size
    );
    
    if (existingFile) {
      return existingFile.url;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    const res = await request.post('/upload?type=post', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (res.data.success) {
      // 保存文件信息以供后续检查
      file.url = res.data.url;
      return res.data.url;
    } else {
      throw new Error(res.data.message || '上传失败');
    }
  } catch (error) {
    console.error('文件上传失败:', error);
    ElMessage.error('文件上传失败');
    throw error;
  }
};

// 处理图片移除
const handleRemove = (file) => {
  const index = fileList.value.indexOf(file)
  if (index !== -1) {
    fileList.value.splice(index, 1)
  }
}

// 处理图片预览
const handlePreview = (file) => {
  previewUrl.value = file.url
  previewVisible.value = true
}

// 提交表单
const submitForm = async (formEl) => {
  if (!formEl) return;
  
  try {
    await formEl.validate();
    
    const formData = new FormData();
    formData.append('title', postForm.title);
    formData.append('content', postForm.content);
    formData.append('category', postForm.category);
    
    // 处理图片
    fileList.value.forEach(file => {
      // 直接使用原始文件上传
      if (file.raw) {
        formData.append('images', file.raw);
      }
    });

    const res = await request.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (res.data.success) {
      ElMessage.success('发布成功');
      router.push('/explore');
    }
  } catch (error) {
    console.error('发布失败:', error);
    ElMessage.error(error.response?.data?.message || '发布失败');
  }
};

// 重置表单
const resetForm = (formEl) => {
  if (!formEl) return
  formEl.resetFields()
  fileList.value = []
}
</script>

<style scoped>
.publish-post {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.post-form {
  margin-top: 20px;
}

.upload-tip {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

:deep(.el-upload--picture-card) {
  width: 120px;
  height: 120px;
  line-height: 120px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 120px;
  height: 120px;
}
</style> 