<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { Logo } from 'upov-ui';

const authStore = useAuthStore();
</script>

<template>
  <header class="app-header">
    <div class="header-brand">
      <Logo :light="true" size="small" />
      <span class="brand-text">TG Template</span>
    </div>
    <div class="header-actions">
      <template v-if="authStore.isAuthenticated">
        <span class="user-name">{{ authStore.user?.name || 'User' }}</span>
        <button class="btn-logout" @click="authStore.logout">Logout</button>
      </template>
      <template v-else>
        <button class="btn-login" @click="authStore.login">Login</button>
      </template>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  background: var(--color-primary-green-dark);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name {
  font-size: 0.875rem;
}

.btn-login,
.btn-logout {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-family: inherit;
}

.btn-login {
  background: var(--color-primary-green-bright);
  color: white;
}

.btn-logout {
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-login:hover,
.btn-logout:hover {
  opacity: 0.9;
}
</style>
