<template>
  <div class="login">
    <div class="aside-pic"/>
    <div class="main">
      <div class="login-box">
        <!-- 切换登录/注册表单 -->
        <div class="toggle-form">
          <h2>{{ isLogin ? '登录' : '注册' }}{{ isLogin && isAdmin ? '管理后台' : '小红书' }}</h2>
          <!-- 只在登录模式下显示管理员切换开关 -->
          <el-switch
            v-if="isLogin"
            v-model="isAdmin"
            active-text="管理员"
            inactive-text="用户"
            @change="handleModeChange"
          />
        </div>

        <!-- 登录/注册表单 -->
        <transition name="form-fade" mode="out-in">
          <template v-if="isLogin">
            <el-form
              ref="formRef"
              :model="loginForm"
              :rules="rules"
              label-width="0"
            >
              <el-form-item prop="username">
                <el-input 
                  v-model="loginForm.username" 
                  placeholder="请输入用户名"
                  :disabled="loading"
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item prop="password">
                <el-input 
                  v-model="loginForm.password" 
                  type="password" 
                  placeholder="请输入密码"
                  show-password
                  :disabled="loading"
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <div class="form-actions">
                <el-button 
                  type="primary" 
                  :loading="loading"
                  @click="handleLogin"
                >
                  登录
                </el-button>
                <el-button 
                  :disabled="loading"
                  @click="toggleLoginMode(false)"
                >
                  注册账号
                </el-button>
              </div>
            </el-form>
          </template>

          <template v-else>
            <el-form
              ref="formRef"
              :model="registerForm"
              :rules="registerRules"
              label-width="0"
            >
              <!-- 头像上传 -->
              <el-form-item label="头像" prop="avatar">
                <div class="avatar-container">
                  <el-upload
                    class="avatar-uploader"
                    :http-request="handleAvatarUpload"
                    :show-file-list="false"
                    :before-upload="beforeAvatarUpload"
                    :disabled="loading"
                  >
                    <img v-if="avatar" :src="avatar" class="avatar">
                    <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                  </el-upload>
                </div>
              </el-form-item>

              <el-form-item prop="username">
                <el-input 
                  v-model="registerForm.username" 
                  placeholder="请设置用户名"
                  :disabled="loading"
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item prop="password">
                <el-input 
                  v-model="registerForm.password" 
                  type="password" 
                  placeholder="请设置密码"
                  show-password
                  :disabled="loading"
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item prop="confirmPassword">
                <el-input 
                  v-model="registerForm.confirmPassword" 
                  type="password" 
                  placeholder="请确认密码"
                  show-password
                  :disabled="loading"
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <div class="form-actions">
                <el-button 
                  type="primary" 
                  :loading="loading"
                  @click="handleRegister"
                >
                  注册
                </el-button>
                <el-button 
                  :disabled="loading"
                  @click="toggleLoginMode(true)"
                >
                  返回登录
                </el-button>
              </div>
            </el-form>
          </template>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Plus } from '@element-plus/icons-vue'
import axios from 'axios'
import { authApi } from '../api/auth'
import { handleError } from '../utils/error'

const router = useRouter()
const isLogin = ref(true)
const avatar = ref('')
const formRef = ref(null)
const loading = ref(false)
const isAdmin = ref(false)

const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  avatar: ''
})

// 添加表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3-20个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20个字符之间', trigger: 'blur' }
  ]
}

// 添加注册表单验证规则
const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3-20个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.value.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  avatar: [
    { required: true, message: '请上传头像', trigger: 'change' }
  ]
}

// 处理头像上传
const handleAvatarUpload = async (params) => {
  try {
    const formData = new FormData()
    formData.append('file', params.file)
    
    const res = await authApi.uploadAvatar(formData)
    
    avatar.value = res.data.url
    registerForm.value.avatar = res.data.url
    ElMessage.success('头像上传成功')
  } catch (error) {
    handleError(error, '头像上传失败')
  }
}

// 上传前验证
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('上传头像图片只能是图片格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 添加表单验证提示
const showValidateMessage = (message) => {
  ElMessage({
    message,
    type: 'warning',
    duration: 2000
  })
}

// 处理登录模式切换
const handleModeChange = () => {
  resetForm()
}

// 修改登录处理函数
const handleLogin = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch (error) {
    showValidateMessage('请填写正确的登录信息')
    return
  }
  
  loading.value = true
  try {
    // 如果是管理员登录
    if (isAdmin.value) {
      if (loginForm.value.username !== 'admin' || loginForm.value.password !== '88888888') {
        ElMessage.error('管理员账号或密码错误')
        return
      }
      localStorage.setItem('isAdmin', 'true')
      localStorage.setItem('token', 'admin-token')
      ElMessage.success('管理员登录成功')
      router.push('/admin/products')
      return
    }

    // 普通用户登录
    const res = await authApi.login({
      username: loginForm.value.username,
      password: loginForm.value.password
    })
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('username', res.data.user.username)
    localStorage.setItem('avatar', res.data.user.avatar || '/default-avatar.png')
    ElMessage.success('登录成功')
    router.push('/red')
  } catch (error) {
    handleError(error, '登录失败')
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch (error) {
    showValidateMessage('请填写正确的注册信息')
    return
  }
  
  loading.value = true
  try {
    await authApi.register({
      username: registerForm.value.username,
      password: registerForm.value.password,
      avatar: registerForm.value.avatar
    })
    handleRegisterSuccess()
  } catch (error) {
    handleError(error, '注册失败')
  } finally {
    loading.value = false
  }
}

// 修改重置方法
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  avatar.value = ''
  loading.value = false
  
  // 重置表单数据
  loginForm.value = {
    username: '',
    password: ''
  }
  registerForm.value = {
    username: '',
    password: '',
    confirmPassword: '',
    avatar: ''
  }
}

// 修改切换登录/注册的处理
const toggleLoginMode = (isLoginMode) => {
  isLogin.value = isLoginMode
  // 切换到注册模式时，确保不是管理员模式
  if (!isLoginMode) {
    isAdmin.value = false
  }
  resetForm()
}

// 修改注册成功后的处理
const handleRegisterSuccess = () => {
  ElMessage.success('注册成功')
  toggleLoginMode(true)
  resetForm()
}

// 添加键盘事件处理
const handleKeyPress = (event) => {
  if (event.key === 'Enter') {
    if (isLogin.value) {
      handleLogin()
    } else {
      handleRegister()
    }
  }
}

// 在 onMounted 中添加事件监听
onMounted(() => {
  window.addEventListener('keypress', handleKeyPress)
  const token = localStorage.getItem('token')
  if (token) {
    router.push('/explore')
  }
})

// 在 onUnmounted 中移除事件监听
onUnmounted(() => {
  window.removeEventListener('keypress', handleKeyPress)
})
</script>

<style scoped>
.login {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 700px;
  height: 480px;
  background: rgba(202, 131, 131, 0.575);
  border-radius: 15px;
  display: flex;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

.aside-pic {
  width: 300px;
  background-image: url('../assets/asideLogin.jpg');
  background-size: cover;
  background-position: center;
}

.main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-box {
  width: 100%;
  max-width: 320px;
}

.toggle-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.form-item {
  margin-bottom: 20px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

h2 {
  color: #333;
  margin-bottom: 30px;
}

/* 添加头像上传相关样式 */
.avatar-container {
  text-align: center;
  margin-bottom: 15px;
  position: relative;
}

.avatar-label {
  display: block;
  margin-bottom: 10px;
  color: #606266;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
  margin: 0 auto;
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

/* 修改表单样式 */
:deep(.el-input__wrapper) {
  box-shadow: none;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.3s;
}

:deep(.el-input__wrapper:hover) {
  border-color: #c0c4cc;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 1px #409eff;
}

:deep(.el-button) {
  width: 120px;
}

/* 添加过渡动画 */
.form-fade-enter-active,
.form-fade-leave-active {
  transition: opacity 0.3s ease;
}

.form-fade-enter-from,
.form-fade-leave-to {
  opacity: 0;
}

/* 优化移动端样式 */
@media screen and (max-width: 768px) {
  .login {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }

  .aside-pic {
    display: none;
  }

  .main {
    padding: 20px;
  }

  .login-box {
    max-width: 100%;
  }
}
</style>

