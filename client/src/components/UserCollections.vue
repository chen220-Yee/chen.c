<template>
  <div class="collections-container">
    <h2>我的收藏</h2>
    <div class="notes-grid" v-loading="loading">
      <el-empty 
        v-if="collections.length === 0" 
        description="暂无收藏"
      />
      <el-card 
        v-for="note in collections" 
        :key="note._id" 
        class="note-card"
        @click="viewDetail(note)"
      >
        <!-- 使用与 UserLikes 一致的图片展示方式 -->
        <img 
          :src="note.coverUrl" 
          class="note-image"
          @error="handleImageError"
        >

        <!-- 标题和内容 -->
        <div class="note-content">
          <h3>{{ note.title }}</h3>
          <p>{{ note.content }}</p>
        </div>

        <!-- 底部信息 -->
        <div class="note-footer">
          <div class="user-info">
            <el-avatar 
              :size="24" 
              :src="note.userId?.avatar || '/default-avatar.png'"
            />
            <span>{{ note.userId?.username || '未知用户' }}</span>
          </div>
          <div class="interaction-info">
            <span class="likes">
              <el-icon><Star /></el-icon>
              {{ formatNumber(note.likesCount || 0) }}
            </span>
            <span class="collections">
              <el-icon><Collection /></el-icon>
              {{ formatNumber(note.collectionsCount || 0) }}
            </span>
            <el-button 
              type="danger" 
              link 
              @click.stop="handleUncollect(note)"
            >
              <el-icon><Star /></el-icon>
              取消收藏
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分页器 -->
    <el-pagination
      v-if="total > 0"
      v-model:current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next"
      @current-change="handlePageChange"
      class="pagination"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Star, Collection } from '@element-plus/icons-vue'
import { postApi } from '../api/posts'
import { useRouter } from 'vue-router'
import { formatNumber } from '../utils/format'

const router = useRouter()
const collections = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 获取收藏列表
const fetchCollections = async () => {
  loading.value = true
  try {
    const res = await postApi.getCollections(currentPage.value, pageSize.value)
    console.log('收藏列表响应:', res.data)
    
    if (res.data.success) {
      collections.value = res.data.posts
      total.value = res.data.total

      // 打印收藏列表数据，用于调试
      console.log('收藏列表数据:', {
        posts: collections.value,
        total: total.value,
        currentPage: currentPage.value
      })
    } else {
      throw new Error(res.data.message || '获取收藏列表失败')
    }
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    ElMessage.error(error.message || '获取收藏列表失败')
  } finally {
    loading.value = false
  }
}

// 取消收藏
const handleUncollect = async (post) => {
  try {
    const res = await postApi.uncollectPost(post._id)
    if (res.data.success) {
      ElMessage.success('取消收藏成功')
      await fetchCollections() // 重新获取列表
    }
  } catch (error) {
    console.error('取消收藏失败:', error)
    ElMessage.error(error.message || '取消收藏失败')
  }
}

// 查看帖子详情
const viewDetail = (post) => {
  router.push({
    path: '/explore',
    query: { postId: post._id }
  })
}

// 处理分页
const handlePageChange = (page) => {
  currentPage.value = page
  fetchCollections()
}

// 处理图片加载错误
const handleImageError = (e) => {
  e.target.src = '/default-post-cover.svg'
}

onMounted(() => {
  fetchCollections()
})
</script>

<style scoped>
.collections-container {
  padding: 20px;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin: 20px 0;
}

.note-card {
  transition: transform 0.3s;
  overflow: hidden;
}

.note-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.note-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.note-content {
  padding: 12px;
}

.note-content h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
}

.note-content p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-footer {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.interaction-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.likes,
.collections {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

@media screen and (max-width: 1400px) {
  .notes-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 992px) {
  .notes-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 576px) {
  .notes-grid {
    grid-template-columns: 1fr;
  }
}
</style> 