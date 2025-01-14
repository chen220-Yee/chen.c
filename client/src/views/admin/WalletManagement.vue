<template>
  <div class="wallet-management">
    <h3>充值请求处理</h3>
    
    <el-table
      v-loading="loading"
      :data="requests"
      style="width: 100%"
    >
      <el-table-column prop="username" label="用户名" width="180" />
      
      <el-table-column prop="amount" label="充值金额" width="180">
        <template #default="{ row }">
          ¥{{ row.amount }}
        </template>
      </el-table-column>
      
      <el-table-column prop="createTime" label="申请时间" width="180">
        <template #default="{ row }">
          {{ new Date(row.createTime).toLocaleString() }}
        </template>
      </el-table-column>
      
      <el-table-column label="操作" fixed="right" width="200">
        <template #default="{ row }">
          <el-button 
            type="success" 
            size="small"
            @click="handleRequest(row, 'approved')"
          >
            同意
          </el-button>
          <el-button 
            type="danger" 
            size="small"
            @click="handleRequest(row, 'rejected')"
          >
            拒绝
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { walletApi } from '../../api/wallet'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const requests = ref([])

const fetchRequests = async () => {
  loading.value = true
  try {
    const res = await walletApi.getRechargeRequests()
    if (res.data.success) {
      requests.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取充值请求失败')
  } finally {
    loading.value = false
  }
}

const handleRequest = async (request, status) => {
  try {
    const res = await walletApi.handleRechargeRequest(
      request.userId,
      request._id,
      status
    )
    if (res.data.success) {
      ElMessage.success('处理成功')
      fetchRequests()
    }
  } catch (error) {
    ElMessage.error('处理失败')
  }
}

onMounted(() => {
  fetchRequests()
})
</script>

<style scoped>
.wallet-management {
  padding: 20px;
}
</style> 