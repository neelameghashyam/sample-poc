<script setup lang="ts">
import { computed } from 'vue';
import { Icon, Spinner } from 'upov-ui';

interface Props {
  status: 'idle' | 'saving' | 'saved' | 'error';
  idleMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  idleMessage: '',
});

const displayText = computed(() => {
  switch (props.status) {
    case 'saving':
      return 'Saving...';
    case 'saved':
      return 'Saved';
    case 'error':
      return 'Error saving';
    case 'idle':
    default:
      return props.idleMessage || '';
  }
});

const iconName = computed(() => {
  switch (props.status) {
    case 'saved':
      return 'check-circle';
    case 'error':
      return 'exclamation-circle';
    default:
      return '';
  }
});

const iconColor = computed(() => {
  switch (props.status) {
    case 'saved':
      return 'success';
    case 'error':
      return 'danger';
    default:
      return 'inherit';
  }
});
</script>

<template>
  <div class="save-status">
    <Spinner v-if="status === 'saving'" :diameter="16" color="primary" />
    <Icon
      v-else-if="iconName"
      :icon="iconName"
      size="small"
      :color="iconColor"
    />
    <span v-if="displayText" class="save-status__text">{{ displayText }}</span>
  </div>
</template>

<style scoped>
.save-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-neutral-600);
}

.save-status__text {
  line-height: 1.2;
}
</style>