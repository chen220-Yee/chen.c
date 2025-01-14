<template>
  <div class="red-app">
    <!-- 头部导航 -->
    <header class="header">
      <div class="header-content">
        <!-- Logo -->
        <div class="logo">
          <img src="../assets/logo.jpg" alt="小红书" width="67" height="24">
        </div>

        <!-- 搜索框 -->
        <div class="search-box">
          <el-input 
            v-model="searchText" 
            placeholder="搜索你感兴趣的内容"
            class="search-input"
            @keyup.enter="handleSearch"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>

        <!-- 添加发布按钮 -->
        <div class="publish-btn">
          <el-button 
            type="danger" 
            round 
            @click="handlePublish"
          >
            <el-icon><Plus /></el-icon>
            发布笔记
          </el-button>
        </div>

        <!-- 用户信息 -->
        <div class="user-info">
          <el-avatar 
            :src="userAvatar" 
            :size="32"
            @error="handleAvatarError"
          />
          <span class="username">{{ username }}</span>
          <el-button type="danger" link @click="handleLogout">退出</el-button>
        </div>
      </div>
    </header>

    <!-- 主体内容 -->
    <div class="main-container">
      <!-- 侧边栏 -->
      <el-aside class="sidebar" width="220px">
        <el-menu
          class="side-menu"
          :default-active="activeMenu"
          router
        >
          <el-menu-item index="/explore">
            <el-icon><Compass /></el-icon>
            <span>发现</span>
          </el-menu-item>

          <el-menu-item index="/publish">
            <el-icon><EditPen /></el-icon>
            <span>发布笔记</span>
          </el-menu-item>

          <el-sub-menu index="/shop">
            <template #title>
              <el-icon><ShoppingBag /></el-icon>
              <span>购物</span>
            </template>
            <el-menu-item index="/red/shop/browse">
              <el-icon><Goods /></el-icon>
              <span>逛商城</span>
            </el-menu-item>
            <el-menu-item index="/red/shop/cart">
              <el-icon><ShoppingCart /></el-icon>
              <span>购物车</span>
            </el-menu-item>
            <el-menu-item index="/red/shop/orders">
              <el-icon><List /></el-icon>
              <span>我的订单</span>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="/profile">
            <template #title>
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </template>
            <el-menu-item index="/profile/info">个人资料</el-menu-item>
            <el-menu-item index="/profile/notes">我的笔记</el-menu-item>
            <el-menu-item index="/profile/collections">我的收藏</el-menu-item>
            <el-menu-item index="/profile/likes">我的点赞</el-menu-item>
          </el-sub-menu>

          <el-menu-item index="/profile/wallet">
            <el-icon><Wallet /></el-icon>
            <span>我的钱包</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主要内容区 -->
      <el-main class="main-content">
        <router-view 
          ref="childComponent"
          @search-complete="handleSearchComplete"
        ></router-view>
      </el-main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  Search, 
  Compass, 
  EditPen, 
  ShoppingBag, 
  ShoppingCart, 
  Goods,
  List,
  User,
  Plus,
  Wallet
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { authApi } from '../api/auth'
import { handleError } from '../utils/error'
import { postApi } from '../api/posts'

const router = useRouter()
const route = useRoute()

// 响应式数据
const searchText = ref('')
const username = ref('')
const userAvatar = ref('')
const activeMenu = ref('/explore')
const childComponent = ref(null)

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return null
    }

    const res = await authApi.getUserInfo()
    if (res.data.success) {
      const { user } = res.data
      username.value = user.username
      userAvatar.value = user.avatar || '/default-avatar.png'
      localStorage.setItem('username', user.username)
      localStorage.setItem('avatar', user.avatar)
      return user
    } else {
      ElMessage.error(res.data.message || '获取用户信息失败')
      return null
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    handleError(error)
    if (error.response?.status === 401) {
      router.push('/login')
    }
    return null
  }
}

// 在 onMounted 中调用
onMounted(async () => {
  await fetchUserInfo()
})

// 处理搜索
const handleSearch = async () => {
  if (!searchText.value.trim()) {
    return;
  }

  // 跳转到搜索结果页
  await router.push({
    path: '/search',
    query: { search: searchText.value.trim() }
  });
}

// 处理搜索完成事件
const handleSearchComplete = (success) => {
  if (!success) {
    ElMessage.error('搜索失败');
  }
}

// 监听路由变化，清空搜索框
watch(
  () => router.currentRoute.value.path,
  (newPath) => {
    if (newPath !== '/explore') {
      searchText.value = ''
    }
  }
)

// 添加退出登录方法
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('avatar')
  router.push('/login')
  ElMessage.success('已退出登录')
}

// 处理头像加载错误
const handleAvatarError = () => {
  userAvatar.value = '/default-avatar.png'
}

// 添加发布按钮处理函数
const handlePublish = () => {
  router.push('/publish')
}
</script>

<style scoped>
.red-app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
}

.header {
  height: 60px;
  min-height: 60px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.header-content {
  max-width: 1440px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.logo {
  margin-right: 40px;
  display: flex;
  align-items: center;
}

.logo img {
  height: 24px;
  width: auto;
}

.search-box {
  flex: 1;
  max-width: 400px;
  margin: 0 16px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
  background: #f5f5f5;
  box-shadow: none !important;
}

.search-input :deep(.el-input-group__append) {
  background: #ff2442;
  border-color: #ff2442;
  color: white;
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
}

.publish-btn {
  margin: 0 16px;
}

.publish-btn :deep(.el-button) {
  padding: 8px 16px;
}

.publish-btn :deep(.el-icon) {
  margin-right: 4px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.username {
  font-size: 14px;
  color: #333;
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: #f6f6f6;
}

.sidebar {
  background: #fff;
  border-right: 1px solid #f0f0f0;
  padding: 16px 0;
  height: 100%;
}

.side-menu {
  border-right: none;
  background: transparent;
}

.side-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 4px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.side-menu :deep(.el-menu-item.is-active) {
  background-color: #fef0f0;
  color: #ff2442;
}

.side-menu :deep(.el-sub-menu__title) {
  height: 50px;
  line-height: 50px;
  margin: 4px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.side-menu :deep(.el-menu-item:hover),
.side-menu :deep(.el-sub-menu__title:hover) {
  background-color: #f5f5f5;
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #fff;
  border-radius: 8px;
  margin: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 美化滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}

::-webkit-scrollbar-track {
  background: #f5f5f5;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }

  .search-box {
    margin: 0 16px;
  }

  .sidebar {
    width: 200px !important;
  }

  .main-content {
    padding: 16px;
    margin: 12px;
  }

  .publish-btn {
    margin: 0 8px;
  }
  
  .publish-btn :deep(.el-button) {
    padding: 8px 16px;
  }
  
  .publish-btn :deep(.el-icon) {
    margin-right: 4px;
  }
}

@media screen and (max-width: 576px) {
  .logo {
    margin-right: 16px;
  }

  .search-box {
    max-width: 200px;
  }

  .username {
    display: none;
  }

  .publish-btn span {
    display: none;
  }
  
  .publish-btn :deep(.el-button) {
    padding: 8px;
  }
}
</style>
