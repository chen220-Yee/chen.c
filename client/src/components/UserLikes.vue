<template>
  <div class="likes-container">
    <h2>我的点赞</h2>
    <div class="notes-grid" v-loading="loading">
      <el-empty 
        v-if="likedPosts.length === 0" 
        description="暂无点赞内容"
      />
      <el-card 
        v-for="post in likedPosts" 
        :key="post._id" 
        class="note-card"
        @click="viewDetail(post)"
      >
        <!-- 使用与 UserNotes 一致的图片展示方式 -->
        <img 
          :src="post.coverUrl" 
          class="note-image"
          @error="handleImageError"
        >

        <!-- 标题和内容 -->
        <div class="note-content">
          <h3>{{ post.title }}</h3>
          <p>{{ post.content }}</p>
        </div>

        <!-- 底部信息 -->
        <div class="note-footer">
          <div class="user-info">
            <el-avatar 
              :size="24" 
              :src="post.userId?.avatar || '/default-avatar.png'"
            />
            <span>{{ post.userId?.username || '未知用户' }}</span>
          </div>
          <div class="interaction-info">
            <span class="likes">
              <el-icon><Star /></el-icon>
              {{ formatNumber(post.likesCount || 0) }}
            </span>
            <span class="collections">
              <el-icon><Collection /></el-icon>
              {{ formatNumber(post.collectionsCount || 0) }}
            </span>
            <el-button 
              type="danger" 
              link 
              @click.stop="handleUnlike(post)"
            >
              <el-icon><Star /></el-icon>
              取消点赞
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
const likedPosts = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 获取点赞列表
const fetchLikedPosts = async () => {
  loading.value = true
  try {
    const res = await postApi.getLikedPosts(currentPage.value, pageSize.value)
    if (res.data.success) {
      likedPosts.value = res.data.posts
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取点赞列表失败:', error)
    ElMessage.error('获取点赞列表失败')
  } finally {
    loading.value = false
  }
}

// 取消点赞
const handleUnlike = async (post) => {
  try {
    const res = await postApi.unlikePost(post._id)
    if (res.data.success) {
      ElMessage.success('取消点赞成功')
      await fetchLikedPosts()
    }
  } catch (error) {
    ElMessage.error('取消点赞失败')
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
  fetchLikedPosts()
}

// 处理图片加载错误
const handleImageError = (e) => {
  e.target.src = '/default-post-cover.svg'
}

onMounted(() => {
  fetchLikedPosts()
})
</script>

<style scoped>
.likes-container {
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