import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '../api/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/red',
      component: () => import('../views/Red.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Red',
          redirect: '/explore'
        },
        {
          path: '/explore',
          name: 'Explore',
          component: () => import('../components/Explore.vue')
        },
        {
          path: '/publish',
          name: 'Publish',
          component: () => import('../components/PublishPost.vue')
        },
        {
          path: '/profile',
          name: 'Profile',
          component: () => import('../components/Profile.vue'),
          children: [
            {
              path: 'info',
              name: 'UserInfo',
              component: () => import('../components/UserInfo.vue')
            },
            {
              path: 'notes',
              name: 'UserNotes',
              component: () => import('../components/UserNotes.vue')
            },
            {
              path: 'collections',
              name: 'UserCollections',
              component: () => import('../components/UserCollections.vue')
            },
            {
              path: 'likes',
              name: 'UserLikes',
              component: () => import('../components/UserLikes.vue')
            },
            {
              path: 'wallet',
              name: 'UserWallet',
              component: () => import('../components/UserWallet.vue')
            }
          ]
        },
        {
          path: '/search',
          name: 'SearchResults',
          component: () => import('../components/SearchResults.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'shop',
          name: 'Shop',
          component: () => import('../views/Shop.vue'),
          children: [
            {
              path: 'browse',
              name: 'ShopBrowse',
              component: () => import('../components/ShopBrowse.vue')
            },
            {
              path: 'cart',
              name: 'ShopCart',
              component: () => import('../components/ShopCart.vue')
            },
            {
              path: 'orders',
              name: 'ShopOrders',
              component: () => import('../components/UserOrders.vue')
            }
          ]
        }
      ]
    },
    {
      path: '/admin',
      component: () => import('../views/admin/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      children: [
        {
          path: '',
          component: () => import('../views/admin/DataCenter.vue'),
          name: 'DataCenter',
          meta: { requiresAdmin: true }
        },
        {
          path: 'sales',
          name: 'SalesCenter',
          component: () => import('../views/admin/SalesCenter.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'products',
          name: 'ProductManagement',
          component: () => import('../views/admin/ProductManagement.vue')
        },
        {
          path: 'notes',
          name: 'NoteManagement',
          component: () => import('../views/admin/NoteManagement.vue')
        },
        {
          path: 'wallet',
          name: 'WalletManagement',
          component: () => import('../views/admin/WalletManagement.vue')
        }
      ]
    }
  ]
})

// 全局路由守卫
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  const isAdmin = localStorage.getItem('isAdmin')
  
  if (to.path === '/') {
    if (token) {
      if (isAdmin) {
        next('/admin/products')
      } else {
        next('/explore')
      }
    } else {
      next('/login')
    }
    return
  }
  
  if (to.path === '/login') {
    if (token) {
      if (isAdmin) {
        next('/admin/products')
      } else {
        next('/explore')
      }
    } else {
      next()
    }
  } else if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (!isAdmin) {
      ElMessage.warning('请先登录管理员账号')
      next('/login')
    } else {
      next()
    }
  } else if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      ElMessage.warning('请先登录')
      next('/login')
    } else {
      try {
        // 验证 token 有效性
        await authApi.getUserInfo()
        next()
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('isAdmin')
        ElMessage.error('登录已过期，请重新登录')
        next('/login')
      }
    }
  } else {
    next()
  }
})

export default router
