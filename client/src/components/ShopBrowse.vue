<template>
  <div class="shop-container">
    <!-- 分类筛选 -->
    <div class="category-filter">
      <el-radio-group v-model="selectedCategory" @change="handleCategoryChange">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="服装">服装</el-radio-button>
        <el-radio-button label="食品">食品</el-radio-button>
        <el-radio-button label="电器">电器</el-radio-button>
        <el-radio-button label="家具">家具</el-radio-button>
        <el-radio-button label="百货">百货</el-radio-button>
        <el-radio-button label="其它">其它</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 商品网格展示 -->
    <div class="products-grid" v-loading="loading">
      <div 
        v-for="item in filteredProducts" 
        :key="item.id" 
        class="product-card" 
        @click="openProductDetail(item)"
      >
        <div class="product-image-wrapper">
          <el-image 
            :src="item.picture || '/default-product.png'" 
            fit="cover" 
            lazy
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </div>

        <div class="product-info">
          <h3 class="product-name">{{ item.goodsName || item.name }}</h3>
          <p class="product-desc">{{ item.description || item.goodsContent || '暂无描述' }}</p>
          <div class="product-footer">
            <div class="price-tag">
              <span class="currency">¥</span>
              <span class="amount">{{ item.price }}</span>
            </div>
            <el-button 
              type="primary" 
              size="small" 
              class="buy-button"
            >
              <el-icon><ShoppingCart /></el-icon>
              购买
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 商品详情弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentProduct?.name"
      width="800px"
      @close="handleDialogClose"
    >
      <div v-if="currentProduct" class="dialog-content">
        <div class="product-image">
          <el-image
            :src="currentProduct.picture || '/default-product.png'"
            fit="cover"
          />
        </div>
        <div class="product-detail">
          <h2>{{ currentProduct.name }}</h2>
          <p class="price">¥{{ currentProduct.price }}</p>
          <div class="description">
            {{ currentProduct.description || currentProduct.goodsContent || '暂无描述' }}
          </div>
          <div class="purchase-actions">
            <el-input-number
              v-model="quantity"
              :min="1"
              :max="currentProduct.stock"
              size="large"
            />
            <el-button
              type="primary"
              size="large"
              :disabled="!currentProduct.stock"
              @click="addToCart"
            >
              {{ currentProduct.stock ? '加入购物车' : '已售罄' }}
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, Wallet, Collection, ShoppingCart } from '@element-plus/icons-vue'
import { formatTime } from '../utils/format'
import defaultAvatar from '../assets/logo.jpg'
import { productApi } from '../api/product'
import { cartApi } from '../api/cart'

// 响应式数据
const products = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const currentProduct = ref(null)
const quantity = ref(1)
const selectedCategory = ref('')

// 根据分类筛选商品
const filteredProducts = computed(() => {
  if (!selectedCategory.value) {
    return products.value
  }
  return products.value.filter(product => product.category === selectedCategory.value)
})

// 获取商品列表
const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await productApi.getProducts({
      category: selectedCategory.value
    })
    if (res.data.success) {
      products.value = res.data.products
    } else {
      ElMessage.error(res.data.message || '获取商品列表失败')
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

// 切换分类
const handleCategoryChange = () => {
  fetchProducts()
}

// 打开商品详情
const openProductDetail = async (product) => {
  try {
    const res = await productApi.getProductDetail(product._id);
    if (res.data.success) {
      currentProduct.value = {
        ...res.data.product,
        name: res.data.product.name || res.data.product.goodsName || '未命名商品',
        description: res.data.product.description || res.data.product.goodsContent || '暂无描述',
        picture: res.data.product.picture || '/default-product.png',
        price: res.data.product.price || 0,
        stock: res.data.product.stock || 0
      };
      dialogVisible.value = true;
      quantity.value = 1;
    } else {
      throw new Error(res.data.message || '获取商品详情失败');
    }
  } catch (error) {
    console.error('获取商品详情失败:', error);
    ElMessage.error('获取商品详情失败');
  }
};

// 关闭弹窗
const handleDialogClose = () => {
  dialogVisible.value = false
  currentProduct.value = null
  quantity.value = 1
}

// 添加到购物车
const addToCart = async () => {
  try {
    console.log('添加商品到购物车:', {
      productId: currentProduct.value._id,
      quantity: quantity.value
    });
    
    const res = await cartApi.addToCart(currentProduct.value._id, quantity.value);
    console.log('添加购物车响应:', res.data);
    
    if (res.data.success) {
      ElMessage.success('已添加到购物车');
      dialogVisible.value = false;
    } else {
      throw new Error(res.data.message || '添加购物车失败');
    }
  } catch (error) {
    console.error('添加购物车失败:', error);
    ElMessage.error(error.response?.data?.message || '添加购物车失败');
  }
};

// 组件挂载时获取商品列表
onMounted(() => {
  fetchProducts()
})

console.log('ShopBrowse component mounted')
</script>

<style scoped>
.shop-container {
  padding: 20px;
}

.category-filter {
  margin-bottom: 24px;
  text-align: center;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
  padding: 0 20px;
}

.product-card {
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.product-image-wrapper {
  position: relative;
  padding-top: 75%; 
  overflow: hidden;
}

.product-image-wrapper .el-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.3s;
}

.product-card:hover .product-image-wrapper .el-image {
  transform: scale(1.05);
}

.product-info {
  padding: 12px;
}

.product-name {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.product-desc {
  margin: 0 0 8px;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.currency {
  font-size: 14px;
  color: #ff2442;
}

.amount {
  font-size: 18px;
  font-weight: bold;
  color: #ff2442;
}

.buy-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}

@media screen and (max-width: 1400px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

@media screen and (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    padding: 0 10px;
  }

  .product-info {
    padding: 8px;
  }

  .product-name {
    font-size: 14px;
  }

  .product-desc {
    font-size: 12px;
  }

  .amount {
    font-size: 16px;
  }
}
</style> 