<script setup lang="ts">
import { Logo } from 'upov-ui';
</script>

<template>
  <header class="app-header">
    <Logo :light="true" size="small" />
    <span class="brand-text">TG Template</span>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  height: 48px;
  background: var(--color-primary-green-dark);
  color: white;
}

.brand-text {
  font-size: 1.125rem;
  font-weight: 600;
}
</style>
