<script setup lang="ts">
import { Icon } from 'upov-ui';

defineProps<{
  emptyMessage?: string;
}>();
</script>

<template>
  <div style="background: rgba(184, 180, 164, 0.14); border-radius: 6px; padding: 14px; display: flex; flex-direction: column; gap: 8px">
    <div style="display: flex; align-items: center; gap: 5px">
      <Icon icon="file-earmark-text" size="small" style="color: #AD4E02" />
      <span style="font-size: 12px; font-weight: 600; color: #AD4E02; letter-spacing: 0.5px">PREVIEW</span>
    </div>
    <div style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 18px">
      <slot>
        <div v-if="emptyMessage" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--color-neutral-800)">
          <Icon icon="info-circle" size="small" />
          <span>{{ emptyMessage }}</span>
        </div>
      </slot>
    </div>
  </div>
</template>
