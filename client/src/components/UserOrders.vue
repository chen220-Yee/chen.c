<template>
  <div class="shop-orders">
    <h2>我的订单</h2>
    
    <div v-loading="loading">
      <el-empty v-if="orders.length === 0" description="暂无订单" />
      
      <div v-else class="order-list">
        <el-card v-for="order in orders" :key="order._id" class="order-card">
          <div class="order-header">
            <span class="order-time">下单时间：{{ formatTime(order.createTime) }}</span>
            <el-tag type="success">已支付</el-tag>
          </div>
          
          <div class="product-list">
            <div v-for="item in order.products" :key="item._id" class="product-item">
              <el-image 
                :src="item.productId.picture || '/default-product.png'"
                class="product-image"
              />
              <div class="product-info">
                <h4>{{ item.productId.name }}</h4>
                <p>数量：{{ item.quantity }}</p>
                <p class="price">¥{{ item.price }}</p>
              </div>
            </div>
          </div>
          
          <div class="order-footer">
            <span class="total">总计：¥{{ order.totalAmount }}</span>
          </div>
        </el-card>
      </div>
      
      <el-pagination
        v-if="total > pageSize"
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
        class="pagination"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { orderApi } from '../api/order'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const orders = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await orderApi.getOrders()
    if (res.data.success) {
      orders.value = res.data.orders
      total.value = res.data.total
    }
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const formatTime = (time) => {
  return new Date(time).toLocaleString()
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchOrders()
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.shop-orders {
  padding: 20px;
}

.order-card {
  margin-bottom: 20px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  color: #666;
}

.product-list {
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  padding: 16px 0;
}

.product-item {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
}

.product-info h4 {
  margin: 0 0 8px;
}

.product-info p {
  margin: 4px 0;
  color: #666;
}

.price {
  color: #ff2442;
  font-weight: bold;
}

.order-footer {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total {
  font-size: 18px;
  font-weight: bold;
  color: #ff2442;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style> 