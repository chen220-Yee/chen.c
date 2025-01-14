import request from './config'

export const postApi = {
  // 获取所有笔记（管理员）
  getAllPosts(search = '') {
    const params = {};
    if (search) {
      params.search = search;
    }
    return request.get('/posts/admin/all', { params });
  },

  // 删除笔记
  deletePost(postId) {
    return request.delete(`/posts/${postId}`)
  },

  // 更新笔记状态
  updatePostStatus(postId, status) {
    return request.put(`/posts/${postId}/status`, { status })
  },

  // 添加回其他需要的方法
  getPosts(category, page = 1, limit = 12) {
    return request.get(`/posts/${category}`, {
      params: { page, limit }
    })
  },

  getUserPosts(page = 1, limit = 12) {
    return request.get('/posts/user', {
      params: { page, limit }
    })
  },

  getPostDetail(id) {
    return request.get(`/posts/detail/${id}`)
  },

  likePost(postId) {
    return request.post(`/posts/like/${postId}`)
  },

  unlikePost(postId) {
    return request.delete(`/posts/like/${postId}`)
  },

  getLikedPosts(page = 1, limit = 12) {
    return request.get('/posts/likes', {
      params: { page, limit }
    })
  },

  checkLikeStatus(postId) {
    return request.get(`/posts/like/check/${postId}`)
  },

  commentPost(id, content) {
    return request.post(`/posts/comment/${id}`, { content })
  },

  getCollections(page = 1, limit = 12) {
    return request.get('/posts/collections', {
      params: { page, limit }
    })
  },

  collectPost(postId) {
    return request.post(`/posts/collect/${postId}`)
  },

  uncollectPost(postId) {
    return request.delete(`/posts/collect/${postId}`)
  },

  checkCollectionStatus(postId) {
    return request.get(`/posts/collect/check/${postId}`)
  },

  getPostComments(postId) {
    return request.get(`/posts/comments/${postId}`)
  },

  searchPosts(keyword, page = 1, limit = 12) {
    return request.get('/posts/search', {
      params: { 
        keyword: encodeURIComponent(keyword.trim()),
        page,
        limit
      }
    })
  },

  // 添加更新帖子的方法
  updatePost(postId, formData) {
    return request.put(`/posts/${postId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
} 