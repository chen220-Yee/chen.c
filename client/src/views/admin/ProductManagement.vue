<template>
  <div class="product-management">
    <div class="page-header">
      <h3>商品管理</h3>
      <el-button type="primary" @click="handleAdd">添加商品</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="products"
      style="width: 100%"
      :row-style="{ height: '60px' }"
    >
      <el-table-column label="商品图片" width="80">
        <template #default="{ row }">
          <el-image
            :src="getImageUrl(row.picture)"
            fit="cover"
            style="width: 50px; height: 50px; border-radius: 4px;"
            :preview-src-list="row.picture ? [getImageUrl(row.picture)] : []"
            :initial-index="0"
            preview-teleported
            :preview-teleported-props="{
              style: { 
                maxWidth: '50vw',
                maxHeight: '70vh'
              }
            }"
          >
            <template #error>
              <div class="image-slot">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </template>
      </el-table-column>

      <el-table-column prop="name" label="商品名称" min-width="120">
        <template #default="{ row }">
          {{ row.name || row.goodsName || '未命名商品' }}
        </template>
      </el-table-column>

      <el-table-column prop="price" label="价格" width="120">
        <template #default="{ row }">
          ¥{{ row.price }}
        </template>
      </el-table-column>

      <el-table-column prop="stock" label="库存" width="120" />

      <el-table-column prop="description" label="商品描述" min-width="200">
        <template #default="{ row }">
          <el-tooltip
            :content="row.description || row.goodsContent || '暂无描述'"
            placement="top"
            :show-after="500"
          >
            <p class="description-text">
              {{ row.description || row.goodsContent || '暂无描述' }}
            </p>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString() }}
        </template>
      </el-table-column>

      <el-table-column prop="category" label="分类" />

      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button type="danger" link @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑商品对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑商品' : '添加商品'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <!-- 添加图片上传 -->
        <el-form-item label="商品图片" prop="picture">
          <div class="upload-container">
            <el-upload
              class="product-uploader"
              :http-request="handleImageUpload"
              :show-file-list="false"
              :before-upload="beforeImageUpload"
            >
              <img
                v-if="form.picture"
                :src="getImageUrl(form.picture)"
                class="product-image"
              >
              <el-icon v-else class="uploader-icon"><Plus /></el-icon>
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>

        <el-form-item label="商品分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类">
            <el-option label="服装" value="服装" />
            <el-option label="食品" value="食品" />
            <el-option label="电器" value="电器" />
            <el-option label="家具" value="家具" />
            <el-option label="百货" value="百货" />
            <el-option label="其它" value="其它" />
          </el-select>
        </el-form-item>

        <el-form-item label="商品价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="商品库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" :precision="0" />
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Picture } from '@element-plus/icons-vue'
import { productApi } from '../../api/product'
import request from '../../api/config'
import { useRouter } from 'vue-router'

const loading = ref(false)
const products = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const router = useRouter()

const form = ref({
  name: '',
  category: '',
  price: 0,
  stock: 0,
  description: '',
  picture: ''
})

const rules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入商品库存', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入商品描述', trigger: 'blur' }
  ],
  picture: [
    { required: true, message: '请上传商品图片', trigger: 'change' }
  ]
}

// 图片上传前的验证
const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 获取完整的图片URL
const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (!url.startsWith('/api/uploads')) {
    return `/api/uploads/${url}`;
  }
  return url;
}

// 处理图片上传
const handleImageUpload = async ({ file }) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const res = await request.post('/upload?type=product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (res.data.success && res.data.url) {
      form.value.picture = res.data.url.startsWith('/api/uploads') 
        ? res.data.url 
        : `/api/uploads/${res.data.url}`;
    } else {
      throw new Error('上传失败')
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败')
  }
}

// 获取商品列表
const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await productApi.getProducts()
    console.log('API response:', res.data);
    
    if (res.data.success) {
      products.value = res.data.products.map(product => {
        console.log('Processing product:', product);
        return {
          ...product,
          name: product.name || product.goodsName || '未命名商品',
          price: product.price || 0,
          stock: product.stock || 0,
          description: product.description || product.goodsContent || '',
          picture: product.picture || '/default-product.png'
        };
      });
      console.log('Final products:', products.value);
    } else {
      console.error('服务器错误详情:', res.data);
      throw new Error(res.data.message || '获取商品列表失败');
    }
  } catch (error) {
    console.error('获取商品列表失败:', error);
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录');
      router.push('/login');
    } else {
      ElMessage.error(error.message || '获取商品列表失败');
    }
  } finally {
    loading.value = false;
  }
};

// 添加商品
const handleAdd = () => {
  isEdit.value = false
  form.value = {
    name: '',
    category: '',
    price: 0,
    stock: 0,
    description: '',
    picture: ''
  }
  dialogVisible.value = true
}

// 编辑商品
const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

// 删除商品
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
      type: 'warning'
    })
    const res = await productApi.deleteProduct(row._id)
    if (res.data.success) {
      ElMessage.success('删除成功')
      await fetchProducts()
    } else {
      ElMessage.error(res.data.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      if (error.response?.status === 401) {
        ElMessage.error('登录已过期，请重新登录')
        router.push('/login')
      } else {
        ElMessage.error('删除失败')
      }
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      await productApi.updateProduct(form.value._id, form.value)
      ElMessage.success('更新成功')
    } else {
      await productApi.createProduct(form.value)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchProducts()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
  }
}

onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.product-management {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h3 {
  margin: 0;
}

.description-text {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  font-size: 13px;
  line-height: 1.2;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 16px;
}

.upload-container {
  text-align: center;
}

.product-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 120px;
  height: 120px;
  display: inline-block;
}

.product-uploader:hover {
  border-color: #409eff;
}

.product-image {
  width: 120px;
  height: 120px;
  display: block;
  object-fit: cover;
}

.uploader-icon {
  font-size: 24px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.el-table__cell) {
  padding: 4px 0;
}

:deep(.el-table .cell) {
  line-height: 1.3;
}

:deep(.el-image-viewer__wrapper) {
  .el-image-viewer__img {
    max-width: 800px;
    max-height: 600px;
  }
}
</style> 