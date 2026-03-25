<script setup lang="ts">
import { computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { Modal, Button, ToastContainer, useToast } from 'upov-ui';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { sessionExpired } = storeToRefs(authStore);
const toast = useToast();

const isFullscreenPage = computed(() =>
  ['/login', '/auth/callback'].includes(route.path),
);

router.afterEach(() => {
  const msg = sessionStorage.getItem('toast');
  if (msg) {
    sessionStorage.removeItem('toast');
    const variant = (sessionStorage.getItem('toast_variant') as 'success' | 'error') || 'success';
    sessionStorage.removeItem('toast_variant');
    nextTick(() => toast.show(msg, { variant }));
  }
});

watch(sessionExpired, (expired) => {
  if (expired) {
    nextTick(() => {
      document.getElementById('session-expired-login')?.focus();
    });
  }
});

function relogin() {
  sessionStorage.setItem('auth_redirect', route.fullPath);
  authStore.logout();
  router.push('/login');
}

// ── TinyMCE layout-shift fix ──────────────────────────────────────────────────
// TinyMCE appends .tox-tinymce-aux to <body> with inline style="position:relative"
// and may reset it via JS. When position:relative, this div participates in
// document flow → body grows taller/wider than 100vh → browser scrollbar appears
// → viewport shrinks ~19px → layout shifts on first load (Ch00).
//
// Fix: use a MutationObserver to immediately force position:fixed whenever
// TinyMCE adds or modifies the aux div, removing it from document flow permanently.
// position:fixed elements cannot cause body overflow regardless of their size.

let childObserver: MutationObserver | null = null;
let attrObserver: MutationObserver | null = null;

function fixToxAux(el: HTMLElement) {
  // Force out of flow via JS (overrides inline style that CSS !important can't always beat
  // when TinyMCE continuously resets via setAttribute)
  el.style.setProperty('position', 'fixed', 'important');
  el.style.setProperty('top', '0', 'important');
  el.style.setProperty('left', '0', 'important');
  el.style.setProperty('width', '0', 'important');
  el.style.setProperty('height', '0', 'important');

  // Watch for TinyMCE resetting the style attribute on this element
  if (!el.dataset.toxFixed) {
    el.dataset.toxFixed = '1';
    const ao = new MutationObserver(() => fixToxAux(el));
    ao.observe(el, { attributes: true, attributeFilter: ['style'] });
    // Store reference for cleanup
    (el as any).__toxObserver = ao;
  }
}

function scanAndFix() {
  document.querySelectorAll<HTMLElement>('.tox-tinymce-aux').forEach(fixToxAux);
}

onMounted(() => {
  // Fix any already-present aux divs
  scanAndFix();

  // Watch for TinyMCE appending new aux divs to body
  childObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.classList.contains('tox-tinymce-aux')) {
            fixToxAux(node);
          }
          // Also check descendants
          node.querySelectorAll<HTMLElement>('.tox-tinymce-aux').forEach(fixToxAux);
        }
      });
    }
  });
  childObserver.observe(document.body, { childList: true, subtree: true });
});

onUnmounted(() => {
  childObserver?.disconnect();
  childObserver = null;
  attrObserver?.disconnect();
  attrObserver = null;
  // Clean up per-element observers
  document.querySelectorAll<HTMLElement>('.tox-tinymce-aux').forEach((el) => {
    (el as any).__toxObserver?.disconnect();
    delete (el as any).__toxObserver;
    delete el.dataset.toxFixed;
  });
});
</script>

<template>
  <RouterView v-if="isFullscreenPage" />
  <div v-else class="app-container">
    <AppHeader />
    <div class="app-body">
      <AppSidebar />
      <main class="app-content">
        <RouterView />
      </main>
    </div>
  </div>

  <ToastContainer />

  <Modal v-model:open="sessionExpired" title="Session expired" max-width="440px">
    <p>Your session has ended. Please log in again to continue.</p>
    <template #footer>
      <Button id="session-expired-login" type="primary" @click="relogin">Log in</Button>
    </template>
  </Modal>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  overflow-x: hidden;
}

body {
  overflow-x: hidden;
}

/* TinyMCE .tox-tinymce-aux — CSS first-line defence.
   The MutationObserver in <script> handles JS resets from TinyMCE. */
.tox-tinymce-aux {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 0 !important;
  height: 0 !important;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.app-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
}
</style>