<script setup lang="ts">
import { ref } from 'vue';
import { Icon, AccordionItem } from 'upov-ui';

defineProps<{
  emptyMessage?: string;
  /** When true, shows skeleton loader in the preview area */
  loading?: boolean;
  /** When true, the Refresh button pulses to indicate the preview is stale */
  needsRefresh?: boolean;
}>();

const emit = defineEmits<{
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

function handleRefresh() {
  emit('refresh', selectedLanguage.value);
}
</script>

<template>
  <div style="margin-top: 4px;" class="chapter-preview-wrap">
    <AccordionItem title="Preview" :default-open="true">

      <!-- Toolbar: language + refresh (sits at top of accordion body) -->
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0 12px 0;
        border-bottom: 1px solid var(--color-neutral-200, #e5e7eb);
        margin-bottom: 14px;
      ">
        <!-- Left: stale badge -->
        <div style="display: flex; align-items: center; gap: 6px;">
          <Transition name="fade">
            <span
              v-if="needsRefresh && !loading"
              style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-size: 11px;
                font-weight: 600;
                color: #b45309;
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 4px;
                padding: 1px 7px;
              "
            >
              <span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;display:inline-block;"></span>
              Out of date
            </span>
          </Transition>
        </div>

        <!-- Right: language dropdown + refresh button -->
        <div style="display: flex; align-items: center; gap: 8px;">
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
            <span style="position: absolute; right: 8px; pointer-events: none; display: flex; align-items: center; color: var(--color-neutral-500, #6b7280);">
              <Icon icon="chevron-down" size="small" />
            </span>
          </div>

          <!-- Refresh Button -->
          <button
            @click="handleRefresh"
            :disabled="loading"
            :title="needsRefresh ? 'Content changed — refresh preview' : 'Refresh preview'"
            :class="{ 'refresh-btn--stale': needsRefresh && !loading }"
            class="refresh-btn"
            :style="loading ? { opacity: '0.6', cursor: 'not-allowed' } : {}"
          >
            <Icon
              icon="arrow-clockwise"
              size="small"
              :class="{ 'icon-spin': loading }"
              style="color: inherit"
            />
            <span>{{ loading ? 'Loading…' : 'Refresh' }}</span>
          </button>
        </div>
      </div>

      <!-- Preview Content -->
      <div style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px;">
        <!-- Skeleton -->
        <div v-if="loading" class="skeleton-wrap">
          <div class="skeleton-line" style="width: 40%; height: 14px; margin-bottom: 10px;"></div>
          <div class="skeleton-line" style="width: 75%; height: 12px; margin-bottom: 7px;"></div>
          <div class="skeleton-line" style="width: 60%; height: 12px; margin-bottom: 7px;"></div>
          <div class="skeleton-line" style="width: 80%; height: 12px; margin-bottom: 14px;"></div>
          <div class="skeleton-line" style="width: 35%; height: 14px; margin-bottom: 10px;"></div>
          <div class="skeleton-line" style="width: 70%; height: 12px; margin-bottom: 7px;"></div>
          <div class="skeleton-line" style="width: 55%; height: 12px;"></div>
        </div>

        <template v-else>
          <slot>
            <div v-if="emptyMessage" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--color-neutral-600, #4b5563)">
              <Icon icon="info-circle" size="small" />
              <span>{{ emptyMessage }}</span>
            </div>
          </slot>
        </template>
      </div>

    </AccordionItem>
  </div>
</template>

<style scoped>
/* ── Refresh button base ── */
.refresh-btn {
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
  transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
  line-height: 1.4;
  white-space: nowrap;
}
.refresh-btn:hover:not(:disabled) {
  background: rgba(184,180,164,0.18);
  border-color: #AD4E02;
}

/* ── Stale / highlighted state ── */
.refresh-btn--stale {
  background: #fffbeb;
  border-color: #f59e0b;
  color: #b45309;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
  animation: pulse-border 1.8s ease-in-out infinite;
}
.refresh-btn--stale:hover:not(:disabled) {
  background: #fef3c7;
  border-color: #d97706;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3);
}

/* ── Animations ── */
@keyframes pulse-border {
  0%, 100% { box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2); }
  50%       { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.35); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}

.icon-spin { animation: spin 1s linear infinite; }

/* ── Skeleton ── */
.skeleton-wrap { padding: 4px 0; }
.skeleton-line {
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite linear;
}

/* ── Badge fade transition ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>