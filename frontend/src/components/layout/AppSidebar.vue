<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { SidebarNav } from 'upov-ui';
import type { SidebarNavItem, SidebarUser } from 'upov-ui';
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';

const router = useRouter();
const authStore = useAuthStore();
const dashboardStore = useDashboardStore();
const collapsed = ref(false);

const pendingBadge = computed(() => {
  const count = dashboardStore.stats.pendingRequests;
  return count ? count : undefined;
});

const items = computed<SidebarNavItem[]>(() => [
  { id: 'drafts', label: 'Drafts', icon: 'pencil-square', to: '/documents/drafts', badge: dashboardStore.stats.active || undefined },
  { id: 'adopted', label: 'Adopted', icon: 'check-circle', to: '/documents/adopted', visible: authStore.isAdmin },
  { id: 'archived', label: 'Archived', icon: 'archive', to: '/documents/archived' },
  { id: 'submitted', label: 'Sent to UPOV', icon: 'send', to: '/documents/submitted', visible: authStore.isAdmin },
  { id: 'aborted', label: 'Aborted', icon: 'x-circle', to: '/documents/aborted', visible: authStore.isAdmin },
]);

const bottomItems = computed<SidebarNavItem[]>(() => [
  { id: 'users', label: 'Users', icon: 'people', to: '/admin/users', visible: authStore.isAdmin, dot: !!pendingBadge.value },
  { id: 'settings', label: 'Settings', icon: 'gear', visible: authStore.isAdmin, children: [
    { id: 'tg-management', label: 'TG Management', to: '/admin/settings/tg-management' },
    { id: 'user-assignments', label: 'User Assignments', to: '/admin/settings/user-assignments' },
    { id: 'technical-bodies', label: 'Technical Bodies', to: '/admin/settings/technical-bodies' },
    { id: 'asw-data', label: 'ASW Data', to: '/admin/settings/asw-data' },
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
    email: roleLabel || authStore.user.email,
  };
});

function onItemClick(item: SidebarNavItem) {
  if (item.to) router.push(item.to);
}

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
    :show-logout="false"
    @item-click="onItemClick"
    @user-click="router.push('/profile')"
  />
</template>
