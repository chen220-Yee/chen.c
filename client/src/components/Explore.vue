<template>
    <div class="explore">
      <!-- 添加搜索结果提示 -->
      <div v-if="$route.query.search" class="search-result-tip">
        <span>搜索"{{ $route.query.search }}"的结果 (共 {{ total }} 条)</span>
        <el-button link type="primary" @click="clearSearch">
          清除搜索
        </el-button>
      </div>
  
      <!-- 顶部分类菜单 -->
      <div class="category-menu">
        <el-menu :default-active="activeCategory" mode="horizontal" @select="handleCategoryChange">
          <el-menu-item v-for="item in categories" :key="item.id" :index="item.id">
            {{ item.name }}
          </el-menu-item>
        </el-menu>
      </div>
  
      <!-- 修改瀑布流内容区为网格布局 -->
      <div 
        class="notes-grid" 
        v-infinite-scroll="loadMore"
        :infinite-scroll-disabled="loading || noMore"
        :infinite-scroll-distance="10"
        v-loading="loading" 
        element-loading-text="加载中..."
      >
        <el-empty v-if="posts.length === 0" description="暂无内容" />
        <el-card 
          v-for="post in posts" 
          :key="post._id" 
          class="note-card"
          @click="openPostDetail(post)"
        >
          <!-- 只显示正常状态的帖子 -->
          <template v-if="post.status === 'normal'">
            <!-- 封面图 -->
            <img 
              :src="post.coverUrl" 
              class="note-image"
              @error="handleImageError"
            >
            
            <!-- 内容区域 -->
            <div class="note-content">
              <h3>{{ post.title }}</h3>
              <p>{{ post.content }}</p>
              
              <!-- 底部信息 -->
              <div class="note-footer">
                <div class="user-info">
                  <el-avatar 
                    :src="post.userId?.avatar || '/default-avatar.png'" 
                    :size="24"
                  >
                    <el-icon><User /></el-icon>
                  </el-avatar>
                  <span class="username">{{ post.userId?.username }}</span>
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
                </div>
              </div>
            </div>
          </template>
        </el-card>

        <!-- 底部状态提示 -->
        <div class="load-more" v-if="posts.length > 0">
          <p v-if="noMore">没有更多内容了</p>
          <p v-else-if="loading">加载中...</p>
        </div>
      </div>
  
      <!-- 帖子详情弹窗 -->
      <el-dialog
        v-model="dialogVisible"
        width="80%"
        :show-close="true"
        :close-on-click-modal="false"
        destroy-on-close
        class="post-dialog"
        @close="handleDialogClose"
      >
        <div class="post-detail" v-if="currentPost">
          <!-- 左侧媒体区 -->
          <div class="media-section">
            <el-carousel 
              v-if="currentPost?.images?.length" 
              height="500px"
              :autoplay="false"
              indicator-position="outside"
            >
              <el-carousel-item v-for="img in currentPost.images" :key="img">
                <el-image 
                  :src="img" 
                  fit="contain"
                  @error="handleImageError"
                  @load="imageLoading = false"
                  v-loading="imageLoading"
                />
              </el-carousel-item>
            </el-carousel>
            <div v-else class="no-media">
              <el-icon :size="48"><Picture /></el-icon>
              <p>暂无图片</p>
            </div>
          </div>

          <!-- 右侧内容区 -->
          <div class="content-section">
            <!-- 用户信息 -->
            <div class="user-profile">
              <el-avatar 
                :src="currentPost.userId?.avatar || '/default-avatar.png'" 
                :size="40"
              >
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="user-info">
                <div class="username">{{ currentPost.userId?.username || '未知用户' }}</div>
                <div class="post-time">{{ formatTime(currentPost.createTime) }}</div>
              </div>
            </div>

            <!-- 帖子内容 -->
            <div class="post-content">
              <h2 class="detail-title">{{ currentPost?.title }}</h2>
              <p class="post-text">{{ currentPost?.content }}</p>
            </div>

            <!-- 互动区域 -->
            <div class="interaction-area">
              <!-- 点赞按钮 -->
              <el-button 
                type="danger"
                :class="{ 'is-liked': isLiked }"
                @click="handleLike"
              >
                <el-icon><Pointer /></el-icon>
                <span>{{ isLiked ? '已点赞' : '点赞' }}</span>
              </el-button>
              <span class="like-count">{{ currentPost?.likesCount || 0 }}</span>

              <!-- 收藏按钮 -->
              <el-button 
                type="danger"
                :class="{ 'is-collected': isCollected }"
                @click="handleCollect"
              >
                <el-icon><Star /></el-icon>
                <span>{{ isCollected ? '已收藏' : '收藏' }}</span>
              </el-button>
              <span class="collect-count">{{ currentPost?.collectionsCount || 0 }}</span>
            </div>

            <!-- 评论区 -->
            <div class="comments-section" v-loading="commentsLoading">
              <div v-if="currentPost?.comments?.length" class="comments-list">
                <div 
                  v-for="comment in currentPost.comments" 
                  :key="comment._id" 
                  class="comment-item"
                >
                  <el-avatar 
                    :src="comment.user?.avatar || '/default-avatar.png'" 
                    :size="32"
                  >
                    <el-icon><User /></el-icon>
                  </el-avatar>
                  <div class="comment-content">
                    <div class="comment-user">{{ comment.user?.username || '未知用户' }}</div>
                    <div class="comment-text">{{ comment.content }}</div>
                    <div class="comment-time">{{ formatTime(comment.createTime) }}</div>
                  </div>
                </div>
              </div>
              <el-empty 
                v-else 
                description="暂无评论" 
                :image-size="100"
              />
            </div>

            <!-- 评论输入框 -->
            <div class="comment-input">
              <el-input
                v-model="commentText"
                type="textarea"
                :rows="2"
                placeholder="写下你的评论..."
                :maxlength="200"
                show-word-limit
                resize="none"
              />
              <el-button 
                type="primary" 
                :loading="commenting"
                @click="handleComment"
                :disabled="!commentText.trim()"
              >
                发表评论
              </el-button>
            </div>
          </div>
        </div>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch, defineExpose } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Star, ChatDotRound, User, Picture, Pointer, Collection } from '@element-plus/icons-vue'
  import { postApi } from '../api/posts'
  import { handleError } from '../utils/error'
  import { categories } from '../constants/categories'
  import { formatNumber, formatTime } from '../utils/format'
  import { useRoute, useRouter } from 'vue-router'

  const route = useRoute()
  const router = useRouter()

  const emit = defineEmits(['search-complete'])

  // 响应式数据
  const activeCategory = ref('recommend')
  const posts = ref([])
  const loading = ref(false)
  const dialogVisible = ref(false)
  const currentPost = ref(null)
  const commentText = ref('')
  const commenting = ref(false)
  const commentsLoading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(12)
  const total = ref(0)
  const imageLoading = ref(true)
  const noMore = ref(false)
  const isCollected = ref(false)
  const isLiked = ref(false)
  
  // 获取帖子列表
  const fetchPosts = async (category) => {
    loading.value = true
    try {
      const searchKeyword = route.query.search
      let res

      console.log('开始获取帖子:', {
        searchKeyword,
        category,
        page: currentPage.value,
        limit: pageSize.value
      });

      if (searchKeyword) {
        // 如果有搜索关键词，调用搜索接口
        res = await postApi.searchPosts(
          searchKeyword,
          currentPage.value,
          pageSize.value
        )
      } else {
        // 否则获取常规帖子列表
        res = await postApi.getPosts(
          category,
          currentPage.value,
          pageSize.value
        )
      }

      console.log('获取帖子响应:', res.data);

      if (currentPage.value === 1) {
        posts.value = res.data.posts.filter(post => post.status === 'normal')
      } else {
        posts.value = [...posts.value, ...res.data.posts.filter(post => post.status === 'normal')]
      }
      
      total.value = res.data.total
      noMore.value = posts.value.length >= total.value

      console.log('处理后的帖子列表:', {
        postsCount: posts.value.length,
        total: total.value,
        noMore: noMore.value
      });

    } catch (error) {
      console.error('获取帖子失败:', error)
      ElMessage.error('获取内容失败')
    } finally {
      loading.value = false
    }
  }
  
  // 处理分类切换
  const handleCategoryChange = (category) => {
    console.log('切换分类:', category)
    activeCategory.value = category
    currentPage.value = 1
    posts.value = []
    noMore.value = false
    fetchPosts(category)
  }
  
  // 打开帖子详情
  const openPostDetail = async (post) => {
    try {
      console.log('打开帖子详情:', post)
      
      // 先设置基本信息，避免undefined错误
      currentPost.value = {
        ...post,
        userId: {
          _id: post.userId?._id || '',
          username: post.userId?.username || '未知用户',
          avatar: post.userId?.avatar || '/default-avatar.png'
        },
        comments: []
      }
      
      dialogVisible.value = true

      // 并行获取所有需要的数据
      const [detailRes, collectRes, likeRes, commentsRes] = await Promise.all([
        postApi.getPostDetail(post._id),
        postApi.checkCollectionStatus(post._id),
        postApi.checkLikeStatus(post._id),
        postApi.getPostComments(post._id)
      ])

      console.log('获取到的数据:', {
        detail: detailRes.data,
        collect: collectRes.data,
        like: likeRes.data,
        comments: commentsRes.data
      })

      // 先检查详情数据
      if (!detailRes.data.success || !detailRes.data.post) {
        throw new Error(detailRes.data.message || '获取帖子详情失败')
      }

      // 更新帖子详细信息
      currentPost.value = {
        ...detailRes.data.post,
        userId: {
          _id: detailRes.data.post.userId?._id || '',
          username: detailRes.data.post.userId?.username || '未知用户',
          avatar: detailRes.data.post.userId?.avatar || '/default-avatar.png'
        }
      }
      
      // 设置交互状态
      isCollected.value = collectRes.data.isCollected
      isLiked.value = likeRes.data.isLiked
      
      // 设置评论
      if (commentsRes.data.success) {
        currentPost.value.comments = commentsRes.data.comments || []
      }

    } catch (error) {
      console.error('获取帖子详情失败:', error)
      ElMessage.error(error.message || '获取帖子详情失败')
      dialogVisible.value = false
    }
  }
  
  // 处理评论
  const handleComment = async () => {
    if (!commentText.value.trim()) return
    
    commenting.value = true
    try {
      console.log('发送评论:', {
        postId: currentPost.value._id,
        content: commentText.value
      })

      const res = await postApi.commentPost(currentPost.value._id, commentText.value)
      
      if (res.data.success) {
        // 确保 comments 数组存在
        if (!currentPost.value.comments) {
          currentPost.value.comments = []
        }

        // 添加新评论到列表
        const newComment = {
          _id: res.data.comment.id,
          content: res.data.comment.content,
          createTime: res.data.comment.createTime,
          user: res.data.comment.user
        }
        
        currentPost.value.comments = [...currentPost.value.comments, newComment]
        
        // 清空评论框
        commentText.value = ''
        ElMessage.success('评论成功')
      }
    } catch (error) {
      console.error('评论失败:', error)
      ElMessage.error('评论失败')
    } finally {
      commenting.value = false
    }
  }
  
  // 聚焦评论框
  const focusComment = () => {
    const textarea = document.querySelector('.comment-input textarea')
    if (textarea) {
      textarea.focus()
      // 滚动到评论区
      const commentsSection = document.querySelector('.comments-section')
      if (commentsSection) {
        commentsSection.scrollTop = commentsSection.scrollHeight
      }
    }
  }
  
  // 修改分页处理函数
  const handlePageChange = (page) => {
    currentPage.value = page
    fetchPosts(activeCategory.value)
  }
  
  // 修改每页条数变化处理
  const handleSizeChange = (size) => {
    pageSize.value = size
    currentPage.value = 1 // 重置到第一页
    fetchPosts(activeCategory.value)
  }
  
  // 初始化
  onMounted(() => {
    fetchPosts('recommend')
  })
  
  // 图片错误处理函数
  const handleImageError = (e) => {
    e.target.src = '/images/default-post-cover.svg'
  }
  
  // 添加关闭帖子详情的处理函数
  const handleDialogClose = () => {
    currentPost.value = null
    commentText.value = ''
    isCollected.value = false
    isLiked.value = false
  }
  
  // 修改加载数据的方法
  const loadPosts = async () => {
    if (loading.value || noMore.value) return
    
    loading.value = true
    try {
      const res = await postApi.getPosts(
        activeCategory.value, 
        currentPage.value, 
        pageSize.value
      )
      
      if (currentPage.value === 1) {
        posts.value = res.data.posts.filter(post => post.status === 'normal')
      } else {
        posts.value = [...posts.value, ...res.data.posts.filter(post => post.status === 'normal')]
      }
      
      total.value = res.data.pagination.total
      noMore.value = posts.value.length >= total.value
    } catch (error) {
      handleError(error, '获取帖子列表失败')
    } finally {
      loading.value = false
    }
  }
  
  // 添加加载更多方法
  const loadMore = async () => {
    if (loading.value || noMore.value) return
    currentPage.value++
    await fetchPosts(activeCategory.value)
  }
  
  // 处理收藏
  const handleCollect = async () => {
    try {
      if (isCollected.value) {
        const res = await postApi.uncollectPost(currentPost.value._id)
        if (res.data.success) {
          isCollected.value = false
          updatePostStats(currentPost.value._id, 'collect', res.data.collectionsCount)
          ElMessage.success('已取消收藏')
        }
      } else {
        const res = await postApi.collectPost(currentPost.value._id)
        if (res.data.success) {
          isCollected.value = true
          updatePostStats(currentPost.value._id, 'collect', res.data.collectionsCount)
          ElMessage.success('收藏成功')
        }
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
      ElMessage.error('操作失败')
    }
  }

  // 处理点赞
  const handleLike = async () => {
    try {
      if (isLiked.value) {
        const res = await postApi.unlikePost(currentPost.value._id)
        if (res.data.success) {
          isLiked.value = false
          updatePostStats(currentPost.value._id, 'like', res.data.likesCount)
          ElMessage.success('已取消点赞')
        }
      } else {
        const res = await postApi.likePost(currentPost.value._id)
        if (res.data.success) {
          isLiked.value = true
          updatePostStats(currentPost.value._id, 'like', res.data.likesCount)
          ElMessage.success('点赞成功')
        }
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
      ElMessage.error('操作失败')
    }
  }

  // 获取帖子评论
  const fetchComments = async (postId) => {
    commentsLoading.value = true
    try {
      const res = await postApi.getPostComments(postId)
      if (res.data.success) {
        currentPost.value.comments = res.data.comments
      }
    } catch (error) {
      console.error('获取评论失败:', error)
      ElMessage.error('获取评论失败')
    } finally {
      commentsLoading.value = false
    }
  }

  // 处理点赞和收藏后的更新
  const updatePostStats = (postId, type, count) => {
    // 更新列表中的帖子数据
    const post = posts.value.find(p => p._id === postId)
    if (post) {
      if (type === 'like') {
        post.likesCount = count
      } else if (type === 'collect') {
        post.collectionsCount = count
      }
    }

    // 更新当前显示的帖子数据
    if (currentPost.value && currentPost.value._id === postId) {
      if (type === 'like') {
        currentPost.value.likesCount = count
      } else if (type === 'collect') {
        currentPost.value.collectionsCount = count
      }
    }
  }

  // 处理搜索的方法
  const handleSearch = async (keyword) => {
    try {
      console.log('Explore组件执行搜索:', keyword);
      loading.value = true;
      currentPage.value = 1;
      posts.value = [];
      noMore.value = false;
      
      const res = await postApi.searchPosts(keyword, 1, pageSize.value);
      console.log('搜索结果:', res.data);
      
      if (res.data.success) {
        posts.value = res.data.posts;
        total.value = res.data.total;
        noMore.value = posts.value.length >= total.value;
        emit('search-complete', true);
      } else {
        emit('search-complete', false);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      ElMessage.error('搜索失败');
      emit('search-complete', false);
    } finally {
      loading.value = false;
    }
  };

  // 监听路由参数变化
  watch(
    () => route.query.search,
    (newKeyword) => {
      console.log('搜索关键词变化:', newKeyword);
      if (newKeyword) {
        handleSearch(newKeyword);
      } else {
        // 如果搜索参数被清除，恢复默认列表
        currentPage.value = 1;
        posts.value = [];
        noMore.value = false;
        fetchPosts(activeCategory.value);
      }
    },
    { immediate: true }
  );

  // 清除搜索
  const clearSearch = () => {
    router.replace({ query: {} });
  };

  // 暴露方法给父组件
  defineExpose({
    handleSearch
  });
  </script>
  
  <style scoped>
  /* 基础布局 */
  .explore {
    min-height: 100vh;
    background: #f5f5f5;
  }
  
  /* 分类菜单 */
  .category-menu {
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 20px;
  }
  
  /* 替换瀑布流样式为网格布局样式 */
  .notes-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin: 20px 0;
  }

  .note-card {
    transition: transform 0.3s;
  }

  .note-card:hover {
    transform: translateY(-5px);
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
    line-height: 1.4;
  }

  .note-content p {
    margin: 0;
    font-size: 14px;
    color: #666;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
  }

  .note-footer {
    margin-top: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #999;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .interaction-info {
    display: flex;
    gap: 12px;
  }

  .likes, .collections {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* 添加响应式布局 */
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
  
  /* 帖子详情弹窗样式 */
  .post-dialog :deep(.el-dialog__body) {
    padding: 0;
  }
  
  .post-detail {
    display: flex;
    height: 80vh;
  }
  
  .media-section {
    flex: 3;
    background: #f5f5f5;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .media-section :deep(.el-carousel) {
    width: 100%;
    height: 100%;
  }
  
  .media-section :deep(.el-carousel__container) {
    height: 100%;
  }
  
  .media-section :deep(.el-image) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .media-section :deep(.el-image__inner) {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    margin: auto;
  }
  
  .content-section {
    flex: 2;
    padding: 24px;
    display: flex;
    flex-direction: column;
  }
  
  .user-profile {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }
  
  .post-content {
    margin: 20px 0;
    font-size: 14px;
    line-height: 1.6;
    flex: 1;
    overflow-y: auto;
  }
  
  .interaction-area {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #eee;
  }
  
  .like-count,
  .collect-count {
    margin-right: 16px;
    font-size: 14px;
    color: #666;
  }
  
  .is-liked,
  .is-collected {
    background-color: #F56C6C !important;
    border-color: #F56C6C !important;
    color: white !important;
  }
  
  .comments-section {
    flex: 1;
    overflow-y: auto;
    padding: 16px 0;
    scrollbar-width: thin;
    scrollbar-color: #ddd transparent;
  }
  
  .comments-section::-webkit-scrollbar {
    width: 6px;
  }
  
  .comments-section::-webkit-scrollbar-thumb {
    background-color: #ddd;
    border-radius: 3px;
  }
  
  .comments-section::-webkit-scrollbar-track {
    background-color: transparent;
  }
  
  .comment-item {
    animation: fadeIn 0.3s ease;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .comment-input {
    margin-top: auto;
    padding-top: 16px;
  }
  
  @media screen and (max-width: 1200px) {
    .waterfall {
      column-count: 3;
    }
  }
  
  @media screen and (max-width: 768px) {
    .waterfall {
      column-count: 2;
      padding: 0 20px;
    }
    
    .post-dialog :deep(.el-dialog) {
      width: 95% !important;
      margin: 10px auto !important;
    }
    
    .post-detail {
      flex-direction: column;
      height: auto;
    }
    
    .media-section {
      height: 300px;
    }
  }
  
  .no-media {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #999;
    background: #f5f5f5;
  }
  
  .post-text {
    font-size: 14px;
    line-height: 1.8;
    color: #666;
    white-space: pre-wrap;
  }
  
  .post-time {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }
  
  .like-count,
  .comment-count {
    margin: 0 16px 0 8px;
    font-size: 14px;
    color: #666;
  }
  
  .comments-list {
    margin-bottom: 16px;
  }
  
  .comment-content {
    flex: 1;
  }
  
  .comment-user {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
  }
  
  .comment-text {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
  }
  
  .comment-time {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }
  
  .comment-input {
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
  
  .comment-input :deep(.el-button) {
    margin-top: 12px;
    width: 100%;
  }
  
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    padding-bottom: 40px;
  }
  
  .detail-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }
  
  .image-error {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: #f5f5f5;
    color: #999;
  }
  
  .image-error .el-icon {
    font-size: 24px;
  }
  
  .comment-input :deep(.el-input__wrapper) {
    box-shadow: none;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
  }
  
  .comment-input :deep(.el-input__wrapper:hover) {
    border-color: #c0c4cc;
  }
  
  .comment-input :deep(.el-input__wrapper.is-focus) {
    border-color: #409eff;
  }
  
  /* 优化图片加载状态样式 */
  .media-section :deep(.el-loading-mask) {
    background-color: rgba(0, 0, 0, 0.3);
  }
  
  /* 优化评论输入框样式 */
  .comment-input :deep(.el-textarea__inner) {
    min-height: 80px !important;
    resize: none;
    transition: all 0.3s ease;
  }
  
  .comment-input :deep(.el-textarea__inner:focus) {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  }
  
  /* 优化分页组件样式 */
  .pagination-container :deep(.el-pagination) {
    justify-content: center;
    padding: 20px 0;
  }
  
  /* 优化弹窗样式 */
  .post-dialog :deep(.el-dialog) {
    border-radius: 12px;
    overflow: hidden;
  }
  
  .post-dialog :deep(.el-dialog__header) {
    display: none;
  }
  
  /* 优化轮播图样式 */
  .media-section :deep(.el-carousel__indicators) {
    bottom: -30px;
  }
  
  .media-section :deep(.el-carousel__indicator) {
    padding: 12px 4px;
  }
  
  .media-section :deep(.el-carousel__button) {
    width: 30px;
    height: 3px;
    border-radius: 3px;
  }
  
  /* 分类菜单样式 */
  .category-menu :deep(.el-menu) {
    border: none;
    justify-content: center;
  }
  
  .category-menu :deep(.el-menu-item) {
    font-size: 16px;
    padding: 0 24px;
  }
  
  .category-menu :deep(.el-menu-item.is-active) {
    font-weight: bold;
  }

  @media screen and (max-width: 768px) {
    .category-menu :deep(.el-menu-item) {
      font-size: 14px;
      padding: 0 16px;
    }

    .post-detail {
      flex-direction: column;
      height: auto;
      max-height: 90vh;
    }

    .media-section {
      height: 300px;
    }

    .content-section {
      padding: 16px;
      max-height: calc(90vh - 300px);
      overflow-y: auto;
    }
  }

  @media screen and (max-width: 576px) {
    .category-menu :deep(.el-menu-item) {
      padding: 0 12px;
    }

    .waterfall {
      padding: 0 10px;
    }

    .post-card {
      margin-bottom: 10px;
    }
  }
  
  /* 添加加载更多提示样式 */
  .load-more {
    grid-column: 1 / -1;
    text-align: center;
    padding: 16px;
    color: #909399;
  }
  
  /* 修改收藏按钮样式 */
  .is-collected {
    background-color: #F56C6C !important;
    border-color: #F56C6C !important;
    color: white !important;
  }
  
  .collect-count {
    margin: 0 16px 0 8px;
    font-size: 14px;
    color: #666;
  }
  
  /* 添加搜索结果提示样式 */
  .search-result-tip {
    padding: 12px 20px;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #666;
  }
  </style> 