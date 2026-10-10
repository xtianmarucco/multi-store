import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue')
  },
  {
    path: '/products',
    name: 'ProductsView',
    component: () => import('../views/ProductsView.vue')
  },
  {
    path: '/products/new',
    name: 'ProductNew',
    component: () => import('../views/ProductFormView.vue')
  },
  {
    path: '/products/:id',
    name: 'ProductEdit',
    component: () => import('../views/ProductFormView.vue'),
    props: route => ({ id: Number(route.params.id) })
  },
  {
    path: '/categories',
    name: 'CategoriesView',
    component: () => import('../views/CategoriesView.vue')
  },
  {
    path: '/items',
    name: 'ItemsView',
    component: () => import('../views/ItemsView.vue')
  },
  {
    path: '/items/new',
    name: 'ItemNew',
    component: () => import('../views/ItemFormView.vue')
  },
  {
    path: '/items/:id',
    name: 'ItemEdit',
    component: () => import('../views/ItemFormView.vue'),
    props: route => ({ id: Number(route.params.id) })
  },
  {
    path: '/locations',
    name: 'LocationsView',
    component: () => import('../views/LocationsView.vue')
  },
  {
    path: '/labels',
    name: 'LabelsView',
    component: () => import('../views/LabelsView.vue')
  },
  {
    path: '/users',
    name: 'UsersView',
    component: () => import('../views/UsersView.vue'),
    meta: { admin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.user) {
    await authStore.fetchMe()
  }

  if (to.meta.public) {
    return authStore.isAuthenticated ? { name: 'Dashboard' } : true
  }

  if (!authStore.isAuthenticated) {
    return { name: 'Login' }
  }

  if (to.meta.admin && !authStore.isAdmin) {
    return { name: 'Dashboard' }
  }
})

export default router
