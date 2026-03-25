<script setup lang="ts">
import { computed, watch, nextTick } from 'vue';
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

// Check for toast message after navigation (set via sessionStorage by other pages)
router.afterEach(() => {
  const msg = sessionStorage.getItem('toast');
  if (msg) {
    sessionStorage.removeItem('toast');
    const variant = (sessionStorage.getItem('toast_variant') as 'success' | 'error') || 'success';
    sessionStorage.removeItem('toast_variant');
    nextTick(() => toast.show(msg, { variant }));
  }
});

// Move focus to the Login button when the modal opens (away from the X button)
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
  min-height: 100%;
}

/* TinyMCE appends .tox-tinymce-aux to <body> with position:relative + large width,
   causing a horizontal scrollbar that shrinks the viewport by ~19px.
   Fix: take it out of flow entirely with position:fixed + zero footprint,
   while keeping overflow:visible so floating toolbars/dropdowns still appear. */
.tox-tinymce-aux {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 0 !important;
  height: 0 !important;
  overflow: visible !important;
  pointer-events: none;
}
/* Re-enable pointer events on tox popups/toolbars inside the aux container */
.tox-tinymce-aux > * {
  pointer-events: auto;
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