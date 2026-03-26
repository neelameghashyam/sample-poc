<script setup lang="ts">
/**
 * TgDocPreviewView.vue
 *
 * Route: /test-guidelines/:id/preview
 *
 * Renders the Java doc-gen HTML via a sandboxed iframe.
 *
 * Pagination strategy — HYBRID (two passes):
 *
 *  Pass 1 — structural  (framedHtml computed, runs before iframe mounts)
 *    • Replace every <br page-break-before:always> the Java API emits with
 *      a real </div><div class="real-page"> boundary.
 *    • This handles TOC → body splits and any other explicit breaks.
 *
 *  Pass 2 — overflow correction  (SPLIT_SCRIPT, runs inside iframe on load)
 *    • After layout is complete the browser knows each .real-page's true
 *      rendered height.
 *    • Any page taller than MAX_PAGE_HEIGHT (1123 px = A4 @ 96 dpi) is
 *      split by moving its overflow children into a new .real-page placed
 *      immediately after it, repeating until the page fits.
 *    • A single child taller than the limit is left untouched (e.g. a huge
 *      table) — splitting mid-element would corrupt the DOM.
 *    • After all splits the script posts the final body scrollHeight back to
 *      the parent so the <iframe> resizes to show all pages without a
 *      scrollbar.
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
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
const iframeHeight = ref(1200);

// ── A4 @ 96 dpi ───────────────────────────────────────────────────────────────
// 297 mm × (96 px / 25.4 mm) = 1122.5 → 1123
const A4_HEIGHT_PX = 1123;
// padding-top + padding-bottom inside .real-page  (56.7 × 2)
const PAGE_PADDING_PX = 113;

// ── Styles injected into the iframe <head> ────────────────────────────────────
const INJECTED_STYLES = `
<style id="__preview-overrides__">
  @page { size: A4; margin: 1.5cm; }

  *, *::before, *::after { box-sizing: border-box; }

  html { background: #f0f0f0; }

  /*
   * body must NOT have a fixed width — each .real-page card carries it.
   * A fixed body width was the original cause of everything collapsing
   * into one single long page.
   */
  body {
    font-family: Arial, 'Times New Roman', sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #000;
    margin: 0;
    padding: 32px 24px;
    background: #f0f0f0;
  }

  /* ── A4 page card ────────────────────────────────────────────────── */
  .real-page {
    width: 794px;
    min-height: ${A4_HEIGHT_PX}px;
    margin: 0 auto 32px auto;
    padding: ${PAGE_PADDING_PX / 2}px;   /* 56.7 px each side */
    background: #fff;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
    border: 1px solid #e0e0e0;
    border-radius: 2px;
    overflow: hidden;

    page-break-after: always;
    break-after: page;
  }

  .real-page:last-child { margin-bottom: 0; }

  /* ── Tables ──────────────────────────────────────────────────────── */
  table  { border-collapse: collapse; max-width: 100%; }
  td, th { vertical-align: top; }

  /* ── Images ──────────────────────────────────────────────────────── */
  img { max-width: 100%; height: auto; }

  /* ── Paragraphs ──────────────────────────────────────────────────── */
  p { margin: 0; padding: 0; }

  /* ── Strip Section-wrapper page-break declarations ───────────────── */
  [class^="Section"] {
    page-break-before: unset !important;
    clear: unset !important;
  }
</style>
`;

// ── Pass 2: overflow-splitting script, runs inside the iframe ─────────────────
//
// Uses window.postMessage to send the final body height back to the Vue
// component so the <iframe> element can resize itself without a scrollbar.
//
const SPLIT_SCRIPT = `
<script>
(function () {
  var MAX_HEIGHT   = ${A4_HEIGHT_PX};
  var USABLE_HEIGHT = MAX_HEIGHT - ${PAGE_PADDING_PX}; /* subtract padding */

  /* ── Split one page if it overflows ─────────────────────────────── */
  function splitPage(page) {
    var safety = 0;

    while (page.scrollHeight > MAX_HEIGHT && safety < 200) {
      safety++;

      var children = Array.from(page.children);
      if (children.length <= 1) break; /* single child — cannot split safely */

      /*
       * Walk children forward, accumulating their heights.
       * The first child index that pushes us over USABLE_HEIGHT is
       * where we cut: everything from that index onward moves to a
       * new page inserted after the current one.
       */
      var cutIndex  = -1;
      var accum     = 0;

      for (var i = 0; i < children.length; i++) {
        var h = children[i].getBoundingClientRect().height;

        /* First child alone is already taller than usable area — bail */
        if (i === 0 && h > USABLE_HEIGHT) break;

        if (accum + h > USABLE_HEIGHT) {
          cutIndex = i;
          break;
        }
        accum += h;
      }

      if (cutIndex === -1) break; /* nothing to move */

      /* Move overflow children to a new page */
      var newPage = document.createElement('div');
      newPage.className = 'real-page';

      children.slice(cutIndex).forEach(function (child) {
        newPage.appendChild(child); /* moves the node */
      });

      page.after(newPage);
      /* While loop re-checks page.scrollHeight on next iteration */
    }
  }

  /* ── Walk all pages (including newly created ones) ───────────────── */
  function splitAllPages() {
    /*
     * querySelectorAll returns a static list — snapshot before we start
     * so we only process "first-generation" pages.  Each splitPage call
     * may insert new pages; those will be picked up because we re-query
     * after each outer iteration.
     */
    var processed = new Set();
    var found     = true;

    while (found) {
      found = false;
      document.querySelectorAll('.real-page').forEach(function (page) {
        if (!processed.has(page)) {
          processed.add(page);
          found = true;
          splitPage(page);
        }
      });
    }
  }

  /* ── Notify parent of final height so iframe resizes ────────────── */
  function notifyHeight() {
    window.parent.postMessage(
      { type: '__previewHeight__', height: document.body.scrollHeight },
      '*'
    );
  }

  window.addEventListener('load', function () {
    splitAllPages();
    notifyHeight();
  });
})();
<\/script>
`;

// ── Pass 1: replace explicit page-break <br> tags with container splits ───────
function injectPageContainers(html: string): string {
  return html.replace(
    /<br[^>]*page-break-before\s*:\s*always[^>]*\/?>/gi,
    '</div><div class="real-page">'
  );
}

// ── Build the full srcdoc string ──────────────────────────────────────────────
const framedHtml = computed<string>(() => {
  if (!previewHtml.value) return '';

  const html = previewHtml.value;

  // Full document (has </head>) → splice styles and wrap body
  if (/<\/head>/i.test(html)) {
    const withStyles = html.replace(/<\/head>/i, `${INJECTED_STYLES}</head>`);

    return withStyles.replace(
      /(<body[^>]*>)([\s\S]*)(<\/body>)/i,
      (_m, open, content, close) =>
        `${open}<div class="real-page">${injectPageContainers(content)}</div>${SPLIT_SCRIPT}${close}`
    );
  }

  // Fragment → build a minimal shell
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${INJECTED_STYLES}
</head>
<body>
  <div class="real-page">
    ${injectPageContainers(html)}
  </div>
  ${SPLIT_SCRIPT}
</body>
</html>`;
});

// ── Receive final height from SPLIT_SCRIPT via postMessage ────────────────────
function handleMessage(event: MessageEvent) {
  if (event.data?.type === '__previewHeight__') {
    iframeHeight.value = (event.data.height as number) + 64;
  }
}

// ── Fallback: initial height measurement on iframe load ───────────────────────
// Fires before SPLIT_SCRIPT finishes; prevents the frame from being clipped
// while the script is running.  postMessage will refine it afterward.
function onIframeLoad() {
  const frame = iframeRef.value;
  if (!frame) return;
  try {
    const body = frame.contentDocument?.body;
    if (body) iframeHeight.value = body.scrollHeight + 64;
  } catch {
    // cross-origin guard — safe with srcdoc
  }
}

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadPreview() {
  if (!tgId.value) return;

  loading.value      = true;
  error.value        = null;
  previewHtml.value  = null;
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

// ── Navigation ────────────────────────────────────────────────────────────────
function backToDashboard() {
  router.push({ name: 'admin-test-guidelines' });
}

onMounted(() => {
  window.addEventListener('message', handleMessage);
  loadPreview();
});

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage);
});
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
      sandbox must include BOTH flags:
        allow-same-origin → DOM access for SPLIT_SCRIPT
        allow-scripts     → script execution
    -->
    <div v-else-if="framedHtml" class="doc-viewer">
      <iframe
        ref="iframeRef"
        class="doc-frame"
        :srcdoc="framedHtml"
        :style="{ height: iframeHeight + 'px' }"
        sandbox="allow-same-origin allow-scripts"
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
.preview-root *, .preview-root *::before, .preview-root *::after { box-sizing: border-box; }
.preview-root h1, .preview-root h2, .preview-root h3, .preview-root p { margin: 0; padding: 0; }

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

/* ── Loading skeleton ──────────────────────────────────────────────────────── */
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

/* ── Grey canvas ───────────────────────────────────────────────────────────── */
.doc-viewer {
  background: #f0f0f0;
  padding: 32px 24px;
  border-radius: 8px;
  flex: 1;
  overflow-x: auto;
  display: flex;
  justify-content: center;
}

/* ── iframe ────────────────────────────────────────────────────────────────── */
.doc-frame {
  width: 858px;   /* 794 px + ~32 px each side for box-shadow clearance */
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

  .preview-topbar__spacer { display: none; }
  .preview-topbar__title  { text-align: left; }
}
</style>