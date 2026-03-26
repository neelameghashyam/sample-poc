<script setup lang="ts">
/**
 * TgDocPreviewView.vue
 *
 * Route: /test-guidelines/:id/preview
 *
 * Renders the Java doc-gen XHTML as real A4 pages.
 *
 * How it works:
 *  1. API returns full XHTML with <div class="SectionN"> per page (12 pages).
 *  2. We extract <body> content and split on each SectionN div.
 *  3. All `pt` units are converted to `px` (1pt = 1.3333px at 96dpi) so
 *     inline styles render at correct Word-equivalent sizes in the browser.
 *  4. Each converted chunk is rendered inside its own A4 .doc-page container.
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
const previewHtml = ref<string | null>(null);
const loading     = ref(false);
const error       = ref<string | null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract only the <body> inner content from a full XHTML document string. */
function extractBody(html: string): string {
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1] : html;
}

/**
 * Convert all `Xpt` values in inline styles to `Xpx`.
 * The Java renderer uses pt units sized for Word/PDF (72dpi).
 * Browsers render at 96dpi, so: 1pt = 96/72 ≈ 1.3333px.
 */
function convertPtToPx(html: string): string {
  return html.replace(/([\d.]+)pt/g, (_match, val) => {
    const px = Math.round(parseFloat(val) * 96 / 72 * 100) / 100;
    return `${px}px`;
  });
}

/**
 * Strip page-break and clear styles from SectionN wrappers —
 * we handle page separation ourselves via .doc-page containers.
 */
function cleanSectionStyles(html: string): string {
  return html
    .replace(/page-break-before:\s*always/g, '')
    .replace(/clear:\s*both;?\s*/g, '');
}

// ── Pages computed ────────────────────────────────────────────────────────────
/**
 * Split the body HTML into one chunk per SectionN div,
 * convert pt→px, and strip redundant page-break styles.
 * Falls back to rendering everything as a single page if no sections found.
 */
const pages = computed<string[]>(() => {
  if (!previewHtml.value) return [];

  const body = extractBody(previewHtml.value);

  // Split just before each <div class="SectionN"> so every chunk owns its div
  const raw = body
    .split(/(?=<div\s+class="Section\d+")/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const chunks = raw.length > 0 ? raw : [body];

  return chunks.map(chunk => cleanSectionStyles(convertPtToPx(chunk)));
});

// ── API ───────────────────────────────────────────────────────────────────────
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

    <!-- Loading — looks like 2 A4 sheets loading -->
    <div v-if="loading" class="doc-viewer">
      <div class="skel-page">
        <Skeleton width="50%" height="24px" />
        <Skeleton width="70%" height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="85%"  height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="60%"  height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="90%"  height="14px" />
      </div>
      <div class="skel-page">
        <Skeleton width="100%" height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="75%"  height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="55%"  height="14px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="80%"  height="14px" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="preview-error">
      <p>{{ error }}</p>
      <Button type="tertiary" icon-left="refresh" @click="loadPreview">
        Try again
      </Button>
    </div>

    <!-- Document: one .doc-page per SectionN div -->
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

/* ── Root ─────────────────────────────────────────────────────────────────── */
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

/* ── Grey canvas (shared by skeleton + real pages) ────────────────────────── */
.doc-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #e8e8e8;
  padding: 40px 24px;
  border-radius: 8px;
  gap: 40px;   /* white gap between sheets */
  flex: 1;
}

/* ── Skeleton page shape ──────────────────────────────────────────────────── */
.skel-page {
  width: 794px;
  min-height: 500px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 2px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.10);
  padding: 56px 64px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Error / empty ────────────────────────────────────────────────────────── */
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

/* ── A4 page ──────────────────────────────────────────────────────────────── */
/*
 * A4 at 96dpi = 794 × 1123px (matches 595.3pt × 841.9pt from body style).
 * font-size is NOT set here — we let the Java inline styles control it
 * (they already use 10pt → 13.33px after our pt→px conversion).
 * overflow:hidden clips anything that bleeds past the page edge.
 */
.doc-page {
  width: 794px;
  min-height: 1123px;
  background: #ffffff;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.13);
  border: 1px solid #d8d8d8;
  border-radius: 2px;
  overflow: hidden;

  /* The Java HTML sets its own margins via inline styles on child elements.
     We add a small safety padding so nothing touches the edge. */
  padding: 0;
}

/* ── Deep: normalize injected content ────────────────────────────────────── */

/* Images should never overflow the page */
.doc-page :deep(img) {
  max-width: 100%;
  height: auto;
}

/* Tables use the Java-supplied widths; just prevent overflow */
.doc-page :deep(table) {
  border-collapse: collapse;
  max-width: 100%;
}

/* Strip any remaining page-break directives inside pages */
.doc-page :deep([class^="Section"]) {
  page-break-before: unset !important;
}

/* Hide leftover <br page-break> markers (already split into pages) */
.doc-page :deep(br[style*="page-break-before"]) {
  display: none;
}

/* Preserve Word-like paragraph spacing from inline styles */
.doc-page :deep(p) {
  margin: 0;
  padding: 0;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .doc-page,
  .skel-page {
    width: 100%;
    min-height: unset;
    overflow-x: auto;
  }

  .preview-topbar__spacer { display: none; }
  .preview-topbar__title  { text-align: left; }
}
</style>