<template>
  <div class="user-wallet">
    <el-card class="wallet-card">
      <template #header>
        <div class="card-header">
          <span>我的钱包</span>
          <el-button type="primary" @click="showRechargeDialog">申请充值</el-button>
        </div>
      </template>
      
      <div class="balance-info">
        <h3>当前余额</h3>
        <div class="balance">¥{{ formatBalance(walletInfo.balance) }}</div>
      </div>

      <div class="recharge-history">
        <h3>充值记录</h3>
        <el-table :data="walletInfo.rechargeRequests || []" style="width: 100%">
          <el-table-column prop="amount" label="金额">
            <template #default="{ row }">
              ¥{{ row.amount }}
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="createTime" label="申请时间">
            <template #default="{ row }">
              {{ new Date(row.createTime).toLocaleString() }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 充值对话框 -->
    <el-dialog
      v-model="rechargeDialogVisible"
      title="申请充值"
      width="30%"
    >
      <el-form :model="rechargeForm" label-width="80px">
        <el-form-item label="充值金额">
          <el-input-number 
            v-model="rechargeForm.amount" 
            :min="1"
            :precision="2"
            :step="10"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rechargeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRecharge">
            确认申请
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { walletApi } from '../api/wallet'
import { ElMessage } from 'element-plus'

const walletInfo = ref({})
const rechargeDialogVisible = ref(false)
const rechargeForm = ref({
  amount: 100
})

// 获取钱包信息
const fetchWalletInfo = async () => {
  try {
    const res = await walletApi.getWalletInfo()
    if (res.data.success) {
      walletInfo.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取钱包信息失败')
  }
}

// 显示充值对话框
const showRechargeDialog = () => {
  rechargeDialogVisible.value = true
}

// 提交充值申请
const submitRecharge = async () => {
  try {
    const res = await walletApi.submitRecharge(rechargeForm.value.amount)
    if (res.data.success) {
      ElMessage.success('充值申请已提交')
      rechargeDialogVisible.value = false
      fetchWalletInfo()
    }
  } catch (error) {
    ElMessage.error('提交充值申请失败')
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '处理中',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return texts[status] || status
}

// 格式化余额，保留两位小数
const formatBalance = (balance) => {
  return Number(balance || 0).toFixed(2);
}

onMounted(() => {
  fetchWalletInfo()
})
</script>

<style scoped>
.user-wallet {
  padding: 20px;
}

.wallet-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance-info {
  text-align: center;
  margin-bottom: 30px;
}

.balance {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
  margin-top: 10px;
}

.recharge-history {
  margin-top: 20px;
}

h3 {
  margin: 0 0 20px;
  font-size: 16px;
  color: #333;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 