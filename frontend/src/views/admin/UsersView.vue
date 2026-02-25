<script setup lang="ts">
import { PageHeader } from 'upov-ui';
// TODO: Implement user management
</script>

<template>
  <div class="users-view">
    <PageHeader title="User Management" />
    <div class="placeholder">
      <p>User management functionality coming soon.</p>
      <p class="hint">This page will allow administrators to manage user accounts and roles.</p>
    </div>
  </div>
</template>

<style scoped>
.placeholder {
  background: var(--color-bg-white);
  padding: 48px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.placeholder p {
  color: var(--color-text);
  margin-bottom: 8px;
}

.hint {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}
</style>
