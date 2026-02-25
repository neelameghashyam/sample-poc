<script setup lang="ts">
import { Icon } from 'upov-ui';

interface Props {
  title: string;
  value?: number;
  icon?: string;
  color?: string;
}

withDefaults(defineProps<Props>(), {
  value: 0,
  icon: 'bar-chart',
  color: '#46B2A0',
});
</script>

<template>
  <div class="stats-card">
    <div class="stats-icon" :style="{ backgroundColor: color + '20', color }">
      <Icon :icon="icon" />
    </div>
    <div class="stats-content">
      <div class="stats-value">{{ value }}</div>
      <div class="stats-title">{{ title }}</div>
    </div>
  </div>
</template>

<style scoped>
.stats-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--color-bg-white);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stats-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 1.5rem;
}

.stats-content {
  flex: 1;
}

.stats-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary-green-dark);
}

.stats-title {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}
</style>
