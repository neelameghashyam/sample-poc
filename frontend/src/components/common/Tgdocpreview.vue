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
 */
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button, Skeleton, useToast } from 'upov-ui';
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

// ── Split HTML into A4 pages on page-break markers ───────────────────────────
const pages = computed(() => {
  if (!previewHtml.value) return [];
  return previewHtml.value
    .split(/<br[^>]*page-break-before[^>]*>/gi)
    .map(p => p.trim())
    .filter(p => p.length > 0);
});

// ── Load preview ──────────────────────────────────────────────────────────────
async function loadPreview() {
  if (!tgId.value) return;

  loading.value     = true;
  error.value       = null;
  previewHtml.value = null;

  try {
    previewHtml.value = await editorApi.docGenPreview(tgId.value, 'en');
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

// Initial load
onMounted(loadPreview);

// ── Navigation ────────────────────────────────────────────────────────────────
function backToDashboard() {
  router.push({ name: 'admin-test-guidelines' });
}
</script>

<template>
  <div class="preview-root">

    <!-- Top bar -->
    <div class="preview-topbar">
      <Button type="tertiary" icon-left="arrow-left" @click="backToDashboard">
        Back to TG Dashboard
      </Button>
      <span class="preview-topbar__title">Document Preview</span>
      <div class="preview-topbar__spacer" />
    </div>

    <!-- Loading skeleton -->
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

    <!-- Error state -->
    <div v-else-if="error" class="preview-error">
      <p>{{ error }}</p>
      <Button type="tertiary" icon-left="refresh" @click="loadPreview">
        Try again
      </Button>
    </div>

    <!-- A4 paginated document viewer -->
    <div v-else-if="pages.length" class="doc-viewer">
      <div
        v-for="(page, index) in pages"
        :key="index"
        class="doc-page"
        v-html="page"
      />
    </div>

    <!-- Empty fallback -->
    <div v-else class="preview-error">
      <p>No preview available for this test guideline.</p>
    </div>

  </div>
</template>

<style scoped>
/* ── Reset ────────────────────────────────────────────────────────────────── */
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

/* ── Top bar ──────────────────────────────────────────────────────────────── */
.preview-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
}

.preview-topbar__title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary-green-dark);
  white-space: nowrap;
}

.preview-topbar__spacer {
  flex: 0 0 auto;
  width: 170px;
}

/* ── Loading skeleton ─────────────────────────────────────────────────────── */
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

/* ── Error / empty state ──────────────────────────────────────────────────── */
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

/* ── Document viewer — grey canvas holding all pages ─────────────────────── */
.doc-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f0f0f0;
  padding: 32px 24px;
  border-radius: 8px;
  gap: 32px;
  flex: 1;
}

/* ── Single A4 page ───────────────────────────────────────────────────────── */
.doc-page {
  width: 794px;           /* A4 at 96 dpi */
  min-height: 1123px;     /* A4 at 96 dpi */
  background: #ffffff;
  padding: 72px 80px;     /* ~2.54 cm margins */
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #e2e2e2;
  border-radius: 2px;

  font-family: Georgia, 'Times New Roman', serif;
  font-size: 15px;
  line-height: 1.75;
  color: #1f2937;

  overflow-wrap: break-word;
  word-break: break-word;
}

/* ── Styles applied to the injected HTML content ─────────────────────────── */
.doc-page :deep(h1),
.doc-page :deep(h2),
.doc-page :deep(h3),
.doc-page :deep(h4) {
  font-family: 'Figtree', sans-serif;
  font-weight: 600;
  color: var(--color-primary-green-dark, #1c4240);
  margin: 1.4em 0 0.5em;
  line-height: 1.3;
}

.doc-page :deep(p) {
  margin: 0.75em 0;
}

.doc-page :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.25em 0;
  font-size: 14px;
}

.doc-page :deep(th),
.doc-page :deep(td) {
  border: 1px solid #d1d5db;
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
}

.doc-page :deep(th) {
  background: #f9fafb;
  font-family: 'Figtree', sans-serif;
  font-weight: 600;
}

.doc-page :deep(ul),
.doc-page :deep(ol) {
  padding-left: 1.5em;
  margin: 0.75em 0;
}

.doc-page :deep(img) {
  max-width: 100%;
  height: auto;
}

/* Respect any leftover inline page-break hints from the API */
.doc-page :deep(br[style*="page-break-before"]) {
  display: block;
  page-break-before: always;
  break-before: page;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .doc-page {
    width: 100%;
    min-height: unset;
    padding: 32px 24px;
  }

  .preview-topbar__spacer {
    display: none;
  }

  .preview-topbar__title {
    text-align: left;
  }
}
</style>