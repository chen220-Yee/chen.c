<template>
  <div class="user-info-container">
    <!-- 个人资料卡片 -->
    <div class="profile-card">
      <!-- 左侧头像区 -->
      <div class="avatar-section">
        <el-avatar 
          :src="userInfo.avatar" 
          :size="120"
          class="user-avatar"
        />
      </div>

      <!-- 右侧信息区 -->
      <div class="info-section">
        <div class="username">{{ userInfo.username }}</div>
        <div class="user-id">小红书号：{{ userInfo._id }} | IP属地：{{ userInfo.location || '未知' }}</div>
        <div class="bio">个性签名：{{ userInfo.bio || '这个人很懒，什么都没写~' }}</div>
        <div class="tags">
          <el-tag v-if="userInfo.gender === 'female'" type="danger">
            <el-icon><Female /></el-icon>
          </el-tag>
          <el-tag v-else-if="userInfo.gender === 'male'" type="primary">
            <el-icon><Male /></el-icon>
          </el-tag>
        </div>
        <div class="user-stats">
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><Notebook /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ userInfo.postsCount || 0 }}</div>
              <div class="stat-label">笔记</div>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><StarFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ userInfo.totalLikes || 0 }}</div>
              <div class="stat-label">获赞</div>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><Collection /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ userInfo.totalCollections || 0 }}</div>
              <div class="stat-label">被收藏</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 编辑按钮 -->
      <el-button 
        class="edit-button"
        type="primary" 
        @click="showEditDialog"
      >
        编辑资料
      </el-button>
    </div>

    <!-- 编辑资料对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑个人资料"
      width="500px"
    >
      <el-form 
        ref="formRef"
        :model="editForm"
        :rules="rules"
        label-width="100px"
      >
        <!-- 头像上传 -->
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :http-request="handleAvatarUpload"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="editForm.avatar" :src="editForm.avatar" class="avatar">
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <!-- 用户名 -->
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" maxlength="20" show-word-limit />
        </el-form-item>

        <!-- 性别 -->
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio :value="'male'">男</el-radio>
            <el-radio :value="'female'">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 个性签名 -->
        <el-form-item label="个性签名">
          <el-input
            v-model="editForm.bio"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="写点什么介绍自己吧..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Plus, 
  Female, 
  Male, 
  Notebook, 
  StarFilled, 
  Collection 
} from '@element-plus/icons-vue'
import { authApi } from '../api/auth'
import request from '../api/config'

const userInfo = ref({})
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const editForm = ref({
  avatar: '',
  username: '',
  gender: '',
  bio: ''
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await authApi.getUserInfo()
    console.log('获取到的用户信息:', res.data)
    if (res.data.success) {
      userInfo.value = res.data.user
      console.log('设置后的用户信息:', userInfo.value)
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 显示编辑对话框
const showEditDialog = () => {
  editForm.value = {
    avatar: userInfo.value.avatar || '',
    username: userInfo.value.username || '',
    gender: userInfo.value.gender || 'male',
    bio: userInfo.value.bio || ''
  }
  dialogVisible.value = true
}

// 处理头像上传
const handleAvatarUpload = async ({ file }) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await request.post('/upload?type=avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (res.data.success) {
      editForm.value.avatar = res.data.url;
      // 确保图片加载完成
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.src = res.data.url;
      });
      return res.data.url;
    } else {
      throw new Error(res.data.message || '上传失败');
    }
  } catch (error) {
    console.error('头像上传失败:', error);
    ElMessage.error('头像上传失败');
    throw error;
  }
};

// 头像上传前的验证
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    // 构造更新数据
    const updateData = {
      username: editForm.value.username,
      gender: editForm.value.gender,
      bio: editForm.value.bio,
      avatar: editForm.value.avatar
    }
    
    console.log('提交的数据:', updateData)
    
    const res = await authApi.updateUserInfo(updateData)
    
    if (res.data.success) {
      ElMessage.success('保存成功')
      dialogVisible.value = false
      await fetchUserInfo() // 重新获取用户信息
    } else {
      throw new Error(res.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.user-info-container {
  padding: 20px;
}

.profile-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  display: flex;
  position: relative;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.avatar-section {
  margin-right: 40px;
}

.user-avatar {
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-section {
  flex: 1;
}

.username {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.user-id {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.bio {
  font-size: 16px;
  color: #333;
  margin-bottom: 16px;
}

.tags {
  margin-bottom: 16px;
}

.user-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 0 32px;
  transition: transform 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin-right: 12px;
  background: #f6f8ff;
  color: #409EFF;
  font-size: 24px;
  transition: all 0.3s ease;
}

.stat-item:hover .stat-icon {
  background: #409EFF;
  color: white;
  transform: scale(1.05);
}

.stat-content {
  text-align: left;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-divider {
  width: 1px;
  height: 48px;
  background: #ebeef5;
  margin: 0 8px;
}

.stat-item:nth-child(1) .stat-icon {
  background: #ecf5ff;
  color: #409EFF;
}

.stat-item:nth-child(3) .stat-icon {
  background: #fff3e8;
  color: #ff9a2f;
}

.stat-item:nth-child(5) .stat-icon {
  background: #f0f9eb;
  color: #67c23a;
}

.stat-item:nth-child(1):hover .stat-icon {
  background: #409EFF;
  color: white;
}

.stat-item:nth-child(3):hover .stat-icon {
  background: #ff9a2f;
  color: white;
}

.stat-item:nth-child(5):hover .stat-icon {
  background: #67c23a;
  color: white;
}

@media screen and (max-width: 768px) {
  .user-stats {
    padding: 16px;
  }

  .stat-item {
    padding: 0 16px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-label {
    font-size: 12px;
  }
}

@media screen and (max-width: 576px) {
  .stat-item {
    padding: 0 12px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
    margin-right: 8px;
  }

  .stat-value {
    font-size: 18px;
  }
}

.edit-button {
  position: absolute;
  top: 20px;
  right: 20px;
}

.avatar-uploader {
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}
</style> 