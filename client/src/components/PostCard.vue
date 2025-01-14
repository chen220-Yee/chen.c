<template>
  <el-card class="post-card">
    <!-- ... 其他帖子内容 ... -->
    <div class="post-actions">
      <el-button 
        :type="isCollected ? 'danger' : 'default'"
        link
        @click="handleCollect"
      >
        <el-icon><Star /></el-icon>
        {{ isCollected ? '取消收藏' : '收藏' }}
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import { postApi } from '../api/posts'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

const isCollected = ref(props.post.isCollected || false)

const handleCollect = async () => {
  try {
    if (isCollected.value) {
      const res = await postApi.uncollectPost(props.post._id);
      if (res.data.success) {
        ElMessage.success('取消收藏成功');
        isCollected.value = false;
      }
    } else {
      const res = await postApi.collectPost(props.post._id);
      if (res.data.success) {
        ElMessage.success('收藏成功');
        isCollected.value = true;
      }
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    ElMessage.error(error.response?.data?.message || '操作失败');
  }
}
</script> 