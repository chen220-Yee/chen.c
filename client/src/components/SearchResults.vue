<template>
  <div class="search-results">
    <!-- 搜索结果提示 -->
    <div class="search-header">
      <div class="search-info">
        <h2>搜索结果</h2>
        <p>共找到 {{ total }} 条与"{{ keyword }}"相关的内容</p>
      </div>
      <el-button @click="backToExplore">返回发现页</el-button>
    </div>

    <!-- 结果分类统计 -->
    <div class="result-stats" v-if="total > 0">
      <el-tag 
        v-for="(count, type) in matchTypeCounts" 
        :key="type"
        :type="getTagType(type)"
      >
        {{ getMatchTypeLabel(type) }}: {{ count }}
      </el-tag>
    </div>

    <!-- 瀑布流展示搜索结果 -->
    <div 
      class="waterfall" 
      v-infinite-scroll="loadMore"
      :infinite-scroll-disabled="loading || noMore"
      :infinite-scroll-distance="10"
      v-loading="loading"
    >
      <div 
        v-for="post in posts" 
        :key="post._id" 
        class="post-card"
        @click="openPostDetail(post)"
      >
        <!-- 匹配类型标记 -->
        <div class="match-type-tag" :class="post.matchType">
          {{ getMatchTypeLabel(post.matchType) }}
        </div>

        <!-- 封面图 -->
        <div class="post-cover">
          <el-image 
            :src="post.coverUrl" 
            fit="cover"
            lazy
          />
        </div>
        
        <!-- 标题和内容 -->
        <div class="post-content">
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-excerpt">{{ post.content }}</p>
        </div>
        
        <!-- 底部信息 -->
        <div class="post-footer">
          <div class="user-info">
            <el-avatar :src="post.user.avatar" :size="24" />
            <span>{{ post.user.username }}</span>
          </div>
          <div class="post-stats">
            <span>
              <el-icon><Star /></el-icon>
              {{ formatNumber(post.likesCount) }}
            </span>
            <span>
              <el-icon><Collection /></el-icon>
              {{ formatNumber(post.collectionsCount) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 加载状态和空状态 -->
      <div class="load-more" v-if="posts.length > 0">
        <p v-if="noMore">没有更多内容了</p>
        <p v-else-if="loading">加载中...</p>
      </div>
      <el-empty 
        v-if="!loading && posts.length === 0" 
        description="未找到相关内容"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, Collection } from '@element-plus/icons-vue'
import { postApi } from '../api/posts'
import { formatNumber } from '../utils/format'

const route = useRoute()
const router = useRouter()

const keyword = computed(() => route.query.search || '')
const posts = ref([])
const total = ref(0)
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(12)
const noMore = ref(false)

// 计算匹配类型统计
const matchTypeCounts = computed(() => {
  return posts.value.reduce((acc, post) => {
    acc[post.matchType] = (acc[post.matchType] || 0) + 1
    return acc
  }, {})
})

// 获取匹配类型标签
const getMatchTypeLabel = (type) => {
  const labels = {
    title: '标题匹配',
    category: '分类匹配'
  }
  return labels[type] || type
}

// 获取标签类型
const getTagType = (type) => {
  const types = {
    title: 'success',
    category: 'warning'
  }
  return types[type] || ''
}

// 加载搜索结果
const fetchSearchResults = async () => {
  if (!keyword.value) {
    console.log('没有搜索关键词，退出搜索');
    return;
  }
  
  loading.value = true;
  try {
    console.log('开始搜索:', {
      keyword: keyword.value,
      page: currentPage.value,
      limit: pageSize.value
    });

    const res = await postApi.searchPosts(
      keyword.value,
      currentPage.value,
      pageSize.value
    );
    
    console.log('搜索响应:', res.data);
    
    if (res.data.success) {
      if (currentPage.value === 1) {
        posts.value = res.data.posts || [];
      } else {
        posts.value = [...posts.value, ...(res.data.posts || [])];
      }
      total.value = res.data.total || 0;
      noMore.value = posts.value.length >= total.value;

      console.log('搜索结果:', {
        keyword: keyword.value,
        total: total.value,
        found: posts.value.length,
        samples: posts.value.slice(0, 2).map(p => ({
          title: p.title,
          category: p.category,
          matchType: p.matchType
        }))
      });
    }
    } catch (error) {
      console.error('搜索失败:', error);
      ElMessage.error('获取搜索结果失败');
    } finally {
      loading.value = false;
    }
};

// 加载更多
const loadMore = () => {
  if (loading.value || noMore.value) return
  currentPage.value++
  fetchSearchResults()
}

// 返回发现页
const backToExplore = () => {
  router.push('/explore')
}

// 打开帖子详情
const openPostDetail = (post) => {
  // 实现帖子详情查看逻辑
}

// 监听搜索关键词变化
watch(
  () => route.query.search,
  (newKeyword) => {
    if (newKeyword) {
      currentPage.value = 1
      posts.value = []
      noMore.value = false
      fetchSearchResults()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.search-results {
  padding: 20px;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-info h2 {
  margin: 0;
  font-size: 24px;
}

.search-info p {
  margin: 8px 0 0;
  color: #666;
}

.result-stats {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
}

.waterfall {
  column-count: 4;
  column-gap: 20px;
}

.post-card {
  break-inside: avoid;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  transition: transform 0.3s;
  cursor: pointer;
}

.post-card:hover {
  transform: translateY(-4px);
}

.match-type-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  z-index: 1;
}

.match-type-tag.title {
  background-color: #67c23a;
}

.match-type-tag.category {
  background-color: #e6a23c;
}

.match-type-tag.content {
  background-color: #909399;
}

/* 其他样式保持与 Explore.vue 一致 */
</style> 