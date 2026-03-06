<script setup lang="ts">
import { ref, watch } from 'vue';
import { useEditorStore } from '@/stores/editor';

const props = defineProps<{
  chapterNumber: number;
}>();

const store = useEditorStore();

// ── State ─────────────────────────────────────────────────────────────────────
const selectedLang = ref<'en' | 'fr' | 'de' | 'es'>('en');
const previewHtml  = ref<string | null>(null);
const loading      = ref(false);
const errorMsg     = ref<string | null>(null);
const hasFetched   = ref(false);

const LANGS = [
  { code: 'en', label: 'EN – English'  },
  { code: 'fr', label: 'FR – Français' },
  { code: 'de', label: 'DE – Deutsch'  },
  { code: 'es', label: 'ES – Español'  },
] as const;

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchPreview() {
  const tgId = store.tgId;
  if (!tgId || loading.value) return;   // guard against concurrent calls

  loading.value  = true;
  errorMsg.value = null;

  try {
    const token    = localStorage.getItem('token');
    const provider = localStorage.getItem('auth_provider');
    const baseUrl  = import.meta.env.VITE_API_BASE_URL || '';
    const url      = `${baseUrl}/api/doc-generate/${tgId}/chapter/${props.chapterNumber}?lang=${selectedLang.value}`;

    // Use native fetch so we control headers without Axios response-type quirks
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token    ? { Authorization: `Bearer ${token}` }       : {}),
        ...(provider ? { 'X-Auth-Provider': provider }             : {}),
        Accept: 'text/html, */*',
      },
    });

    if (res.ok) {
      previewHtml.value = await res.text();
      hasFetched.value  = true;
    } else {
      // Try to parse a JSON error body (our handler returns JSON 404s for missing TGs)
      let detail = '';
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try {
          const json = await res.json();
          detail = json?.error?.message || '';
        } catch { /* ignore */ }
      }
      if (!detail) detail = await res.text().catch(() => '');

      if (res.status === 404 && !detail) {
        // Plain-text 404 = Hono "Not Found" = route not registered in running BE
        errorMsg.value = `Preview API not available (404). Make sure your BE server has the `
          + `/api/doc-generate route running and restart it.`;
      } else if (res.status === 401) {
        errorMsg.value = 'Unauthorised — please refresh the page and log in again.';
      } else {
        errorMsg.value = detail || `Server error ${res.status}`;
      }
    }
  } catch (err: any) {
    errorMsg.value = err?.message || 'Network error — could not reach the preview API.';
  } finally {
    loading.value = false;
  }
}

// Re-fetch when language changes, but only after the first successful load
watch(selectedLang, () => { if (hasFetched.value) fetchPreview(); });
</script>

<template>
  <div class="chapter-preview-root">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="preview-header">
      <!-- Left: icon + label -->
      <div class="preview-label">
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
          <path d="M8.5 1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V5.5L8.5 1ZM8.5 1v4.5H13"
            stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M5 9.5h5M5 11.5h3" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <span>PREVIEW</span>
      </div>

      <!-- Right: language select + refresh icon -->
      <div class="preview-controls">
        <!-- Language dropdown -->
        <div class="lang-wrapper">
          <select
            v-model="selectedLang"
            class="lang-select"
            :disabled="loading"
            title="Select preview language"
          >
            <option v-for="l in LANGS" :key="l.code" :value="l.code">{{ l.label }}</option>
          </select>
          <svg class="lang-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.4"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- Refresh icon-only button -->
        <button
          class="refresh-btn"
          :disabled="loading"
          :title="loading ? 'Loading…' : 'Refresh preview'"
          @click="fetchPreview"
        >
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            :class="{ spin: loading }"
          >
            <path
              d="M1 7A6 6 0 0 1 12.5 4M1 7l2-2M1 7l2 2M13 7A6 6 0 0 1 1.5 10M13 7l-2 2M13 7l-2-2"
              stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- ── Body ───────────────────────────────────────────────────────────── -->
    <div class="preview-body">

      <!-- Error state -->
      <div v-if="errorMsg" class="preview-state preview-error">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style="flex-shrink:0">
          <circle cx="7.5" cy="7.5" r="6.5" stroke="#C0392B" stroke-width="1.1"/>
          <path d="M7.5 4.5V8.5" stroke="#C0392B" stroke-width="1.3" stroke-linecap="round"/>
          <circle cx="7.5" cy="10.5" r="0.8" fill="#C0392B"/>
        </svg>
        <span>{{ errorMsg }}</span>
      </div>

      <!-- Placeholder — not yet fetched -->
      <div v-else-if="!hasFetched" class="preview-state preview-placeholder">
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none" style="opacity:0.28">
          <rect x="4" y="2" width="16" height="22" rx="2" stroke="#AD4E02" stroke-width="1.5"/>
          <path d="M8 8h8M8 12h8M8 16h5" stroke="#AD4E02" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        <p>Click <strong>↻</strong> to load the document preview</p>
        <p class="hint">Select a language before refreshing if needed</p>
      </div>

      <!-- Rendered BE HTML in sandboxed iframe -->
      <iframe
        v-else-if="previewHtml"
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
/* Root */
.chapter-preview-root {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(173, 78, 2, 0.18);
  background: rgba(184, 180, 164, 0.08);
}

/* ── Header ───────────────────────────────────────────────────────────────── */
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
  user-select: none;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* ── Language select ──────────────────────────────────────────────────────── */
.lang-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.lang-select {
  appearance: none;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(173, 78, 2, 0.22);
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
  border-color: rgba(173, 78, 2, 0.48);
  background: rgba(255, 255, 255, 0.96);
}

.lang-select:focus {
  border-color: #AD4E02;
  box-shadow: 0 0 0 2px rgba(173, 78, 2, 0.14);
}

.lang-select:disabled { opacity: 0.5; cursor: not-allowed; }

.lang-chevron {
  position: absolute;
  right: 6px;
  pointer-events: none;
  color: #AD4E02;
  opacity: 0.65;
}

/* ── Refresh icon button ──────────────────────────────────────────────────── */
.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid rgba(173, 78, 2, 0.22);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.78);
  color: #AD4E02;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  flex-shrink: 0;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(173, 78, 2, 0.10);
  border-color: rgba(173, 78, 2, 0.48);
}

.refresh-btn:active:not(:disabled) { transform: scale(0.90); }
.refresh-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* Spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.spin {
  animation: spin 0.75s linear infinite;
  transform-origin: center;
  display: block;
}

/* ── Body ─────────────────────────────────────────────────────────────────── */
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
  align-items: flex-start;
  padding: 12px 14px;
  gap: 8px;
  font-size: 13px;
  color: #C0392B;
  text-align: left;
}

/* Placeholder */
.preview-placeholder { color: var(--color-neutral-600, #606060); }
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
