<script setup lang="ts">
/**
 * TgDocPreview.vue
 *
 * Full-document preview panel shown when a user clicks a row in the
 * TestGuidelinesTable. Fetches via:
 *   FE → Node BE (/api/test-guidelines/:id/doc-gen-preview)
 *      → Java API (http://<JAVA_API_BASE>/doc-gen-preview/:id)
 *
 * Usage:
 *   <TgDocPreview :tg-id="selectedId" @close="selectedId = null" @edit="goToEditor" />
 */
import { ref, watch } from 'vue';
import { editorApi } from '@/services/editor-api';

const props = defineProps<{
  tgId: number | null;
  tgReference?: string;
  tgName?: string;
}>();

const emit = defineEmits<{
  close: [];
  edit: [id: number];
}>();

// ── State ─────────────────────────────────────────────────────────────────────
const previewHtml = ref<string | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
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
  if (!props.tgId) return;

  loading.value = true;
  error.value = null;
  previewHtml.value = null;

  try {
    previewHtml.value = await editorApi.docGenPreview(props.tgId, selectedLang.value);
  } catch (err: any) {
    error.value =
      err?.response?.data?.error?.message ||
      'Failed to load document preview. Please try again.';
    console.error('TgDocPreview load error:', err);
  } finally {
    loading.value = false;
  }
}

// Reload when tgId changes (row selected) or language changes
watch(() => props.tgId, (id) => { if (id) loadPreview(); }, { immediate: true });
watch(selectedLang, () => { if (props.tgId) loadPreview(); });

function handleEdit() {
  if (props.tgId) emit('edit', props.tgId);
}

function handleClose() {
  emit('close');
}
</script>

<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <div v-if="tgId" class="tg-preview-backdrop" @click.self="handleClose">
      <div class="tg-preview-panel" role="dialog" aria-modal="true" :aria-label="`Preview: ${tgReference || tgId}`">

        <!-- Header -->
        <div class="tg-preview-header">
          <div class="tg-preview-header__info">
            <span class="tg-preview-header__ref">{{ tgReference }}</span>
            <span v-if="tgName" class="tg-preview-header__name">{{ tgName }}</span>
          </div>

          <div class="tg-preview-header__controls">
            <!-- Language selector -->
            <select
              v-model="selectedLang"
              class="tg-preview-lang-select"
              :disabled="loading"
              aria-label="Preview language"
            >
              <option v-for="lang in languages" :key="lang.value" :value="lang.value">
                {{ lang.label }}
              </option>
            </select>

            <!-- Refresh button -->
            <button
              class="tg-preview-btn tg-preview-btn--icon"
              :disabled="loading"
              title="Refresh preview"
              @click="loadPreview"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16" height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                :class="{ 'spin': loading }"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            </button>

            <!-- Edit button -->
            <button
              class="tg-preview-btn tg-preview-btn--edit"
              @click="handleEdit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14" height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
              Edit
            </button>

            <!-- Close button -->
            <button
              class="tg-preview-btn tg-preview-btn--icon tg-preview-btn--close"
              title="Close preview"
              @click="handleClose"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18" height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="tg-preview-body">

          <!-- Loading state -->
          <div v-if="loading" class="tg-preview-state">
            <div class="tg-preview-spinner" />
            <p class="tg-preview-state__text">Loading document preview…</p>
          </div>

          <!-- Error state -->
          <div v-else-if="error" class="tg-preview-state tg-preview-state--error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32" height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p class="tg-preview-state__text">{{ error }}</p>
            <button class="tg-preview-btn tg-preview-btn--edit" @click="loadPreview">
              Retry
            </button>
          </div>

          <!-- Preview HTML -->
          <div
            v-else-if="previewHtml"
            class="tg-preview-content"
            v-html="previewHtml"
          />

          <!-- Empty -->
          <div v-else class="tg-preview-state">
            <p class="tg-preview-state__text">No preview available.</p>
          </div>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Backdrop ─────────────────────────────────────────────────────────────── */
.tg-preview-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* ── Panel ────────────────────────────────────────────────────────────────── */
.tg-preview-panel {
  background: var(--color-surface, #fff);
  border-radius: 12px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  width: 100%;
  max-width: 960px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header ───────────────────────────────────────────────────────────────── */
.tg-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  flex-shrink: 0;
}

.tg-preview-header__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tg-preview-header__ref {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tg-preview-header__name {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tg-preview-header__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Language select ──────────────────────────────────────────────────────── */
.tg-preview-lang-select {
  font-size: 0.8125rem;
  padding: 5px 10px;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  background: var(--color-surface, #fff);
  color: var(--color-text-primary, #111827);
  cursor: pointer;
  outline: none;
}

.tg-preview-lang-select:focus {
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.tg-preview-lang-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Buttons ──────────────────────────────────────────────────────────────── */
.tg-preview-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  background: var(--color-surface, #fff);
  color: var(--color-text-primary, #374151);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.tg-preview-btn:hover:not(:disabled) {
  background: var(--color-surface-hover, #f3f4f6);
}

.tg-preview-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tg-preview-btn--icon {
  padding: 6px;
  border-radius: 6px;
}

.tg-preview-btn--edit {
  background: var(--color-primary, #2563eb);
  border-color: var(--color-primary, #2563eb);
  color: #fff;
}

.tg-preview-btn--edit:hover:not(:disabled) {
  background: var(--color-primary-hover, #1d4ed8);
  border-color: var(--color-primary-hover, #1d4ed8);
}

.tg-preview-btn--close {
  border-color: transparent;
  color: var(--color-text-secondary, #6b7280);
}

.tg-preview-btn--close:hover {
  background: var(--color-surface-hover, #f3f4f6);
  color: var(--color-text-primary, #374151);
}

/* ── Body ─────────────────────────────────────────────────────────────────── */
.tg-preview-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* ── States ───────────────────────────────────────────────────────────────── */
.tg-preview-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  min-height: 200px;
  color: var(--color-text-secondary, #6b7280);
}

.tg-preview-state--error {
  color: var(--color-danger, #dc2626);
}

.tg-preview-state__text {
  font-size: 0.9rem;
  text-align: center;
  max-width: 400px;
}

/* ── Spinner ──────────────────────────────────────────────────────────────── */
.tg-preview-spinner {
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

/* ── Preview content ──────────────────────────────────────────────────────── */
.tg-preview-content {
  font-family: var(--font-family-document, Georgia, serif);
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--color-text-primary, #111827);
  max-width: 800px;
  margin: 0 auto;
}

/* Unscoped document HTML styles passed through */
:deep(.tg-preview-content) h1,
:deep(.tg-preview-content) h2,
:deep(.tg-preview-content) h3 {
  margin: 1.25em 0 0.5em;
  font-weight: 600;
}

:deep(.tg-preview-content) p {
  margin: 0.75em 0;
}

:deep(.tg-preview-content) table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

:deep(.tg-preview-content) th,
:deep(.tg-preview-content) td {
  border: 1px solid var(--color-border, #e5e7eb);
  padding: 8px 12px;
  text-align: left;
}

:deep(.tg-preview-content) th {
  background: var(--color-surface-raised, #f9fafb);
  font-weight: 600;
}
</style>