<template>
  <div class="admin-layout">
    <el-container>
      <el-aside width="200px">
        <div class="aside-header">
          <h2>管理后台</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          class="admin-menu"
        >
          <el-menu-item index="/admin">
            <el-icon><DataLine /></el-icon>
            <span>数据中心</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/sales">
            <el-icon><TrendCharts /></el-icon>
            <span>销售统计</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/products">
            <el-icon><Goods /></el-icon>
            <span>商品管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/notes">
            <el-icon><Document /></el-icon>
            <span>笔记管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/wallet">
            <el-icon><Wallet /></el-icon>
            <span>充值处理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-container>
        <el-header>
          <div class="main-header">
            <div class="header-left"></div>
            <el-button type="danger" link @click="handleLogout">退出登录</el-button>
          </div>
        </el-header>
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  DataLine,
  Goods, 
  Document,
  Wallet,
  TrendCharts
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const activeMenu = computed(() => route.path)

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('isAdmin')
  router.push('/login')
  ElMessage.success('已退出登录')
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.el-container {
  height: 100%;
}

.el-aside {
  background-color: #304156;
  display: flex;
  flex-direction: column;
}

.aside-header {
  padding: 20px;
  border-bottom: 1px solid #1f2d3d;
}

.aside-header h2 {
  margin: 0;
  color: #fff;
  font-size: 18px;
  text-align: center;
}

.admin-menu {
  height: 100%;
  border-right: none;
  background-color: #304156;
}

:deep(.el-menu-item) {
  color: #bfcbd9;
}

:deep(.el-menu-item.is-active) {
  color: #409EFF;
  background-color: #263445;
}

:deep(.el-menu-item:hover) {
  background-color: #263445;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.el-header {
  padding: 0;
  background-color: #fff;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style> 