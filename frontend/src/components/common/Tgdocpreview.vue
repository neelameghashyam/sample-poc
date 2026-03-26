<script setup lang="ts">
/**
 * TgDocPreviewView.vue
 *
 * Route: /test-guidelines/:id/preview
 *
 * Renders the Java doc-gen HTML as real A4 pages.
 * The API returns <div class="SectionN"> elements — each one is a page.
 * We split on those and render each inside its own .doc-page container.
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

// ── Extract body content from full XHTML document ────────────────────────────
function extractBody(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : html;
}

// ── Split into pages on <div class="SectionN"> boundaries ────────────────────
// The Java API wraps each page in <div class="Section0">, <div class="Section1">, etc.
const pages = computed(() => {
  if (!previewHtml.value) return [];

  const body = extractBody(previewHtml.value);

  // Split just before each SectionN div so every chunk starts with its own div
  const parts = body
    .split(/(?=<div\s+class="Section\d+")/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // Fallback: if no sections found, render as single page
  return parts.length > 0 ? parts : [body];
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
      <div class="skel-page">
        <Skeleton width="40%" height="22px" />
        <Skeleton width="60%" height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="80%"  height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="55%"  height="14px" />
      </div>
      <div class="skel-page">
        <Skeleton width="100%" height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="70%"  height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="90%"  height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="50%"  height="14px" />
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="preview-error">
      <p>{{ error }}</p>
      <Button type="tertiary" icon-left="refresh" @click="loadPreview">
        Try again
      </Button>
    </div>

    <!-- A4 paginated document viewer — one .doc-page per SectionN div -->
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
  flex-shrink: 0;
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

/* ── Loading skeleton — looks like 2 A4 pages loading ────────────────────── */
.skel {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f0f0f0;
  padding: 32px 24px;
  border-radius: 8px;
  gap: 32px;
  flex: 1;
}

.skel-page {
  width: 794px;
  min-height: 400px;
  background: #fff;
  border: 1px solid #e2e2e2;
  border-radius: 2px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.10);
  padding: 48px 56px;
  display: flex;
  flex-direction: column;
  gap: 18px;
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

/* ── Grey canvas that holds all A4 pages ─────────────────────────────────── */
.doc-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f0f0f0;
  padding: 32px 24px;
  border-radius: 8px;
  gap: 32px;       /* visible gap between pages */
  flex: 1;
}

/* ── Single A4 page ───────────────────────────────────────────────────────── */
/*
 * A4 at 96 dpi = 794 × 1123 px
 * The Java API uses pt units internally (595.3pt × 841.9pt)
 * We set font-size:10pt as baseline so pt values in inline styles scale correctly.
 * overflow: hidden keeps content inside the page boundary.
 */
.doc-page {
  width: 794px;
  min-height: 1123px;
  background: #ffffff;
  padding: 56.7px;        /* 1.5cm ≈ 56.7px at 96dpi — matches Word default */
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #e0e0e0;
  border-radius: 2px;

  /* Base font matches the Java-generated content */
  font-family: Arial, 'Times New Roman', sans-serif;
  font-size: 10pt;
  line-height: 1.5;
  color: #000;

  overflow: hidden;
  overflow-wrap: break-word;
  word-break: break-word;
}

/* ── Deep styles for injected HTML ───────────────────────────────────────── */

/* Tables */
.doc-page :deep(table) {
  border-collapse: collapse;
  max-width: 100%;
}

.doc-page :deep(td),
.doc-page :deep(th) {
  vertical-align: top;
}

/* Images */
.doc-page :deep(img) {
  max-width: 100%;
  height: auto;
}

/* Paragraphs — preserve inline margin/padding from Java styles */
.doc-page :deep(p) {
  margin: 0;
  padding: 0;
}

/* Strip the SectionN page-break style — we handle it via .doc-page container */
.doc-page :deep([class^="Section"]) {
  page-break-before: unset !important;
  clear: unset !important;
}

/* Respect any remaining br page-break hints */
.doc-page :deep(br[style*="page-break-before:always"]) {
  display: none; /* already split into separate pages */
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .doc-page,
  .skel-page {
    width: 100%;
    min-height: unset;
    padding: 24px 16px;
  }

  .preview-topbar__spacer {
    display: none;
  }

  .preview-topbar__title {
    text-align: left;
  }
}
</style>