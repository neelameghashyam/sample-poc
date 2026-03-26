<script setup lang="ts">
/**
 * TgDocPreviewView.vue
 *
 * Route: /test-guidelines/:id/preview
 *
 * Renders Java doc-gen HTML as real A4 pages using a height-based
 * layout engine — no dependency on page-break markers OR Section divs.
 *
 * PAGINATION STRATEGY (3-tier, most reliable first):
 *   1. PRIMARY   → page-break-before:always markers (fast path when present)
 *   2. SECONDARY → Height-based layout engine (real Word-like pagination)
 *   3. FALLBACK  → Render as single scrollable page
 *
 * TOC: extracted from the HTML and rendered as a floating side-panel navigator.
 */
import { ref, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button, Skeleton, useToast } from 'upov-ui';
import { editorApi } from '@/services/editor-api';

const route  = useRoute();
const router = useRouter();
const toast  = useToast();

// ── Route param ───────────────────────────────────────────────────────────────
const tgId = ref<number>(Number(route.params.id));

// ── A4 at 96 dpi ─────────────────────────────────────────────────────────────
const PAGE_WIDTH_PX  = 794;
const PAGE_HEIGHT_PX = 1123;
const PAGE_PADDING   = 56.7;   // 1.5 cm — matches Word default margin
const CONTENT_HEIGHT = PAGE_HEIGHT_PX - PAGE_PADDING * 2;

// ── State ─────────────────────────────────────────────────────────────────────
const pages      = ref<string[]>([]);
const loading    = ref(false);
const paginating = ref(false);
const error      = ref<string | null>(null);
const tocItems   = ref<{ id: string; label: string; level: number }[]>([]);
const tocOpen    = ref(false);

// ── Hidden off-screen measurement container ───────────────────────────────────
let measureEl: HTMLDivElement | null = null;

function getMeasureContainer(): HTMLDivElement {
  if (measureEl) return measureEl;
  measureEl = document.createElement('div');
  measureEl.style.cssText = `
    position: fixed;
    top: 0;
    left: -9999px;
    width: ${PAGE_WIDTH_PX - PAGE_PADDING * 2}px;
    font-family: Arial, 'Times New Roman', sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    visibility: hidden;
    pointer-events: none;
    z-index: -1;
  `;
  document.body.appendChild(measureEl);
  return measureEl;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractBody(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match ? match[1] : html;
}

function isPageBreakBr(el: HTMLElement): boolean {
  return (
    el.tagName === 'BR' &&
    (el.getAttribute('style') ?? '').includes('page-break')
  );
}

// ── TOC extraction ────────────────────────────────────────────────────────────
function extractToc(body: string) {
  const matches = [
    ...body.matchAll(
      /<p[^>]*class="TOC-(\d+)"[^>]*>[\s\S]*?<a[^>]*href="#([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
    ),
  ];
  tocItems.value = matches.map(m => ({
    level : parseInt(m[1], 10),
    id    : m[2],
    label : m[3].replace(/<[^>]+>/g, '').trim(),
  }));
}

// ── TIER 1: page-break split (fast path) ─────────────────────────────────────
function splitByPageBreaks(body: string): string[] | null {
  const parts = body
    .split(/<br[^>]*style[^>]*page-break-(before|after)\s*:\s*always[^>]*>/gi)
    .map(p => p.trim())
    .filter(p => /[<\w]/.test(p) && p.length > 0);

  return parts.length > 1 ? parts : null;
}

// ── TIER 2: height-based layout engine ───────────────────────────────────────
// Mirrors what Word does: measure each DOM block, fill pages by height budget.
async function paginateByHeight(body: string): Promise<string[]> {
  const container = getMeasureContainer();

  const wrapper = document.createElement('div');
  wrapper.innerHTML = body;
  container.innerHTML = '';
  container.appendChild(wrapper);

  // Wait for layout — fonts, images, table cells all need 2 frames to settle
  await nextTick();
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));

  const children = Array.from(wrapper.childNodes);

  const pageChunks: string[] = [];
  let currentHtml            = '';
  let currentHeight          = 0;

  const flushPage = () => {
    if (currentHtml.trim()) pageChunks.push(currentHtml);
    currentHtml   = '';
    currentHeight = 0;
  };

  for (const node of children) {
    // Skip pure whitespace text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      if (!(node as Text).textContent?.trim()) continue;
    }

    const el = node as HTMLElement;

    // Explicit page-break markers → force a new page
    if (isPageBreakBr(el)) {
      flushPage();
      continue;
    }

    const elHeight = el.getBoundingClientRect?.()?.height ?? 0;

    // Oversized element (e.g. giant table) → split by its own children
    if (elHeight > CONTENT_HEIGHT && el.tagName === 'TABLE') {
      const thead = el.querySelector('thead')?.outerHTML ?? '';
      const rows  = Array.from(el.querySelectorAll('tbody tr, tr'));

      for (const row of rows) {
        container.innerHTML = `<table>${thead}<tbody></tbody></table>`;
        const tbody = container.querySelector('tbody')!;
        tbody.appendChild((row as HTMLElement).cloneNode(true));
        await new Promise(r => requestAnimationFrame(r));
        const rowH = container.firstElementChild!.getBoundingClientRect().height;

        if (currentHeight + rowH > CONTENT_HEIGHT) flushPage();
        currentHtml   += `<table>${thead}<tbody>${(row as HTMLElement).outerHTML}</tbody></table>`;
        currentHeight += rowH;
      }
      continue;
    }

    // Normal block — does it fit on the current page?
    if (currentHeight + elHeight > CONTENT_HEIGHT && currentHtml) {
      flushPage();
    }

    currentHtml   += (el as HTMLElement).outerHTML ?? (node as Text).textContent ?? '';
    currentHeight += elHeight;
  }

  flushPage();
  container.innerHTML = '';

  if (import.meta.env.DEV) {
    console.log('[DocPreview] height-based pages:', pageChunks.length);
  }

  return pageChunks.length > 0 ? pageChunks : [body];
}

// ── Master paginate ───────────────────────────────────────────────────────────
async function paginate(html: string) {
  paginating.value = true;
  const body = extractBody(html);

  extractToc(body);

  try {
    // Tier 1 — fast path
    const byBreaks = splitByPageBreaks(body);
    if (byBreaks) {
      if (import.meta.env.DEV) console.log('[DocPreview] page-break pages:', byBreaks.length);
      pages.value = byBreaks;
      return;
    }

    // Tier 2 — layout engine
    pages.value = await paginateByHeight(body);
  } catch (e) {
    console.error('[DocPreview] pagination error, single-page fallback:', e);
    pages.value = [body];
  } finally {
    paginating.value = false;
  }
}

// ── Load preview ──────────────────────────────────────────────────────────────
async function loadPreview() {
  if (!tgId.value) return;
  loading.value = true;
  error.value   = null;
  pages.value   = [];

  try {
    const html = await editorApi.docGenPreview(tgId.value, 'en');
    await nextTick();
    await paginate(html);
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

// ── TOC navigation ────────────────────────────────────────────────────────────
function scrollToAnchor(id: string) {
  tocOpen.value = false;
  const el = document.querySelector(`[name="${id}"]`) ?? document.getElementById(id);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function backToDashboard() {
  router.push({ name: 'admin-test-guidelines' });
}

onMounted(loadPreview);
</script>

<template>
  <div class="preview-root">

    <!-- Top bar -->
    <div class="preview-topbar">
      <Button type="tertiary" icon-left="arrow-left" @click="backToDashboard">
        Back to TG Dashboard
      </Button>

      <span class="preview-topbar__title">Document Preview</span>

      <div class="preview-topbar__actions">
        <Button
          v-if="tocItems.length"
          type="tertiary"
          icon-left="list"
          @click="tocOpen = !tocOpen"
        >
          Contents
        </Button>
        <span v-if="pages.length > 1" class="page-count-badge">
          {{ pages.length }} pages
        </span>
      </div>
    </div>

    <!-- TOC floating panel -->
    <Transition name="toc-slide">
      <div v-if="tocOpen && tocItems.length" class="toc-panel">
        <div class="toc-panel__header">
          <span>Table of Contents</span>
          <button class="toc-panel__close" @click="tocOpen = false">✕</button>
        </div>
        <nav class="toc-panel__nav">
          <button
            v-for="item in tocItems"
            :key="item.id"
            class="toc-item"
            :class="`toc-item--level-${item.level}`"
            @click="scrollToAnchor(item.id)"
          >
            {{ item.label }}
          </button>
        </nav>
      </div>
    </Transition>

    <!-- Loading skeleton -->
    <div v-if="loading || paginating" class="skel">
      <p v-if="paginating" class="skel__label">Calculating page layout…</p>
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
        <Skeleton width="50%"  height="14px" />
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="preview-error">
      <p>{{ error }}</p>
      <Button type="tertiary" icon-left="refresh" @click="loadPreview">Try again</Button>
    </div>

    <!-- A4 paginated document -->
    <div v-else-if="pages.length" class="doc-viewer">
      <div
        v-for="(page, index) in pages"
        :key="index"
        class="doc-page"
      >
        <div class="doc-page__content" v-html="page" />
        <div class="doc-page__footer">{{ index + 1 }} / {{ pages.length }}</div>
      </div>
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
  position: relative;
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

.preview-topbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 170px;
  justify-content: flex-end;
}

.page-count-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-neutral-600);
  background: var(--color-neutral-100);
  border: 1px solid var(--color-neutral-200);
  border-radius: 999px;
  padding: 2px 10px;
  white-space: nowrap;
}

/* ── TOC panel ────────────────────────────────────────────────────────────── */
.toc-panel {
  position: fixed;
  top: 80px;
  right: 24px;
  width: 280px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.toc-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 700;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.toc-panel__close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-neutral-500);
  padding: 0;
  line-height: 1;
}

.toc-panel__nav {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}

.toc-item {
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  line-height: 1.4;
  color: var(--color-neutral-700);
  padding: 6px 16px;
  transition: background 0.15s;
}

.toc-item:hover {
  background: var(--color-neutral-50);
  color: var(--color-primary-green-dark);
}

.toc-item--level-1 { padding-left: 16px; font-weight: 600; }
.toc-item--level-2 { padding-left: 28px; }
.toc-item--level-3 { padding-left: 40px; font-size: 12px; color: var(--color-neutral-500); }

.toc-slide-enter-active, .toc-slide-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toc-slide-enter-from, .toc-slide-leave-to { opacity: 0; transform: translateX(12px); }

/* ── Loading skeleton ─────────────────────────────────────────────────────── */
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

.skel__label {
  font-size: 13px;
  color: var(--color-neutral-500);
  font-style: italic;
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

/* ── Grey canvas ──────────────────────────────────────────────────────────── */
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

/* ── A4 page shell ────────────────────────────────────────────────────────── */
.doc-page {
  width: 794px;
  min-height: 1123px;
  background: #ffffff;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Page content area ────────────────────────────────────────────────────── */
.doc-page__content {
  flex: 1;
  padding: 56.7px;
  font-family: Arial, 'Times New Roman', sans-serif;
  font-size: 10pt;
  line-height: 1.5;
  color: #000;
  overflow: hidden;
  overflow-wrap: break-word;
  word-break: break-word;
}

/* ── Page number footer ───────────────────────────────────────────────────── */
.doc-page__footer {
  flex-shrink: 0;
  text-align: center;
  font-size: 9pt;
  color: #aaa;
  padding: 6px 0 10px;
  border-top: 1px solid #eee;
  font-family: Arial, sans-serif;
}

/* ── Deep styles for injected HTML ───────────────────────────────────────── */
.doc-page__content :deep(table) { border-collapse: collapse; max-width: 100%; }
.doc-page__content :deep(td),
.doc-page__content :deep(th)   { vertical-align: top; }
.doc-page__content :deep(img)  { max-width: 100%; height: auto; }
.doc-page__content :deep(p)    { margin: 0; padding: 0; }

/* Strip Section wrapper page-break styles — layout engine handles this now */
.doc-page__content :deep([class^="Section"]) {
  page-break-before: unset !important;
  clear: unset !important;
}

/*
 * page-break <br> tags are either:
 *   a) consumed by splitByPageBreaks() — never reach the DOM
 *   b) inside height-paginated pages — hide so they add no visual space
 */
.doc-page__content :deep(br[style*="page-break"]) {
  display: none;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .doc-page, .skel-page { width: 100%; min-height: unset; }
  .doc-page__content { padding: 24px 16px; }
  .toc-panel { right: 8px; width: calc(100vw - 16px); top: 70px; }
  .preview-topbar__actions { min-width: auto; }
  .preview-topbar__title { text-align: left; }
}
</style>