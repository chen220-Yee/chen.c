<template>
  <div class="profile-container">
    <el-menu mode="horizontal" :default-active="activeMenu" router>
      <el-menu-item index="/profile/info">
        <el-icon><User /></el-icon>
        <span>个人信息</span>
      </el-menu-item>
      
      <el-menu-item index="/profile/notes">
        <el-icon><Document /></el-icon>
        <span>我的笔记</span>
      </el-menu-item>
      
      <el-menu-item index="/profile/collections">
        <el-icon><Star /></el-icon>
        <span>我的收藏</span>
      </el-menu-item>
      
      <el-menu-item index="/profile/likes">
        <el-icon><GoodsFilled /></el-icon>
        <span>我的点赞</span>
      </el-menu-item>
      
      <el-menu-item index="/profile/wallet">
        <el-icon><Wallet /></el-icon>
        <span>我的钱包</span>
      </el-menu-item>
    </el-menu>
    
    <router-view></router-view>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { 
  User, 
  Document, 
  Star, 
  GoodsFilled,
  Wallet
} from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.el-menu {
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
}

:deep(.el-menu-item) {
  display: flex;
  align-items: center;
  gap: 5px;
}

:deep(.el-icon) {
  margin-right: 5px;
}
</style> 