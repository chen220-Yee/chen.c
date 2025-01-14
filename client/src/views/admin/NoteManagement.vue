<template>
  <div class="note-management">
    <div class="page-header">
      <h3>笔记管理</h3>
      <el-input
        v-model="searchQuery"
        placeholder="搜索笔记内容或标题"
        style="width: 300px"
        clearable
        @input="debounceSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <el-table
      v-loading="loading"
      :data="notes"
      style="width: 100%"
    >
      <el-table-column prop="author" label="作者" width="200">
        <template #default="{ row }">
          <div class="author-cell">
            <el-avatar 
              :size="40" 
              :src="row.userId?.avatar || '/default-avatar.png'"
            />
            <span class="author-name">{{ row.userId?.username || '未知用户' }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="content" label="笔记内容" min-width="300">
        <template #default="{ row }">
          <el-tooltip
            :content="`${row.title}\n\n${row.content}`"
            placement="top"
            :show-after="500"
          >
            <div>
              <p class="title-text">{{ row.title }}</p>
              <p class="content-text">{{ row.content }}</p>
            </div>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ new Date(row.createTime).toLocaleString() }}
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            link 
            @click="handleView(row)"
          >
            查看
          </el-button>
          <el-button 
            type="danger" 
            link 
            @click="handleDelete(row)"
          >
            删除
          </el-button>
          <el-dropdown trigger="click" @command="(cmd) => handleStatus(row, cmd)">
            <el-button link type="primary">
              状态 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="normal">正常</el-dropdown-item>
                <el-dropdown-item command="blocked">封禁</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <!-- 笔记详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="笔记详情"
      width="800px"
    >
      <div v-if="currentNote" class="note-detail">
        <div class="author-info">
          <h4>作者信息</h4>
          <div class="author-profile">
            <el-avatar 
              :size="60" 
              :src="currentNote.userId?.avatar || '/default-avatar.png'"
            />
            <div class="author-text">
              <p class="username">{{ currentNote.userId?.username }}</p>
              <p class="create-time">创建时间：{{ new Date(currentNote.createTime).toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <div class="note-content">
          <h4>笔记内容</h4>
          <h5 class="note-title">{{ currentNote.title }}</h5>
          
          <div class="note-category">
            <el-tag 
              :type="getCategoryType(currentNote.category)"
              size="small"
            >
              {{ getCategoryText(currentNote.category) }}
            </el-tag>
          </div>
          
          <div v-if="currentNote.images && currentNote.images.length" class="note-images">
            <el-image
              v-for="(image, index) in currentNote.images"
              :key="index"
              :src="getImageUrl(image)"
              fit="cover"
              :preview-src-list="currentNote.images.map(img => getImageUrl(img))"
              :initial-index="index"
              class="note-image"
              :preview-teleported="true"
            />
          </div>

          <p class="note-text">{{ currentNote.content }}</p>
        </div>

        <div class="note-stats">
          <h4>笔记数据</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <el-icon><Star /></el-icon>
              <span class="stat-label">收藏数</span>
              <span class="stat-value">{{ currentNote.collectionsCount || 0 }}</span>
            </div>
            <div class="stat-item">
              <el-icon><Pointer /></el-icon>
              <span class="stat-label">点赞数</span>
              <span class="stat-value">{{ currentNote.likesCount || 0 }}</span>
            </div>
            <div class="stat-item">
              <el-icon><ChatDotRound /></el-icon>
              <span class="stat-label">评论数</span>
              <span class="stat-value">{{ currentNote.comments?.length || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, 
  ArrowDown, 
  Star, 
  Pointer, 
  ChatDotRound 
} from '@element-plus/icons-vue'
import { postApi } from '../../api/posts'
import { useRouter } from 'vue-router'

const loading = ref(false)
const notes = ref([])
const dialogVisible = ref(false)
const currentNote = ref(null)
const searchQuery = ref('')
const router = useRouter()

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    normal: 'success',
    blocked: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    normal: '正常',
    blocked: '封禁'
  }
  return texts[status] || status
}

// 获取笔记列表
const fetchNotes = async () => {
  loading.value = true
  try {
    const res = await postApi.getAllPosts(searchQuery.value)
    if (res.data.success) {
      notes.value = res.data.posts
    } else {
      throw new Error(res.data.message)
    }
  } catch (error) {
    console.error('获取笔记列表失败:', error)
    ElMessage.error('获取笔记列表失败')
  } finally {
    loading.value = false
  }
}

// 查看笔记详情
const handleView = (note) => {
  currentNote.value = note
  dialogVisible.value = true
}

// 删除笔记
const handleDelete = async (note) => {
  try {
    await ElMessageBox.confirm('确定要删除该笔记吗？', '提示', {
      type: 'warning'
    })
    const res = await postApi.deletePost(note._id)
    if (res.data.success) {
      ElMessage.success('删除成功')
      await fetchNotes()
    } else {
      throw new Error(res.data.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 更新笔记状态
const handleStatus = async (note, status) => {
  try {
    const res = await postApi.updatePostStatus(note._id, status)
    if (res.data.success) {
      ElMessage.success('状态更新成功')
      await fetchNotes()
    } else {
      throw new Error(res.data.message)
    }
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
  }
}

// 防抖函数
const debounce = (fn, delay) => {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

// 搜索处理
const handleSearch = async () => {
  try {
    loading.value = true;
    const res = await postApi.getAllPosts(searchQuery.value);
    if (res.data.success) {
      notes.value = res.data.posts;
    } else {
      throw new Error(res.data.message);
    }
  } catch (error) {
    console.error('搜索失败:', error);
    ElMessage.error('搜索失败');
  } finally {
    loading.value = false;
  }
};

// 使用防抖的搜索函数
const debounceSearch = debounce(handleSearch, 300);

// 获取图片完整URL
const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const cleanUrl = url.startsWith('/api') ? url.substring(4) : url;
  return url.replace('/api/api', '/api');
};

// 获取分类标签类型
const getCategoryType = (category) => {
  const typeMap = {
    books: 'success',
    food: 'warning',
    travel: 'primary',
    fashion: 'danger',
    home: 'info',
    other: ''
  };
  return typeMap[category] || '';
};

// 获取分类文本
const getCategoryText = (category) => {
  const categoryMap = {
    books: '书籍',
    food: '美食',
    travel: '旅行',
    fashion: '时尚',
    home: '家居',
    other: '其他'
  };
  return categoryMap[category] || category;
};

onMounted(() => {
  fetchNotes()
})
</script>

<style scoped>
.note-management {
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

.title-text {
  margin: 0 0 4px;
  font-weight: bold;
  color: #333;
}

.content-text {
  margin: 0;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.note-detail {
  padding: 24px;
}

.author-info,
.note-content {
  margin-bottom: 20px;
}

h4 {
  margin: 0 0 10px;
  font-size: 16px;
  color: #333;
}

p {
  margin: 5px 0;
  color: #666;
}

.author-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-name {
  font-size: 14px;
  color: #333;
}

.author-profile {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 12px 0;
}

.author-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.username {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.create-time {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.note-title {
  font-size: 18px;
  color: #333;
  margin: 0 0 12px;
}

.note-text {
  font-size: 14px;
  line-height: 1.6;
  color: #666;
  margin: 0;
  white-space: pre-wrap;
}

.note-stats {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item .el-icon {
  font-size: 24px;
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.note-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin: 16px 0;
}

.note-image {
  width: 100%;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
  object-fit: cover;
}

.note-image:hover {
  transform: scale(1.02);
}

.note-cover,
.cover-image {
  display: none;
}

.note-category {
  margin: 12px 0 16px;
}

/* 优化图片预览样式 */
:deep(.el-image-viewer__wrapper) {
  .el-image-viewer__img {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
  }
}

/* 调整对话框最大高度，添加滚动 */
:deep(.el-dialog__body) {
  max-height: 80vh;
  overflow-y: auto;
}

/* 优化滚动条样式 */
:deep(.el-dialog__body)::-webkit-scrollbar {
  width: 6px;
}

:deep(.el-dialog__body)::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

:deep(.el-dialog__body)::-webkit-scrollbar-track {
  background: #f5f5f5;
}
</style> 