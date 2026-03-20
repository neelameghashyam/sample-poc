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
    redirect: '/documents/drafts',
  },
  {
    path: '/documents',
    component: () => import('@/views/documents/DocumentsLayout.vue'),
    meta: { requiresAuth: true, requiresAccess: true },
    children: [
      { path: '', redirect: '/documents/drafts' },
      { path: 'drafts', name: 'documents-drafts', component: () => import('@/views/documents/DraftsView.vue') },
      { path: 'adopted', name: 'documents-adopted', component: () => import('@/views/documents/AdoptedView.vue'), meta: { requiresAdmin: true } },
      { path: 'archived', name: 'documents-archived', component: () => import('@/views/documents/ArchivedView.vue') },
      { path: 'submitted', name: 'documents-submitted', component: () => import('@/views/documents/SubmittedView.vue'), meta: { requiresAdmin: true } },
      { path: 'aborted', name: 'documents-aborted', component: () => import('@/views/documents/AbortedView.vue'), meta: { requiresAdmin: true } },
    ],
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/admin/UsersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, requiresAccess: true },
  },
  {
    path: '/admin/settings/tg-management',
    name: 'settings-tg-management',
    component: () => import('@/views/admin/settings/TgManagementView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, requiresAccess: true },
  },
  {
    path: '/admin/settings/user-assignments',
    name: 'settings-user-assignments',
    component: () => import('@/views/admin/settings/UserAssignmentsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, requiresAccess: true },
  },
  {
    path: '/admin/settings/technical-bodies',
    name: 'settings-technical-bodies',
    component: () => import('@/views/admin/settings/TechnicalBodiesView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, requiresAccess: true },
  },
  {
    path: '/admin/settings/asw-data',
    name: 'settings-asw-data',
    component: () => import('@/views/admin/settings/AswDataView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, requiresAccess: true },
  },
  {
    path: '/admin/test-guidelines',
    name: 'admin-test-guidelines',
    component: () => import('@/views/admin/TestGuidelinesView.vue'),
    meta: { requiresAuth: true, requiresAccess: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
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
    next({ name: 'documents-drafts' });
  } else {
    next();
  }
});

export default router;
