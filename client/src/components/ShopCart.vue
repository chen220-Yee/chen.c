<template>
  <div class="cart-container">
    <h2>购物车</h2>
    
    <div v-loading="loading">
      <el-empty v-if="cartItems.length === 0" description="购物车是空的" />
      
      <div v-else class="cart-items">
        <!-- 全选功能 -->
        <div class="select-all">
          <el-checkbox 
            v-model="isAllSelected"
            @change="handleSelectAll"
          >
            全选
          </el-checkbox>
        </div>

        <!-- 购物车商品列表 -->
        <div v-for="item in cartItems" :key="item.productId._id" class="cart-item">
          <div class="item-select">
            <el-checkbox 
              v-model="selectedItems[item.productId._id]"
              @change="handleItemSelect"
            />
          </div>
          
          <div class="item-info">
            <el-image 
              :src="item.productId.picture || '/default-product.png'" 
              fit="cover"
              class="product-image"
            />
            <div class="product-details">
              <h3>{{ item.productId.name }}</h3>
              <p class="price">¥{{ item.productId.price }}</p>
            </div>
          </div>
          
          <div class="item-actions">
            <el-input-number 
              v-model="item.quantity" 
              :min="1" 
              :max="99"
              size="small"
              @change="(value) => handleQuantityChange(item.productId._id, value)"
            />
            <el-button 
              type="danger" 
              link
              @click="handleRemove(item.productId._id)"
            >
              删除
            </el-button>
          </div>
        </div>

        <!-- 底部结算栏 -->
        <div class="cart-footer">
          <div class="selected-info">
            已选择 {{ selectedCount }} 件商品
          </div>
          <div class="total">
            总计: ¥{{ selectedTotal }}
          </div>
          <el-button 
            type="primary" 
            :disabled="selectedCount === 0"
            @click="handleCheckout"
          >
            结算({{ selectedCount }})
          </el-button>
        </div>
      </div>
    </div>

    <!-- 结算对话框 -->
    <checkout-dialog
      v-model="checkoutVisible"
      :products="selectedProducts"
      @success="handleCheckoutSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { cartApi } from '../api/cart'
import CheckoutDialog from './CheckoutDialog.vue'

const loading = ref(false)
const cartItems = ref([])
const selectedItems = ref({}) // 记录选中状态
const checkoutVisible = ref(false) // 添加结算对话框显示状态

// 计算全选状态
const isAllSelected = computed({
  get: () => {
    return cartItems.value.length > 0 && 
      cartItems.value.every(item => selectedItems.value[item.productId._id])
  },
  set: (value) => {
    cartItems.value.forEach(item => {
      selectedItems.value[item.productId._id] = value
    })
  }
})

// 计算选中商品数量
const selectedCount = computed(() => {
  return Object.values(selectedItems.value).filter(Boolean).length
})

// 计算选中商品总价
const selectedTotal = computed(() => {
  return cartItems.value
    .filter(item => selectedItems.value[item.productId._id])
    .reduce((total, item) => {
      return total + (item.productId.price * item.quantity)
    }, 0)
    .toFixed(2)
})

// 全选/取消全选
const handleSelectAll = (value) => {
  cartItems.value.forEach(item => {
    selectedItems.value[item.productId._id] = value
  })
}

// 单个商品选择
const handleItemSelect = () => {
  // 更新选中状态
}

// 获取购物车列表
const fetchCartItems = async () => {
  loading.value = true
  try {
    const res = await cartApi.getCartItems()
    if (res.data.success) {
      cartItems.value = res.data.cart?.items || []
      // 初始化选中状态
      cartItems.value.forEach(item => {
        if (!(item.productId._id in selectedItems.value)) {
          selectedItems.value[item.productId._id] = false
        }
      })
    }
  } catch (error) {
    ElMessage.error('获取购物车失败')
  } finally {
    loading.value = false
  }
}

// 更新商品数量
const handleQuantityChange = async (productId, quantity) => {
  try {
    const res = await cartApi.updateCartItem(productId, quantity)
    if (res.data.success) {
      await fetchCartItems()
    } else {
      ElMessage.error(res.data.message || '更新数量失败')
    }
  } catch (error) {
    console.error('更新数量失败:', error)
    ElMessage.error('更新数量失败')
  }
}

// 删除商品
const handleRemove = async (productId) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
      type: 'warning'
    })
    
    const res = await cartApi.removeFromCart(productId)
    if (res.data.success) {
      ElMessage.success('删除成功')
      await fetchCartItems()
    } else {
      ElMessage.error(res.data.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 添加选中商品的计算属性
const selectedProducts = computed(() => 
  cartItems.value.filter(item => selectedItems.value[item.productId._id])
)

// 结算
const handleCheckout = () => {
  if (selectedProducts.value.length === 0) {
    ElMessage.warning('请选择要结算的商品')
    return
  }

  checkoutVisible.value = true
}

// 结算成功处理
const handleCheckoutSuccess = async () => {
  await fetchCartItems()
  selectedItems.value = {} // 重置选中状态
  ElMessage.success('订单已生成')
}

onMounted(() => {
  fetchCartItems()
})
</script>

<style scoped>
.cart-container {
  padding: 20px;
}

.select-all {
  padding: 10px 20px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 20px;
  margin-bottom: 10px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.item-select {
  margin-right: 20px;
}

.item-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
}

.product-details h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.price {
  color: #ff2442;
  font-weight: bold;
  margin: 0;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cart-footer {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.selected-info {
  color: #666;
}

.total {
  font-size: 18px;
  font-weight: bold;
  color: #ff2442;
}

@media screen and (max-width: 768px) {
  .cart-item {
    flex-direction: column;
    gap: 16px;
  }

  .item-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style> 