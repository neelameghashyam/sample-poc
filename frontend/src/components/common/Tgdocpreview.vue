<script setup lang="ts">
/**
 * TgDocPreviewView.vue
 *
 * Route: /test-guidelines/:id/preview
 *
 * Renders the Java doc-gen HTML via a sandboxed iframe so the browser's
 * own layout engine handles pagination — no manual splitting, no height
 * measurement, no page-count mismatch.
 *
 * Why iframe?
 *  • @page / page-break CSS is honoured by the browser natively
 *  • pt units resolve correctly inside the iframe's own document context
 *  • Fonts & images are fully loaded before layout is computed
 *  • Matches Word output far more closely than any JS-based split
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
const iframeRef    = ref<HTMLIFrameElement | null>(null);
const iframeHeight = ref(1200); // px — grows after iframe load event

// ── Styles injected into the iframe document ──────────────────────────────────
//
// These are appended to whatever <head> the Java API returns (or prepended if
// the response is a fragment).  They set up:
//   • @page  — A4 size + margins (used by browser print engine)
//   • body   — 794 px wide (A4 @ 96 dpi), correct base font
//   • visual page-break dividers rendered on screen via ::before pseudo
//
const INJECTED_STYLES = `
<style id="__preview-overrides__">
  /* ── Page geometry ─────────────────────────────────────────────── */
  @page {
    size: A4;
    margin: 1.5cm;
  }

  /* ── Base document ─────────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; }

  html {
    background: #f0f0f0;
  }

  body {
    font-family: Arial, 'Times New Roman', sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #000;

    /* A4 @ 96 dpi with 1.5 cm margins (≈ 56.7 px each side) */
    width: 794px;
    margin: 32px auto;
    padding: 56.7px;
    background: #fff;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
    border: 1px solid #e0e0e0;
    border-radius: 2px;
  }

  /* ── Tables ────────────────────────────────────────────────────── */
  table  { border-collapse: collapse; max-width: 100%; }
  td, th { vertical-align: top; }

  /* ── Images ────────────────────────────────────────────────────── */
  img { max-width: 100%; height: auto; }

  /* ── Paragraphs — honour inline pt margin/padding from Java ────── */
  p { margin: 0; padding: 0; }

  /* ── Page-break markers → visible dividers on screen ───────────── */
  /*
   * The Java API emits:
   *   <br style="clear:both; page-break-before:always" />
   * We render those as visual horizontal rules so the user can see
   * where each page starts, without any JS splitting.
   */
  br[style*="page-break-before"],
  br[style*="page-break-after"] {
    display: block;
    height: 0;
    margin: 32px -56.7px;        /* bleed to body edges */
    border: none;
    border-top: 2px dashed #d0d0d0;
    position: relative;
  }

  br[style*="page-break-before"]::after,
  br[style*="page-break-after"]::after {
    content: 'page break';
    position: absolute;
    top: -9px;
    left: 50%;
    transform: translateX(-50%);
    background: #f0f0f0;
    color: #aaa;
    font-size: 9px;
    font-family: Arial, sans-serif;
    padding: 0 8px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  /* ── Strip Section wrapper's own page-break declarations ───────── */
  [class^="Section"] {
    page-break-before: unset !important;
    clear: unset !important;
  }
</style>
`;

// ── Build the full srcdoc string fed to the iframe ────────────────────────────
//
// Strategy:
//   1. If the API returned a full XHTML/HTML document → inject styles into <head>
//   2. If the API returned a fragment               → wrap in a minimal HTML shell
//
const framedHtml = computed<string>(() => {
  if (!previewHtml.value) return '';

  const html = previewHtml.value;

  // Full document — splice our overrides just before </head>
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${INJECTED_STYLES}</head>`);
  }

  // Fragment — build a minimal wrapper
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${INJECTED_STYLES}
</head>
<body>${html}</body>
</html>`;
});

// ── Auto-resize iframe to its content height ──────────────────────────────────
//
// Called on the iframe's load event.  We read scrollHeight from the iframe's
// document body and update our reactive height — this avoids a fixed-height
// clip while also avoiding a scrollbar inside the frame.
//
function onIframeLoad() {
  const frame = iframeRef.value;
  if (!frame) return;

  try {
    const body = frame.contentDocument?.body;
    if (body) {
      // Add a small bottom buffer so the last page's shadow is fully visible
      iframeHeight.value = body.scrollHeight + 64;
    }
  } catch {
    // Cross-origin guard — shouldn't happen with srcdoc but be safe
  }
}

// ── Load preview ──────────────────────────────────────────────────────────────
async function loadPreview() {
  if (!tgId.value) return;

  loading.value     = true;
  error.value       = null;
  previewHtml.value = null;
  iframeHeight.value = 1200;

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

    <!--
      ── iframe document viewer ─────────────────────────────────────────────
      The browser's own layout engine renders the full document.
      No JS splitting, no height measurement — just real CSS pagination.

      • srcdoc feeds the full HTML + injected styles
      • @load auto-sizes the frame to content height (no inner scroll bar)
      • sandbox="allow-same-origin" lets us read scrollHeight; scripts are
        intentionally excluded (doc content needs no JS)
    -->
    <div v-else-if="framedHtml" class="doc-viewer">
      <iframe
        ref="iframeRef"
        class="doc-frame"
        :srcdoc="framedHtml"
        :style="{ height: iframeHeight + 'px' }"
        sandbox="allow-same-origin"
        title="Document preview"
        @load="onIframeLoad"
      />
    </div>

    <!-- Empty fallback -->
    <div v-else class="preview-error">
      <p>No preview available for this test guideline.</p>
    </div>

  </div>
</template>

<style scoped>
/* ── Reset ─────────────────────────────────────────────────────────────────── */
.preview-root *, .preview-root *::before, .preview-root *::after { box-sizing: border-box; }
.preview-root h1, .preview-root h2, .preview-root h3, .preview-root p { margin: 0; padding: 0; }

/* ── Root shell ────────────────────────────────────────────────────────────── */
.preview-root {
  font-family: 'Figtree', sans-serif;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: var(--color-neutral-800);
}

/* ── Top bar ───────────────────────────────────────────────────────────────── */
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

/* ── Loading skeleton — two A4 outlines ────────────────────────────────────── */
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

/* ── Error / empty state ───────────────────────────────────────────────────── */
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

/* ── Grey canvas wrapping the iframe ──────────────────────────────────────── */
.doc-viewer {
  background: #f0f0f0;
  padding: 32px 24px;
  border-radius: 8px;
  flex: 1;

  /* Centre the iframe; let it overflow horizontally on small screens */
  overflow-x: auto;
  display: flex;
  justify-content: center;
}

/* ── The iframe itself ────────────────────────────────────────────────────── */
/*
 * Width matches A4 @ 96 dpi (794 px) + room for the body shadow inside.
 * Height is set inline via iframeHeight reactive ref so it grows to fit
 * the document once loaded — no inner scrollbar.
 *
 * border:none removes the default iframe border; the "paper" shadow
 * is applied inside the iframe via the injected body styles.
 */
.doc-frame {
  width: 858px;   /* 794 px content + ~32 px each side for body shadow/margin */
  border: none;
  display: block;
  flex-shrink: 0;
  transition: height 0.2s ease;
}

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .doc-frame,
  .skel-page {
    width: 100%;
    min-height: unset;
  }

  .preview-topbar__spacer {
    display: none;
  }

  .preview-topbar__title {
    text-align: left;
  }
}
</style>