<script setup lang="ts">
defineProps<{
  emptyMessage?: string;
}>();
</script>

<template>
  <div style="background: rgba(184, 180, 164, 0.14); border-radius: 6px; padding: 14px; display: flex; flex-direction: column; gap: 8px">
    <div style="display: flex; align-items: center; gap: 5px">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M8.5 1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V5.5L8.5 1ZM8.5 1v4.5H13" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 9.5h5M5 11.5h3" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      <span style="font-size: 12px; font-weight: 600; color: #AD4E02; letter-spacing: 0.5px">PREVIEW</span>
    </div>
    <div style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 18px">
      <slot>
        <div v-if="emptyMessage" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--color-neutral-800)">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="7.5" cy="7.5" r="6.5" stroke="var(--color-neutral-800, #303030)" stroke-width="1.1"/>
            <path d="M7.5 6.5V10.5" stroke="var(--color-neutral-800, #303030)" stroke-width="1.3" stroke-linecap="round"/>
            <circle cx="7.5" cy="4.5" r="0.8" fill="var(--color-neutral-800, #303030)"/>
          </svg>
          <span>{{ emptyMessage }}</span>
        </div>
      </slot>
    </div>
  </div>
</template>
