<script setup lang="ts">
import { ref, watch } from 'vue';
import { useEditorStore } from '@/stores/editor';
import api from '@/services/api';

const props = defineProps<{
  chapterNumber: number;
}>();

const store = useEditorStore();

// ── State ─────────────────────────────────────────────────────────────────────
const selectedLang = ref<'en' | 'fr' | 'de' | 'es'>('en');
const previewHtml  = ref<string | null>(null);
const loading      = ref(false);
const error        = ref<string | null>(null);
const hasFetched   = ref(false);

const LANGS = [
  { code: 'en', label: 'EN – English'   },
  { code: 'fr', label: 'FR – Français'  },
  { code: 'de', label: 'DE – Deutsch'   },
  { code: 'es', label: 'ES – Español'   },
] as const;

// ── API call ──────────────────────────────────────────────────────────────────
async function fetchPreview() {
  const tgId = store.tgId;
  if (!tgId) return;

  loading.value = true;
  error.value   = null;

  try {
    const res = await api.get<string>(
      `/api/doc-generate/${tgId}/chapter/${props.chapterNumber}`,
      { params: { lang: selectedLang.value }, responseType: 'text' },
    );
    previewHtml.value = res.data;
    hasFetched.value  = true;
  } catch (err: any) {
    error.value = err?.response?.data?.error?.message
      || err?.message
      || 'Failed to load preview';
  } finally {
    loading.value = false;
  }
}

// Re-fetch when language changes (only after the user has fetched at least once)
watch(selectedLang, () => { if (hasFetched.value) fetchPreview(); });
</script>

<template>
  <div class="chapter-preview-root">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="preview-header">
      <div class="preview-label">
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
          <path d="M8.5 1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V5.5L8.5 1ZM8.5 1v4.5H13"
            stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M5 9.5h5M5 11.5h3" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <span>PREVIEW</span>
      </div>

      <div class="preview-controls">
        <!-- Language selector -->
        <div class="lang-wrapper">
          <select v-model="selectedLang" class="lang-select" :disabled="loading" title="Select language">
            <option v-for="l in LANGS" :key="l.code" :value="l.code">{{ l.label }}</option>
          </select>
          <svg class="lang-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.4"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- Refresh icon button -->
        <button class="refresh-btn" :disabled="loading" title="Refresh preview" @click="fetchPreview">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" :class="{ spin: loading }">
            <path d="M1 7A6 6 0 0 1 12.5 4M1 7l2-2M1 7l2 2M13 7A6 6 0 0 1 1.5 10M13 7l-2 2M13 7l-2-2"
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- ── Body ───────────────────────────────────────────────────────────── -->
    <div class="preview-body">
      <!-- Error -->
      <div v-if="error" class="preview-state preview-error">
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="7.5" r="6.5" stroke="#C0392B" stroke-width="1.1"/>
          <path d="M7.5 4.5V8" stroke="#C0392B" stroke-width="1.3" stroke-linecap="round"/>
          <circle cx="7.5" cy="10.5" r="0.8" fill="#C0392B"/>
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Placeholder before first fetch -->
      <div v-else-if="!hasFetched" class="preview-state preview-placeholder">
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none" style="opacity:0.3">
          <rect x="4" y="2" width="16" height="22" rx="2" stroke="#AD4E02" stroke-width="1.5"/>
          <path d="M8 8h8M8 12h8M8 16h5" stroke="#AD4E02" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        <p>Click <strong>↻</strong> to load the document preview</p>
        <p class="hint">Select a language first if needed</p>
      </div>

      <!-- Rendered BE HTML in iframe -->
      <iframe v-else-if="previewHtml"
        :srcdoc="previewHtml"
        class="preview-iframe"
        sandbox="allow-same-origin"
        title="Chapter preview"
        loading="lazy"
      />
    </div>
  </div>
</template>

<style scoped>
.chapter-preview-root {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(173, 78, 2, 0.18);
  background: rgba(184, 180, 164, 0.08);
}

/* Header */
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 11px;
  background: rgba(173, 78, 2, 0.07);
  border-bottom: 1px solid rgba(173, 78, 2, 0.13);
  gap: 8px;
}
.preview-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #AD4E02;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  flex-shrink: 0;
}
.preview-controls {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Language select */
.lang-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.lang-select {
  appearance: none;
  -webkit-appearance: none;
  background: rgba(255,255,255,0.75);
  border: 1px solid rgba(173,78,2,0.22);
  border-radius: 4px;
  padding: 3px 22px 3px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #5a3400;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
  min-width: 112px;
  line-height: 1.5;
}
.lang-select:hover:not(:disabled) {
  border-color: rgba(173,78,2,0.45);
  background: rgba(255,255,255,0.95);
}
.lang-select:focus {
  border-color: #AD4E02;
  box-shadow: 0 0 0 2px rgba(173,78,2,0.12);
}
.lang-select:disabled { opacity: 0.5; cursor: not-allowed; }
.lang-chevron {
  position: absolute;
  right: 6px;
  pointer-events: none;
  color: #AD4E02;
  opacity: 0.65;
}

/* Refresh button */
.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid rgba(173,78,2,0.22);
  border-radius: 4px;
  background: rgba(255,255,255,0.75);
  color: #AD4E02;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  flex-shrink: 0;
}
.refresh-btn:hover:not(:disabled) {
  background: rgba(173,78,2,0.10);
  border-color: rgba(173,78,2,0.45);
}
.refresh-btn:active:not(:disabled) { transform: scale(0.90); }
.refresh-btn:disabled { opacity: 0.45; cursor: not-allowed; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.spin {
  animation: spin 0.75s linear infinite;
  transform-origin: center;
  display: block;
}

/* Body */
.preview-body { min-height: 64px; }

.preview-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 26px 16px;
  text-align: center;
}

/* Error */
.preview-error {
  flex-direction: row;
  padding: 12px 14px;
  font-size: 13px;
  color: #C0392B;
  justify-content: flex-start;
}

/* Placeholder */
.preview-placeholder {
  color: var(--color-neutral-600, #606060);
}
.preview-placeholder p { margin: 0; font-size: 13px; }
.preview-placeholder .hint { font-size: 11px; opacity: 0.6; }

/* iframe */
.preview-iframe {
  width: 100%;
  min-height: 440px;
  border: none;
  display: block;
  background: #fff;
}
</style>
