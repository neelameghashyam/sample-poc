import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
    requiresAccess?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { requiresAuth: true, requiresAccess: true },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/admin/UsersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, requiresAccess: true },
  },
  {
    path: '/admin/test-guidelines',
    name: 'admin-test-guidelines',
    component: () => import('@/views/admin/TestGuidelinesView.vue'),
    meta: { requiresAuth: true, requiresAccess: true },
  },
  {
    path: '/access-request',
    name: 'access-request',
    component: () => import('@/views/AccessRequestView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/test-guidelines/:id',
    name: 'editor',
    component: () => import('@/views/editor/EditorView.vue'),
    meta: { requiresAuth: true, requiresAccess: true },
  },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('@/views/AuthCallback.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },

];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // Ensure user data is loaded before checking access
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchUser();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (to.meta.requiresAccess && (authStore.needsAccessRequest || authStore.isPendingApproval)) {
    next({ name: 'access-request' });
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'dashboard' });
  } else {
    next();
  }
});

export default router;
