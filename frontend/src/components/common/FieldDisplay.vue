<script setup lang="ts">
interface Props {
  label: string;
  value: string;
}

defineProps<Props>();
</script>

<template>
  <div class="field-display">
    <span class="field-display__label">{{ label }}</span>
    <span class="field-display__value">{{ value }}</span>
  </div>
</template>

<style scoped>
.field-display {
  display: flex;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-neutral-200, #e5e5e5);
}

.field-display__label {
  font-weight: 600;
  color: var(--color-text-secondary, #666);
  min-width: 140px;
}

.field-display__value {
  color: var(--color-text-primary, #1a1a1a);
  flex: 1;
}
</style>