<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { Logo, StatusBadge, Button } from 'upov-ui';
import type { StatusBadgeVariant } from 'upov-ui';

const router = useRouter();
const authStore = useAuthStore();

function handleLogout() {
  authStore.logout();
  router.push('/login');
}

const navLinks = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Test Guidelines', path: '/admin/test-guidelines' },
];

const adminLinks = [
  { name: 'Users', path: '/admin/users' },
];

const roleLabelMap: Record<string, string> = {
  ADM: 'Admin',
  EXP: 'Expert',
  TRN: 'Translator',
};

const roleVariantMap: Record<string, StatusBadgeVariant> = {
  ADM: 'info',
  EXP: 'success',
  TRN: 'warning',
};

const userRole = computed(() => {
  const code = authStore.user?.roles?.[0];
  if (!code) return null;
  return { label: roleLabelMap[code] || code, variant: roleVariantMap[code] || 'neutral' as StatusBadgeVariant };
});
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <div class="header-brand">
        <Logo :light="true" size="small" />
        <span class="brand-text">TG Template</span>
      </div>
      <nav v-if="authStore.hasAccess" class="header-nav">
        <RouterLink
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          class="nav-link"
        >
          {{ link.name }}
        </RouterLink>
        <RouterLink
          v-for="link in adminLinks"
          :key="link.path"
          :to="link.path"
          class="nav-link"
          v-show="authStore.isAdmin"
        >
          {{ link.name }}
        </RouterLink>
      </nav>
    </div>
    <div class="header-actions">
      <template v-if="authStore.isAuthenticated">
        <span class="user-info">
          <RouterLink v-if="authStore.hasAccess" to="/profile" class="user-name-link">{{ authStore.user?.name || 'User' }}</RouterLink>
          <span v-else class="user-name">{{ authStore.user?.name || 'User' }}</span>
          <StatusBadge v-if="userRole" :label="userRole.label" :variant="userRole.variant" size="small" />
        </span>
        <Button type="secondary" size="small" @click="handleLogout">Logout</Button>
      </template>
      <template v-else>
        <Button type="primary" size="small" @click="authStore.login">Login</Button>
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
  box-shadow: var(--shadow-sm);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 32px;
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

.header-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
  transition: color 0.15s, background-color 0.15s;
}

.nav-link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  color: white;
  background: rgba(255, 255, 255, 0.15);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name,
.user-name-link {
  font-size: 0.875rem;
}

.user-name-link {
  color: white;
  text-decoration: none;
}

.user-name-link:hover {
  text-decoration: underline;
}

</style>
