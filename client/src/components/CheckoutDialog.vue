<template>
  <el-dialog
    v-model="visible"
    title="订单结算"
    width="500px"
    :close-on-click-modal="false"
  >
    <!-- 订单信息 -->
    <div class="order-info">
      <h3>订单详情</h3>
      <div class="product-list">
        <div v-for="item in products" :key="item.productId._id" class="product-item">
          <span class="name">{{ item.productId.name }}</span>
          <span class="quantity">x{{ item.quantity }}</span>
          <span class="price">¥{{ (item.productId.price * item.quantity).toFixed(2) }}</span>
        </div>
      </div>
      <div class="total">
        总计: <span class="price">¥{{ total }}</span>
      </div>
    </div>

    <!-- 支付密码输入 -->
    <el-form ref="formRef" :model="form" :rules="rules">
      <el-form-item prop="password" label="支付密码">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          placeholder="请输入支付密码"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm">
          确认支付
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { orderApi } from '../api/order'

const props = defineProps({
  modelValue: Boolean,
  products: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const form = ref({
  password: ''
})

const rules = {
  password: [
    { required: true, message: '请输入支付密码', trigger: 'blur' }
  ]
}

// 计算总价
const total = computed(() => {
  return props.products.reduce((sum, item) => {
    return sum + (item.productId.price * item.quantity)
  }, 0).toFixed(2)
})

// 取消支付
const handleCancel = () => {
  visible.value = false
  form.value.password = ''
}

// 确认支付
const handleConfirm = async () => {
  try {
    loading.value = true
    
    // 创建订单
    const orderData = {
      products: props.products.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price
      })),
      totalAmount: total.value,
      payPassword: form.value.password
    }

    const res = await orderApi.createOrder(orderData)
    
    if (res.data.success) {
      ElMessage.success('支付成功')
      emit('success')
      visible.value = false
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '支付失败')
  } finally {
    loading.value = false
    form.value.password = ''
  }
}
</script>

<style scoped>
.order-info {
  margin-bottom: 20px;
}

.product-list {
  margin: 10px 0;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.product-item:last-child {
  border-bottom: none;
}

.name {
  flex: 1;
}

.quantity {
  color: #666;
  margin: 0 20px;
}

.total {
  margin-top: 16px;
  text-align: right;
  font-weight: bold;
}

.price {
  color: #ff2442;
}
</style> 