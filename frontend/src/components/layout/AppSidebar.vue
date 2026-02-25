<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { Icon } from 'upov-ui';
import type { MenuItem } from '@/types';

const authStore = useAuthStore();

const menuItems: MenuItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: 'speedometer2' },
  { name: 'Test Guidelines', path: '/admin/test-guidelines', icon: 'file-earmark-text' },
  { name: 'Users', path: '/admin/users', icon: 'people', adminOnly: true },
];
</script>

<template>
  <aside class="app-sidebar" v-if="authStore.isAuthenticated">
    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        v-show="!item.adminOnly || authStore.isAdmin"
      >
        <Icon :icon="item.icon" class="nav-icon" />
        <span class="nav-text">{{ item.name }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 240px;
  background: var(--color-bg-white);
  border-right: 1px solid var(--color-border-light);
  padding: 16px 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s;
}

.nav-item:hover {
  background-color: var(--color-bg-light);
}

.nav-item.router-link-active {
  background-color: color-mix(in srgb, var(--color-primary-green) 12%, transparent);
  color: var(--color-primary-green-dark);
  border-right: 3px solid var(--color-primary-green-dark);
}

.nav-icon {
  font-size: 1.25rem;
}

.nav-text {
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
