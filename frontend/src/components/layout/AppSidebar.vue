<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { SidebarNav } from 'upov-ui';
import type { SidebarNavItem, SidebarUser } from 'upov-ui';
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';

const authStore = useAuthStore();
const dashboardStore = useDashboardStore();
const collapsed = ref(false);

const items = computed<SidebarNavItem[]>(() => [
  { id: 'twp-drafts', label: 'TWP Drafts', icon: 'file-earmark-text', to: '/test-guidelines/twp-drafts', badge: dashboardStore.stats.twpDrafts || undefined },
  { id: 'tc-drafts', label: 'TC/TC-EDC Drafts', icon: 'file-earmark-text', to: '/test-guidelines/tc-drafts', badge: dashboardStore.stats.tcDrafts || undefined, visible: authStore.isAdmin },
  { id: 'adopted', label: 'Adopted', icon: 'check-circle', to: '/test-guidelines/adopted', visible: authStore.isAdmin },
  { id: 'archived', label: 'Archived', icon: 'archive', to: '/test-guidelines/archived' },
  { id: 'aborted', label: 'Aborted', icon: 'x-circle', to: '/test-guidelines/aborted', visible: authStore.isAdmin },
]);

const bottomItems = computed<SidebarNavItem[]>(() => [
  { id: 'users', label: 'Users', icon: 'people', to: '/admin/users', visible: authStore.isAdmin, dot: !!dashboardStore.stats.pendingRequests },
  { id: 'settings', label: 'Settings', icon: 'gear', visible: authStore.isAdmin, children: [
    { id: 'tg-management', label: 'TG Management', to: '/admin/settings/tg-management' },
    { id: 'user-assignments', label: 'User Assignments', to: '/admin/settings/user-assignments' },
    { id: 'technical-bodies', label: 'Technical Bodies', to: '/admin/settings/technical-bodies' },
  ]},
]);

const roleLabelMap: Record<string, string> = {
  ADM: 'Admin',
  EXP: 'Expert',
  TRN: 'Translator',
};

const user = computed<SidebarUser | undefined>(() => {
  if (!authStore.user) return undefined;
  const roleCode = authStore.user.roles?.[0];
  const roleLabel = roleCode ? roleLabelMap[roleCode] || roleCode : '';
  return {
    name: authStore.user.name,
    subtitle: roleLabel || undefined,
  };
});

onMounted(() => {
  if (authStore.isAuthenticated) {
    dashboardStore.fetchStats();
  }
});
</script>

<template>
  <SidebarNav
    v-if="authStore.isAuthenticated"
    v-model:collapsed="collapsed"
    :items="items"
    :bottom-items="bottomItems"
    :user="user"
    @user-click="$router.push('/profile')"
  />
</template>
