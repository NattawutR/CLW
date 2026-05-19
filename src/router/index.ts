import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { requiresAuth: false, layout: 'auth' },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/DashboardPage.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'co_admin', 'owner', 'staff'] as UserRole[] },
  },
  {
    path: '/income',
    name: 'รายรับ',
    component: () => import('@/pages/IncomePage.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'co_admin', 'owner', 'staff'] as UserRole[] },
  },
  {
    path: '/expense',
    name: 'รายจ่าย',
    component: () => import('@/pages/ExpensePage.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'co_admin', 'owner', 'staff'] as UserRole[] },
  },
  {
    path: '/settings/fixed-costs',
    name: 'ค่าใช้จ่ายประจำ',
    component: () => import('@/pages/settings/FixedCostsPage.vue'),
 meta: { requiresAuth: true, roles: ['admin', 'co_admin', 'owner', 'staff'] as UserRole[] },
  },
  {
    path: '/reports',
    name: 'รายงาน',
    component: () => import('@/pages/ReportsPage.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'co_admin', 'owner', 'staff'] as UserRole[] },
  },
  {
    path: '/settings/categories',
    name: 'หมวดหมู่',
    component: () => import('@/pages/settings/CategoriesPage.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'co_admin', 'owner', 'staff'] as UserRole[] },
  },
  {
    path: '/settings/products',
    name: 'สินค้า/บริการ',
    component: () => import('@/pages/settings/ProductsPage.vue'),
  meta: { requiresAuth: true, roles: ['admin', 'co_admin', 'owner', 'staff'] as UserRole[] },
  },
  

  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  // Initialize if needed
  if (!auth.isAuthenticated && !auth.loading) {
    auth.initialize()
  }

  const requiresAuth = to.meta.requiresAuth !== false
  const allowedRoles = to.meta.roles as UserRole[] | undefined

  // Not authenticated → go to login
  if (requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  // Already authenticated → skip login page
  if (to.name === 'Login' && auth.isAuthenticated) {
    return next({ name: 'Dashboard' })
  }

  // Check role access
  if (allowedRoles && auth.role && !allowedRoles.includes(auth.role)) {
    return next({ name: 'Dashboard' })
  }

  next()
})

export default router
