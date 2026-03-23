<script setup lang="ts">
interface Props {
  spacing?: 'compact' | 'default' | 'spacious';
  vertical?: boolean;
}

withDefaults(defineProps<Props>(), {
  spacing: 'default',
  vertical: false,
});
</script>

<template>
  <hr :class="['divider', `divider--${spacing}`, { 'divider--vertical': vertical }]" />
</template>

<style scoped>
.divider {
  border: none;
  border-top: 1px solid var(--color-neutral-200, #e5e5e5);
  margin: 0;
}

.divider--compact {
  margin: 8px 0;
}

.divider--default {
  margin: 16px 0;
}

.divider--spacious {
  margin: 24px 0;
}

.divider--vertical {
  display: inline-block;
  width: 1px;
  height: 24px;
  border-top: none;
  border-left: 1px solid var(--color-neutral-200, #e5e5e5);
  margin: 0 8px;
  vertical-align: middle;
}
</style>