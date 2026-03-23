<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Props {
  value?: number;
  color?: string;
  animated?: boolean;
  duration?: number;
  size?: 'small' | 'medium';
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  color: '#009a6e',
  animated: false,
  duration: 3000,
  size: 'small',
});

const currentValue = ref(props.animated ? 0 : props.value);

onMounted(() => {
  if (props.animated) {
    setTimeout(() => {
      currentValue.value = 100;
    }, 50);
  }
});
</script>

<template>
  <div :class="['progress-bar', `progress-bar--${size}`]">
    <div
      class="progress-bar__fill"
      :style="{
        width: `${currentValue}%`,
        backgroundColor: color,
        transition: animated ? `width ${duration}ms linear` : 'width 0.3s ease',
      }"
    />
  </div>
</template>

<style scoped>
.progress-bar {
  width: 100%;
  background-color: var(--color-neutral-200, #e5e5e5);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar--small {
  height: 3px;
}

.progress-bar--medium {
  height: 4px;
}

.progress-bar__fill {
  height: 100%;
  border-radius: 4px;
}
</style>