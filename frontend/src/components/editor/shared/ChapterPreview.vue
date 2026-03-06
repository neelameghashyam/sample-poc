<script setup lang="ts">
import { ref } from 'vue';
import { useEditorStore } from '@/stores/editor';
import { editorApi } from '@/services/editor-api';

const props = defineProps<{
  emptyMessage?: string;
  chapterNumber: number;
}>();

const emit = defineEmits<{
  (e: 'refreshed', data: any): void;
}>();

const store = useEditorStore();

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'de', label: 'DE' },
  { code: 'es', label: 'ES' },
];

const selectedLang = ref('en');
const refreshing = ref(false);

async function refreshPreview() {
  if (refreshing.value || !store.tgId) return;
  refreshing.value = true;
  try {
    const data = await editorApi.previewChapter(
      store.tgId,
      props.chapterNumber,
      selectedLang.value === 'en' ? undefined : selectedLang.value,
    );
    emit('refreshed', data);
  } finally {
    refreshing.value = false;
  }
}
</script>

<template>
  <div style="background: rgba(184, 180, 164, 0.14); border-radius: 6px; padding: 14px; display: flex; flex-direction: column; gap: 8px">
    <!-- Header row -->
    <div style="display: flex; align-items: center; justify-content: space-between">
      <!-- Left: PREVIEW label -->
      <div style="display: flex; align-items: center; gap: 5px">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M8.5 1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V5.5L8.5 1ZM8.5 1v4.5H13" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M5 9.5h5M5 11.5h3" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <span style="font-size: 12px; font-weight: 600; color: #AD4E02; letter-spacing: 0.5px">PREVIEW</span>
      </div>

      <!-- Right: Language selector + Refresh icon -->
      <div style="display: flex; align-items: center; gap: 6px">
        <!-- Language dropdown -->
        <div style="position: relative; display: flex; align-items: center">
          <select
            v-model="selectedLang"
            style="
              appearance: none;
              -webkit-appearance: none;
              background: white;
              border: 1px solid rgba(173, 78, 2, 0.3);
              border-radius: 4px;
              padding: 2px 20px 2px 7px;
              font-size: 11px;
              font-weight: 600;
              color: #AD4E02;
              cursor: pointer;
              outline: none;
              line-height: 18px;
              height: 22px;
            "
          >
            <option v-for="lang in LANGUAGES" :key="lang.code" :value="lang.code">{{ lang.label }}</option>
          </select>
          <svg
            width="8" height="8" viewBox="0 0 8 8" fill="none"
            style="position: absolute; right: 5px; pointer-events: none"
          >
            <path d="M1.5 3L4 5.5L6.5 3" stroke="#AD4E02" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- Refresh icon button -->
        <button
          :disabled="refreshing"
          :title="refreshing ? 'Refreshing…' : 'Refresh preview'"
          class="refresh-btn"
          :class="{ spinning: refreshing }"
          @click="refreshPreview"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" class="refresh-icon">
            <path d="M1 7A6 6 0 0 1 12.5 4M1 7l2-2M1 7l2 2M13 7A6 6 0 0 1 1.5 10M13 7l-2 2M13 7l-2-2"
              stroke="#AD4E02" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Content slot -->
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

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1px solid rgba(173, 78, 2, 0.3);
  border-radius: 4px;
  background: white;
  cursor: pointer;
  padding: 0;
  transition: background 0.15s, opacity 0.15s;
  flex-shrink: 0;
}
.refresh-btn:hover:not(:disabled) {
  background: rgba(173, 78, 2, 0.06);
  border-color: rgba(173, 78, 2, 0.5);
}
.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.refresh-btn.spinning .refresh-icon {
  animation: spin 0.8s linear infinite;
}

select:focus {
  border-color: #AD4E02 !important;
  box-shadow: 0 0 0 2px rgba(173, 78, 2, 0.15);
}
</style>
