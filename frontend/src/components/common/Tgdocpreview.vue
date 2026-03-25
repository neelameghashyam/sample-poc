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
import { Button, Card, Skeleton, useToast } from 'upov-ui';
import { editorApi } from '@/services/editor-api';

const route  = useRoute();
const router = useRouter();
const toast  = useToast();

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
    const message =
      err?.response?.data?.error?.message ||
      'Failed to load document preview. Please try again.';
    error.value = message;
    toast.show(message, { variant: 'error' });
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
function backToDashboard() {
  router.push({ name: 'admin-test-guidelines' });
}

function goToEditor() {
  router.push(`/admin/test-guidelines/${tgId.value}`);
}
</script>

<template>
  <div class="preview-root">

    <!-- Top bar — mirrors .editor-topbar pattern from EditorView -->
    <div class="preview-topbar">
      <Button type="tertiary" icon-left="arrow-left" @click="backToDashboard">
        Back to TG Dashboard
      </Button>

      <div class="preview-topbar__meta">
        <span class="preview-topbar__title">Document Preview</span>
        <span class="preview-topbar__id">#{{ tgId }}</span>
      </div>

      <div class="preview-topbar__actions">
        <!-- Language selector -->
        <select
          v-model="selectedLang"
          class="preview-lang-select"
          :disabled="loading"
          aria-label="Preview language"
        >
          <option v-for="lang in languages" :key="lang.value" :value="lang.value">
            {{ lang.label }}
          </option>
        </select>

        <!-- Refresh — tertiary icon button -->
        <Button
          type="tertiary"
          icon-left="refresh"
          :disabled="loading"
          :loading="loading"
          @click="loadPreview"
        >
          Refresh
        </Button>

        <!-- Edit — primary action, same as EditorHeader submit -->
        <Button type="primary" icon-left="pencil" @click="goToEditor">
          Edit
        </Button>
      </div>
    </div>

    <!-- Loading skeleton — mirrors .skel pattern from EditorView -->
    <div v-if="loading" class="skel">
      <div class="skel-header">
        <Skeleton width="35%" height="20px" />
        <Skeleton width="55%" height="14px" />
        <Skeleton width="45%" height="14px" />
      </div>
      <div class="skel-body">
        <Skeleton width="100%" height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="80%"  height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="60%"  height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="90%"  height="14px" />
      </div>
    </div>

    <!-- Error state — mirrors .editor-error pattern from EditorView -->
    <div v-else-if="error" class="preview-error">
      <p>{{ error }}</p>
      <Button type="tertiary" icon-left="refresh" @click="loadPreview">
        Try again
      </Button>
    </div>

    <!-- Document HTML rendered inside a Card — mirrors EditorHeader Card usage -->
    <Card v-else-if="previewHtml" elevation="low" padding="none" class="preview-card">
      <div class="preview-document" v-html="previewHtml" />
    </Card>

    <!-- Empty fallback -->
    <div v-else class="preview-error">
      <p>No preview available for this test guideline.</p>
    </div>

  </div>
</template>

<style scoped>
/* ── Reset (same pattern as EditorView) ───────────────────────────────────── */
.preview-root *, .preview-root *::before, .preview-root *::after { box-sizing: border-box; }
.preview-root h1, .preview-root h2, .preview-root h3, .preview-root p { margin: 0; padding: 0; }

/* ── Root shell ───────────────────────────────────────────────────────────── */
.preview-root {
  font-family: 'Figtree', sans-serif;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: var(--color-neutral-800);
}

/* ── Top bar — mirrors .editor-topbar ─────────────────────────────────────── */
.preview-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.preview-topbar__meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.preview-topbar__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary-green-dark);
  white-space: nowrap;
}

.preview-topbar__id {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-neutral-500);
  white-space: nowrap;
}

.preview-topbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Language select — styled to sit alongside upov-ui Buttons ───────────── */
.preview-lang-select {
  height: 36px;
  padding: 0 10px;
  font-family: 'Figtree', sans-serif;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--color-neutral-300, #d1d5db);
  border-radius: 6px;
  background: var(--color-neutral-0, #fff);
  color: var(--color-neutral-800, #1f2937);
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}

.preview-lang-select:focus {
  border-color: var(--color-primary-green-dark);
  box-shadow: 0 0 0 2px rgba(28, 66, 64, 0.12);
}

.preview-lang-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Loading skeleton — mirrors .skel from EditorView ─────────────────────── */
.skel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.skel-header {
  background: var(--color-neutral-0, #fff);
  border-radius: 8px;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.skel-body {
  background: var(--color-neutral-0, #fff);
  border-radius: 8px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Error state — mirrors .editor-error from EditorView ─────────────────── */
.preview-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 64px 0;
  color: var(--color-danger, #D32F2F);
  font-size: 15px;
  text-align: center;
}

/* ── Card wrapping the document ──────────────────────────────────────────── */
.preview-card {
  flex: 1;
}

/* ── Document HTML rendered by Java ─────────────────────────────────────── */
.preview-document {
  max-width: 860px;
  margin: 0 auto;
  padding: 48px 56px;
  font-family: Georgia, serif;
  font-size: 15px;
  line-height: 1.75;
  color: var(--color-neutral-800, #1f2937);
}

:deep(.preview-document) h1,
:deep(.preview-document) h2,
:deep(.preview-document) h3,
:deep(.preview-document) h4 {
  font-family: 'Figtree', sans-serif;
  font-weight: 600;
  color: var(--color-primary-green-dark);
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
  font-size: 14px;
}

:deep(.preview-document) th,
:deep(.preview-document) td {
  border: 1px solid var(--color-neutral-200, #e5e7eb);
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
}

:deep(.preview-document) th {
  background: var(--color-neutral-50, #f9fafb);
  font-family: 'Figtree', sans-serif;
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