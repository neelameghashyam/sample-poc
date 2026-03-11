<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from 'upov-ui';

defineProps<{
  emptyMessage?: string;
  /** When true, the preview area shows a skeleton loader */
  loading?: boolean;
}>();

const emit = defineEmits<{
  /** Fired on mount (auto-load) and when Refresh button is clicked, carries the selected language */
  refresh: [lang: string];
}>();

const selectedLanguage = ref('en');

const languages = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'zh', label: '中文' },
];

/** Called when the user explicitly clicks Refresh */
function handleRefresh() {
  emit('refresh', selectedLanguage.value);
}
</script>

<template>
  <!-- Separate Preview Card -->
  <div style="
    background: #ffffff;
    border: 1px solid var(--color-neutral-200, #e5e7eb);
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.07);
    overflow: hidden;
    margin-top: 4px;
  ">
    <!-- Card Header: PREVIEW label + Language dropdown + Refresh button -->
    <div style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: rgba(184, 180, 164, 0.10);
      border-bottom: 1px solid var(--color-neutral-200, #e5e7eb);
    ">
      <!-- Left: Icon + Label -->
      <div style="display: flex; align-items: center; gap: 6px">
        <Icon icon="file-earmark-text" size="small" style="color: #AD4E02" />
        <span style="font-size: 12px; font-weight: 600; color: #AD4E02; letter-spacing: 0.6px; text-transform: uppercase">Preview</span>
      </div>

      <!-- Right: Language Dropdown + Refresh Button -->
      <div style="display: flex; align-items: center; gap: 8px">
        <!-- Language Dropdown -->
        <div style="position: relative; display: flex; align-items: center;">
          <select
            v-model="selectedLanguage"
            style="
              appearance: none;
              -webkit-appearance: none;
              background: #ffffff;
              border: 1px solid var(--color-neutral-300, #d1d5db);
              border-radius: 5px;
              padding: 4px 28px 4px 10px;
              font-size: 12px;
              font-weight: 500;
              color: var(--color-neutral-700, #374151);
              cursor: pointer;
              outline: none;
              line-height: 1.4;
              min-width: 100px;
            "
          >
            <option v-for="lang in languages" :key="lang.value" :value="lang.value">
              {{ lang.label }}
            </option>
          </select>
          <!-- Dropdown arrow icon -->
          <span style="
            position: absolute;
            right: 8px;
            pointer-events: none;
            display: flex;
            align-items: center;
            color: var(--color-neutral-500, #6b7280);
          ">
            <Icon icon="chevron-down" size="small" />
          </span>
        </div>

        <!-- Refresh Button -->
        <button
          @click="handleRefresh"
          :disabled="loading"
          :title="'Refresh preview'"
          style="
            display: flex;
            align-items: center;
            gap: 5px;
            background: #ffffff;
            border: 1px solid var(--color-neutral-300, #d1d5db);
            border-radius: 5px;
            padding: 4px 10px;
            font-size: 12px;
            font-weight: 500;
            color: var(--color-neutral-700, #374151);
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s;
            line-height: 1.4;
            white-space: nowrap;
          "
          :style="loading ? { opacity: '0.6', cursor: 'not-allowed' } : {}"
          @mouseenter="(e) => { if (!loading) { (e.currentTarget as HTMLElement).style.background = 'rgba(184,180,164,0.18)'; (e.currentTarget as HTMLElement).style.borderColor = '#AD4E02'; } }"
          @mouseleave="(e) => { (e.currentTarget as HTMLElement).style.background = '#ffffff'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-neutral-300, #d1d5db)'; }"
        >
          <Icon
            icon="arrow-clockwise"
            size="small"
            style="color: #AD4E02"
            :style="loading ? { animation: 'spin 1s linear infinite' } : {}"
          />
          <span>{{ loading ? 'Loading…' : 'Refresh' }}</span>
        </button>
      </div>
    </div>

    <!-- Preview Content -->
    <div style="padding: 14px 16px; font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">
      <!-- Skeleton loading state -->
      <div v-if="loading" class="skeleton-wrap">
        <div class="skeleton-line" style="width: 40%; height: 14px; margin-bottom: 10px;"></div>
        <div class="skeleton-line" style="width: 75%; height: 12px; margin-bottom: 7px;"></div>
        <div class="skeleton-line" style="width: 60%; height: 12px; margin-bottom: 7px;"></div>
        <div class="skeleton-line" style="width: 80%; height: 12px; margin-bottom: 14px;"></div>
        <div class="skeleton-line" style="width: 35%; height: 14px; margin-bottom: 10px;"></div>
        <div class="skeleton-line" style="width: 70%; height: 12px; margin-bottom: 7px;"></div>
        <div class="skeleton-line" style="width: 55%; height: 12px;"></div>
      </div>

      <!-- Slot for content / empty message -->
      <template v-else>
        <slot>
          <div v-if="emptyMessage" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--color-neutral-600, #4b5563)">
            <Icon icon="info-circle" size="small" />
            <span>{{ emptyMessage }}</span>
          </div>
        </slot>
      </template>
    </div>

    <!-- Divider Line at bottom -->
    <div style="
      height: 3px;
      background: linear-gradient(90deg, #AD4E02 0%, rgba(173, 78, 2, 0.15) 100%);
      border-radius: 0 0 8px 8px;
    "></div>
  </div>
</template>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}

.skeleton-wrap {
  padding: 4px 0;
}

.skeleton-line {
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite linear;
}
</style>