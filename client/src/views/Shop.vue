<template>
  <div class="shop-container">
    <!-- 顶部导航 -->
    <el-menu mode="horizontal" :default-active="activeMenu" router>
      <el-menu-item index="/red/shop/browse">
        <el-icon><ShoppingBag /></el-icon>
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
    </el-menu>

    <!-- 路由视图 -->
    <router-view></router-view>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ShoppingBag, ShoppingCart, List } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.shop-container {
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
