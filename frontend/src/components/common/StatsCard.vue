<script setup lang="ts">
import { Icon, Card } from 'upov-ui';

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
  <Card elevation="low" padding="compact">
    <div class="stats-inner">
      <div class="stats-icon" :style="{ backgroundColor: color + '20', color }">
        <Icon :icon="icon" />
      </div>
      <div class="stats-content">
        <div class="stats-value">{{ value }}</div>
        <div class="stats-title">{{ title }}</div>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.stats-inner {
  display: flex;
  align-items: center;
  gap: 16px;
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
