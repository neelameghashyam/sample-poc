<script setup lang="ts">
/**
 * TgDocPreviewView.vue
 *
 * Route: /test-guidelines/:id/preview
 *
 * Full-page document preview for a test guideline, loaded via:
 *   FE → Node BE (/api/test-guidelines/:id/doc-gen-preview?lang=en)
 *      → Java API  (http://<JAVA_API_BASE>/doc-gen-preview/:id?lang=en)
 *
 * The user lands here by clicking a row in TestGuidelinesTable.
 * The Edit button navigates to /admin/test-guidelines/:id (the editor).
 */
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { editorApi } from '@/services/editor-api';

const route  = useRoute();
const router = useRouter();

// ── Route param ───────────────────────────────────────────────────────────────
const tgId = ref<number>(Number(route.params.id));

// ── State ─────────────────────────────────────────────────────────────────────
const previewHtml  = ref<string | null>(null);
const loading      = ref(false);
const error        = ref<string | null>(null);
const selectedLang = ref('en');

const languages = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'zh', label: '中文' },
];

// ── Load preview ──────────────────────────────────────────────────────────────
async function loadPreview() {
  if (!tgId.value) return;

  loading.value     = true;
  error.value       = null;
  previewHtml.value = null;

  try {
    previewHtml.value = await editorApi.docGenPreview(tgId.value, selectedLang.value);
  } catch (err: any) {
    error.value =
      err?.response?.data?.error?.message ||
      'Failed to load document preview. Please try again.';
    console.error('TgDocPreviewView load error:', err);
  } finally {
    loading.value = false;
  }
}

// Reload on language change
watch(selectedLang, loadPreview);

// Initial load
onMounted(loadPreview);

// ── Navigation ────────────────────────────────────────────────────────────────
function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/test-guidelines/twp-drafts');
  }
}

function goToEditor() {
  router.push(`/admin/test-guidelines/${tgId.value}`);
}
</script>

<template>
  <div class="preview-page">

    <!-- Top bar -->
    <div class="preview-toolbar">
      <div class="preview-toolbar__left">
        <button class="toolbar-btn toolbar-btn--ghost" @click="goBack">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
          Back
        </button>

        <span class="preview-toolbar__divider" />

        <span class="preview-toolbar__title">Document Preview</span>
        <span class="preview-toolbar__id">#{{ tgId }}</span>
      </div>

      <div class="preview-toolbar__right">
        <!-- Language selector -->
        <select
          v-model="selectedLang"
          class="lang-select"
          :disabled="loading"
          aria-label="Preview language"
        >
          <option v-for="lang in languages" :key="lang.value" :value="lang.value">
            {{ lang.label }}
          </option>
        </select>

        <!-- Refresh -->
        <button
          class="toolbar-btn toolbar-btn--icon"
          :disabled="loading"
          title="Refresh preview"
          @click="loadPreview"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"
               :class="{ spin: loading }">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
        </button>

        <!-- Edit -->
        <button class="toolbar-btn toolbar-btn--primary" @click="goToEditor">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
          </svg>
          Edit
        </button>
      </div>
    </div>

    <!-- Content area -->
    <div class="preview-content-wrap">

      <!-- Loading -->
      <div v-if="loading" class="preview-state">
        <div class="preview-spinner" />
        <p>Loading document preview…</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="preview-state preview-state--error">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>{{ error }}</p>
        <button class="toolbar-btn toolbar-btn--primary" @click="loadPreview">
          Retry
        </button>
      </div>

      <!-- Document HTML from Java -->
      <div
        v-else-if="previewHtml"
        class="preview-document"
        v-html="previewHtml"
      />

      <!-- Empty -->
      <div v-else class="preview-state">
        <p>No preview available.</p>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ── Page shell ───────────────────────────────────────────────────────────── */
.preview-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--color-bg, #f3f4f6);
}

/* ── Toolbar ──────────────────────────────────────────────────────────────── */
.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 24px;
  background: var(--color-surface, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.preview-toolbar__left,
.preview-toolbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-toolbar__divider {
  width: 1px;
  height: 20px;
  background: var(--color-border, #e5e7eb);
}

.preview-toolbar__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
}

.preview-toolbar__id {
  font-size: 0.8125rem;
  color: var(--color-text-secondary, #6b7280);
}

/* ── Buttons ──────────────────────────────────────────────────────────────── */
.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--color-border, #d1d5db);
  background: var(--color-surface, #fff);
  color: var(--color-text-primary, #374151);
  transition: background 0.15s, border-color 0.15s;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--color-surface-hover, #f3f4f6);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn--ghost {
  border-color: transparent;
  background: transparent;
  color: var(--color-text-secondary, #6b7280);
}

.toolbar-btn--ghost:hover {
  background: var(--color-surface-hover, #f3f4f6);
  color: var(--color-text-primary, #374151);
}

.toolbar-btn--icon {
  padding: 6px;
}

.toolbar-btn--primary {
  background: var(--color-primary, #2563eb);
  border-color: var(--color-primary, #2563eb);
  color: #fff;
}

.toolbar-btn--primary:hover:not(:disabled) {
  background: var(--color-primary-hover, #1d4ed8);
  border-color: var(--color-primary-hover, #1d4ed8);
}

/* ── Language select ──────────────────────────────────────────────────────── */
.lang-select {
  font-size: 0.8125rem;
  padding: 6px 10px;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  background: var(--color-surface, #fff);
  color: var(--color-text-primary, #111827);
  cursor: pointer;
  outline: none;
}

.lang-select:focus {
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.lang-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Content wrapper ──────────────────────────────────────────────────────── */
.preview-content-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 32px 24px;
}

/* ── States ───────────────────────────────────────────────────────────────── */
.preview-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 300px;
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.9rem;
}

.preview-state--error {
  color: var(--color-danger, #dc2626);
}

/* ── Spinner ──────────────────────────────────────────────────────────────── */
.preview-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border, #e5e7eb);
  border-top-color: var(--color-primary, #2563eb);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 0.7s linear infinite;
}

/* ── Document body (HTML from Java) ──────────────────────────────────────── */
.preview-document {
  max-width: 860px;
  margin: 0 auto;
  background: var(--color-surface, #fff);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  padding: 48px 56px;
  font-family: var(--font-family-document, Georgia, serif);
  font-size: 0.9375rem;
  line-height: 1.75;
  color: var(--color-text-primary, #111827);
}

:deep(.preview-document) h1,
:deep(.preview-document) h2,
:deep(.preview-document) h3,
:deep(.preview-document) h4 {
  font-family: var(--font-family-sans, system-ui, sans-serif);
  font-weight: 600;
  margin: 1.4em 0 0.5em;
  line-height: 1.3;
}

:deep(.preview-document) p {
  margin: 0.75em 0;
}

:deep(.preview-document) table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.25em 0;
  font-size: 0.875rem;
}

:deep(.preview-document) th,
:deep(.preview-document) td {
  border: 1px solid var(--color-border, #e5e7eb);
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
}

:deep(.preview-document) th {
  background: var(--color-surface-raised, #f9fafb);
  font-weight: 600;
}

:deep(.preview-document) ul,
:deep(.preview-document) ol {
  padding-left: 1.5em;
  margin: 0.75em 0;
}

@media (max-width: 640px) {
  .preview-document {
    padding: 24px 20px;
  }
}
</style>