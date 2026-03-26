<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button, Skeleton, useToast } from 'upov-ui';
import { editorApi } from '@/services/editor-api';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const tgId = ref<number>(Number(route.params.id));

const previewHtml = ref<string | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const iframeRef = ref<HTMLIFrameElement | null>(null);
const iframeHeight = ref(1200);

/* ------------------ PAGINATION SCRIPT (ESCAPED) ------------------ */
const PAGINATION_SCRIPT = `
<scr` + `ipt>
window.addEventListener('load', () => {
  const PAGE_HEIGHT = 1123;

  function splitPage(page) {
    while (page.scrollHeight > PAGE_HEIGHT) {
      const newPage = document.createElement('div');
      newPage.className = 'real-page';

      let moved = false;
      const children = Array.from(page.children);

      for (let i = children.length - 1; i >= 0; i--) {
        newPage.prepend(children[i]);

        if (page.scrollHeight <= PAGE_HEIGHT) {
          moved = true;
          break;
        }
      }

      if (!moved) break;

      page.after(newPage);
    }
  }

  const pages = document.querySelectorAll('.real-page');
  pages.forEach(splitPage);
});
</scr` + `ipt>
`;

/* ------------------ STYLES ------------------ */
const STYLES = `
<style>
@page {
  size: A4;
  margin: 1.5cm;
}

html {
  background: #f0f0f0;
}

body {
  margin: 0;
  padding: 32px 0;
  font-family: Arial, 'Times New Roman', sans-serif;
  font-size: 10pt;
}

.real-page {
  width: 794px;
  min-height: 1123px;
  margin: 0 auto 32px;
  padding: 56.7px;
  background: white;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

/* tables */
table { border-collapse: collapse; max-width: 100%; }
td, th { vertical-align: top; }

/* images */
img { max-width: 100%; height: auto; }

/* remove section page breaks */
[class^="Section"] {
  page-break-before: unset !important;
  clear: unset !important;
}
</style>
`;

/* ------------------ PAGE BREAK → DIV ------------------ */
function transformHtml(html: string) {
  return html.replace(
    /<br[^>]*page-break-before[^>]*>/gi,
    '</div><div class="real-page">'
  );
}

/* ------------------ FINAL HTML ------------------ */
const framedHtml = computed(() => {
  if (!previewHtml.value) return '';

  const content = transformHtml(previewHtml.value);

  return `
  <html>
    <head>
      ${STYLES}
    </head>
    <body>
      <div class="real-page">
        ${content}
      </div>
      ${PAGINATION_SCRIPT}
    </body>
  </html>
  `;
});

/* ------------------ LOAD ------------------ */
async function loadPreview() {
  if (!tgId.value) return;

  loading.value = true;
  error.value = null;

  try {
    previewHtml.value = await editorApi.docGenPreview(tgId.value, 'en');
  } catch (err: any) {
    error.value = 'Failed to load preview';
    toast.show(error.value, { variant: 'error' });
  } finally {
    loading.value = false;
  }
}

onMounted(loadPreview);

/* ------------------ RESIZE IFRAME ------------------ */
function onIframeLoad() {
  const body = iframeRef.value?.contentDocument?.body;
  if (body) {
    iframeHeight.value = body.scrollHeight + 50;
  }
}

function backToDashboard() {
  router.push({ name: 'admin-test-guidelines' });
}
</script>

<template>
  <div class="preview-root">

    <div class="topbar">
      <Button type="tertiary" @click="backToDashboard">
        Back
      </Button>
      <span>Document Preview</span>
    </div>

    <div v-if="loading" class="skel">
      <Skeleton width="100%" height="400px" />
    </div>

    <div v-else-if="error">{{ error }}</div>

    <div v-else class="viewer">
      <iframe
        ref="iframeRef"
        :srcdoc="framedHtml"
        class="frame"
        :style="{ height: iframeHeight + 'px' }"
        sandbox="allow-same-origin"
        @load="onIframeLoad"
      />
    </div>

  </div>
</template>

<style scoped>
.preview-root {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  font-weight: bold;
}

.viewer {
  background: #f0f0f0;
  padding: 20px;
  display: flex;
  justify-content: center;
}

.frame {
  width: 900px;
  border: none;
}
</style>