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
    redirect: '/test-guidelines/twp-drafts',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true, requiresAccess: true },
  },
  {
    path: '/test-guidelines',
    component: () => import('@/views/test-guidelines/TestGuidelinesLayout.vue'),
    meta: { requiresAuth: true, requiresAccess: true },
    children: [
      { path: '', redirect: '/test-guidelines/twp-drafts' },
      { path: 'twp-drafts', name: 'tg-twp-drafts', component: () => import('@/views/test-guidelines/TwpDraftsView.vue') },
      { path: 'tc-drafts', name: 'tg-tc-drafts', component: () => import('@/views/test-guidelines/TcDraftsView.vue') },
      {
        path: 'adopted', name: 'tg-adopted', meta: { requiresAdmin: true },
        component: () => import('@/views/test-guidelines/StatusView.vue'),
        props: { tab: 'adopted', sortKey: 'adoptionDate', twpCountsKey: 'adopted', dateColumn: { key: 'adoptionDate', label: 'Adoption Date' }, showStatCards: false },
      },
      {
        path: 'archived', name: 'tg-archived',
        component: () => import('@/views/test-guidelines/StatusView.vue'),
        props: { tab: 'archived', sortKey: 'statusDate', twpCountsKey: 'archived', dateColumn: { key: 'statusDate', label: 'Archived Date' } },
      },
      {
        path: 'submitted', name: 'tg-submitted', meta: { requiresAdmin: true },
        component: () => import('@/views/test-guidelines/StatusView.vue'),
        props: { tab: 'submitted', sortKey: 'statusDate', twpCountsKey: 'submitted', dateColumn: { key: 'statusDate', label: 'Sent to UPOV Date' } },
      },
      {
        path: 'aborted', name: 'tg-aborted', meta: { requiresAdmin: true },
        component: () => import('@/views/test-guidelines/StatusView.vue'),
        props: { tab: 'aborted', sortKey: 'statusDate', twpCountsKey: 'aborted', dateColumn: { key: 'statusDate', label: 'Aborted Date' }, showStatCards: false },
      },
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
    next({ name: 'tg-twp-drafts' });
  } else {
    next();
  }
});

export default router;
