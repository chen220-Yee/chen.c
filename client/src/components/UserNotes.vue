<template>
  <div class="user-notes-container">
    <h2>我的笔记</h2>
    <div class="notes-grid">
      <el-empty v-if="notes.length === 0" description="暂无笔记" />
      <el-card 
        v-for="note in notes" 
        :key="note._id" 
        class="note-card"
      >
        <img :src="note.coverImage" class="note-image">
        <div class="note-content">
          <h3>{{ note.title }}</h3>
          <p>{{ note.description }}</p>
          <div class="note-footer">
            <span>{{ note.createdAt }}</span>
            <div class="note-actions">
              <el-button 
                type="primary" 
                link 
                @click="handleEdit(note)"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button 
                type="danger" 
                link 
                @click="handleDelete(note)"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 编辑笔记对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑笔记"
      width="50%"
    >
      <el-form 
        ref="editFormRef"
        :model="editForm"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="editForm.title" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="editForm.category">
            <el-option
              v-for="item in categories"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="editForm.content"
            type="textarea"
            :rows="6"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <!-- 添加图片上传 -->
        <el-form-item label="图片">
          <el-upload
            v-model:file-list="fileList"
            action="#"
            list-type="picture-card"
            :http-request="handleUpload"
            :before-upload="beforeUpload"
            :on-remove="handleRemove"
            :on-preview="handlePreview"
            :limit="9"
            :file-list="fileList"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="upload-tip">
                支持jpg、png、gif格式，单张不超过5MB，最多9张
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <el-pagination
      v-if="total > 0"
      v-model:current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, Plus } from '@element-plus/icons-vue'
import { postApi } from '../api/posts'
import request from '../api/config'
import { handleError } from '../utils/error'
import { useRouter } from 'vue-router'

const router = useRouter()
const notes = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = ref({
  id: '',
  title: '',
  category: '',
  content: '',
  images: []
})

// 分类选项
const categories = [
  { value: 'books', label: '书籍' },
  { value: 'food', label: '美食' },
  { value: 'home', label: '家居' },
  { value: 'fashion', label: '穿搭' },
  { value: 'travel', label: '旅行' },
  { value: 'other', label: '其他' }
]

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 30, message: '标题长度在2-30个字符之间', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 10, max: 1000, message: '内容长度在10-1000个字符之间', trigger: 'blur' }
  ]
}

const fetchNotes = async () => {
  try {
    const res = await postApi.getUserPosts(currentPage.value, pageSize.value)
    if (res.data && Array.isArray(res.data.posts)) {
      notes.value = res.data.posts.map(post => ({
        _id: post.id || post._id,
        title: post.title,
        description: post.content,
        content: post.content,
        category: post.category,
        coverImage: post.coverUrl,
        images: post.images || [],
        createdAt: new Date(post.createTime).toLocaleDateString(),
        likes: post.likes || 0,
        collections: post.collections || 0,
        comments: post.comments || 0
      }))
      console.log('获取到的笔记数据:', notes.value)
      total.value = res.data.pagination?.total || res.data.total || 0
    }
  } catch (error) {
    handleError(error, '获取笔记失败')
  }
}

// 处理编辑
const handleEdit = (note) => {
  console.log('编辑的笔记数据:', note)
  
  editForm.value = {
    id: note._id,
    title: note.title,
    category: note.category,
    content: note.content,
    images: note.images || []
  }
  
  // 设置已有的图片到文件列表
  fileList.value = (note.images || []).map(url => ({
    name: url.split('/').pop(),
    url: url,
    status: 'success',
    uid: Math.random().toString(),
    response: { url }
  }))
  
  editDialogVisible.value = true
}

// 提交编辑
const submitEdit = async () => {
  if (!editFormRef.value) return
  
  try {
    await editFormRef.value.validate()
    
    const formData = new FormData()
    formData.append('title', editForm.value.title)
    formData.append('category', editForm.value.category)
    formData.append('content', editForm.value.content)
    
    // 处理图片
    fileList.value.forEach(file => {
      if (file.raw) {
        // 新上传的图片
        formData.append('images', file.raw)
      } else {
        // 已存在的图片
        formData.append('existingImages', file.url)
      }
    })

    const res = await postApi.updatePost(editForm.value.id, formData)
    
    if (res.data.success) {
      ElMessage.success('修改成功')
      editDialogVisible.value = false
      await fetchNotes()
    }
  } catch (error) {
    handleError(error, '修改失败')
  }
}

// 处理删除
const handleDelete = async (note) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这篇笔记吗？此操作不可恢复。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('正在删除帖子:', {
      id: note._id,
      title: note.title
    });

    const res = await postApi.deletePost(note._id);
    console.log('删除响应:', res.data);
    
    if (res.data.success) {
      ElMessage.success('删除成功');
      await fetchNotes();
    } else {
      console.error('删除失败:', res.data);
      ElMessage.error(res.data.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', {
        error: error,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          '删除失败';
      ElMessage.error(errorMessage);
    }
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchNotes()
}

onMounted(() => {
  fetchNotes()
})

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    normal: '',
    hidden: 'warning',
    blocked: 'danger'
  };
  return types[status] || '';
};

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    normal: '正常',
    hidden: '已隐藏',
    blocked: '已封禁'
  };
  return texts[status] || status;
};

// 添加文件列表的响应式变量
const fileList = ref([])
const imageLoading = ref(false)

// 添加图片上传相关方法
const beforeUpload = (file) => {
  const isImage = /^image\/(jpeg|png|gif)$/.test(file.type)
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传jpg、png、gif格式的图片！')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB！')
    return false
  }
  return true
}

const handleUpload = async ({ file }) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    // 检查是否已经上传过这个文件
    const existingFile = fileList.value.find(f => 
      f.raw && f.raw.name === file.name && f.raw.size === file.size
    );
    
    if (existingFile) {
      return existingFile.url;
    }
    
    const res = await request.post('/upload?type=post', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (res.data.success) {
      // 保存文件信息以供后续检查
      file.url = res.data.url;
      return res.data.url
    } else {
      throw new Error(res.data.message || '上传失败')
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    ElMessage.error('文件上传失败')
    throw error
  }
}

const handleRemove = (file) => {
  console.log('删除的文件:', file)
  const index = fileList.value.findIndex(item => 
    item.url === file.url || item.response?.url === file.url
  )
  if (index !== -1) {
    fileList.value.splice(index, 1)
  }
}

const handlePreview = (file) => {
  window.open(file.url)
}
</script>

<style scoped>
.user-notes-container {
  padding: 20px;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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
  line-clamp: 2;
  -webkit-box-orient: vertical;
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

.note-actions {
  display: flex;
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

:deep(.el-dialog__body) {
  padding: 20px 40px;
}

.post-status {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}
</style> 