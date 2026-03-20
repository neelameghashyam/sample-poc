<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { Spinner, Button } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import EditorHeader from './EditorHeader.vue';
import EditorStepper from './EditorStepper.vue';
import EditorFooter from './EditorFooter.vue';

// Store-connected chapter components
import Chapter01Subject from '@/components/editor/chapters/Chapter01Subject.vue';
import Chapter05Grouping from '@/components/editor/chapters/Chapter05Grouping.vue';
import Chapter06Characteristics from '@/components/editor/chapters/Chapter06Characteristics.vue';
import Chapter09Literature from '@/components/editor/chapters/Chapter09Literature.vue';
import Chapter11Annex from '@/components/editor/chapters/Chapter11Annex.vue';

import Chapter02Material from '@/components/editor/chapters/Chapter02Material.vue';
import Chapter03Examination from '@/components/editor/chapters/Chapter03Examination.vue';
import Chapter04Assessment from '@/components/editor/chapters/Chapter04Assessment.vue';

import Chapter07Table from '@/components/editor/chapters/Chapter07Table.vue';
import Chapter08Explanations from '@/components/editor/chapters/Chapter08Explanations.vue';
import Chapter10TechQuestionnaire from '@/components/editor/chapters/Chapter10TechQuestionnaire.vue';

const route = useRoute();
const router = useRouter();
const store = useEditorStore();

onMounted(() => {
  const id = Number(route.params.id);
  if (id) {
    store.load(id);
  }

  // Restore chapter from URL hash (e.g. #chapter-07)
  const match = route.hash.match(/^#chapter-(\d{2})$/);
  if (match) {
    const index = store.chapterList.findIndex((c) => c.number === match[1]);
    if (index >= 0) store.goToChapter(index);
  }

  window.addEventListener('beforeunload', handleBeforeUnload);
});

// Sync active chapter → URL hash, and scroll content area back to top.
// This covers ALL navigation sources: stepper, footer prev/next, and direct URL.
watch(() => store.activeChapterIndex, (index) => {
  const chapter = store.chapterList[index];
  if (chapter) {
    router.replace({ hash: `#chapter-${chapter.number}` });
  }
  const appContent = document.querySelector<HTMLElement>('.app-content');
  if (appContent) {
    appContent.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

// Warn on browser close/refresh if unsaved changes
function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (store.dirty.size > 0) {
    e.preventDefault();
    e.returnValue = '';
  }
}

// Warn on in-app navigation if unsaved changes
onBeforeRouteLeave(() => {
  if (store.dirty.size > 0) {
    return window.confirm('You have unsaved changes. Leave anyway?');
  }
});

// Map chapter index → component.
// Chapters without a dedicated component yet fall back to a placeholder.
const chapterComponents = [
  Chapter01Subject,       // 0 → ch01
  Chapter02Material,      // 1 → ch02
  Chapter03Examination,   // 2 → ch03
  Chapter04Assessment,    // 3 → ch04
  Chapter05Grouping,      // 4 → ch05
  Chapter06Characteristics, // 5 → ch06
  Chapter07Table,         // 6 → ch07
  Chapter08Explanations,  // 7 → ch08
  Chapter09Literature,    // 8 → ch09
  Chapter10TechQuestionnaire, // 9 → ch10
  Chapter11Annex,         // 10 → ch11
];

const ActiveChapter = computed(
  () => chapterComponents[store.activeChapterIndex] ?? Chapter01Subject,
);

function backToDashboard() {
  router.push({ name: 'admin-test-guidelines' });
}
</script>

<template>
  <div ref="editorRoot" class="editor-root">
    <!-- Back button -->
    <div style="display: flex; align-items: center; justify-content: space-between">
      <Button type="tertiary" icon-left="arrow-left" @click="backToDashboard">Back to TG Dashboard</Button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="store.loading" class="skel">
      <div class="skel-header">
        <div class="skel-line skel-line--lg" />
        <div class="skel-line skel-line--sm" />
      </div>
      <div class="skel-body">
        <div class="skel-sidebar">
          <div v-for="n in 6" :key="n" class="skel-line skel-line--md" />
        </div>
        <div class="skel-content">
          <div class="skel-line skel-line--lg" />
          <div class="skel-line skel-line--full" />
          <div class="skel-line skel-line--full" />
          <div class="skel-line skel-line--md" />
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="store.error" style="display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 64px 0; color: #D32F2F">
      <p>{{ store.error }}</p>
      <Button type="tertiary" icon-left="arrow-left" @click="backToDashboard">Return to dashboard</Button>
    </div>

    <!-- Editor -->
    <template v-else>
      <EditorHeader />

      <div style="display: flex; align-items: flex-start; gap: 24px">
        <EditorStepper />

        <main style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 20px">
          <h1 style="font-size: 22px; font-weight: 700; color: var(--color-primary-green-dark); line-height: 27px">
            {{ store.activeChapterNumber }}. {{ store.activeChapterTitle }}
          </h1>

          <KeepAlive>
            <component :is="ActiveChapter" :key="store.activeChapterIndex" />
          </KeepAlive>
        </main>
      </div>

      <EditorFooter />

      <!-- Error toast -->
      <Transition name="toast">
        <div v-if="store.saveStatus === 'error' && store.lastSaveError" class="error-toast">
          <span>{{ store.lastSaveError }}</span>
          <button class="error-toast-close" @click="store.dismissSaveError()">&times;</button>
        </div>
      </Transition>
    </template>
  </div>
</template>

<style scoped>
/* ── Reset ─────────────────────────────────────────────────────────────────── */
.editor-root *, .editor-root *::before, .editor-root *::after { box-sizing: border-box; }
.editor-root h1, .editor-root h2, .editor-root h3, .editor-root p, .editor-root ul { margin: 0; padding: 0; }
.editor-root ul     { list-style: none; }
.editor-root a      { color: inherit; }
.editor-root button { font-family: 'Figtree', 'Segoe UI', Arial, sans-serif; cursor: pointer; }

.editor-root {
  font-family: 'Figtree', sans-serif;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: var(--color-neutral-800);
}

/* ── Loading skeleton ─────────────────────────────────────────────────────── */
.skel { display: flex; flex-direction: column; gap: 24px; }
.skel-header { background: #fff; border-radius: 8px; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.skel-body { display: flex; gap: 24px; }
.skel-sidebar { width: 220px; flex-shrink: 0; background: #fff; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.skel-content { flex: 1; background: #fff; border-radius: 8px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.skel-line { height: 14px; border-radius: 4px; background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skel-line--sm { width: 30%; }
.skel-line--md { width: 60%; }
.skel-line--lg { width: 45%; height: 18px; }
.skel-line--full { width: 100%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── Error toast ─────────────────────────────────────────────────────────── */
.error-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px; background: #D32F2F; color: #fff;
  border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  font-size: 14px; font-weight: 500; z-index: 1000;
}
.error-toast-close {
  background: none; border: none; color: #fff; font-size: 20px;
  cursor: pointer; padding: 0 4px; line-height: 1; opacity: 0.8;
}
.error-toast-close:hover { opacity: 1; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }

/* ── TinyMCE overrides (centralized from EditorHeader + Ch08) ─────────── */
.editor-root :deep(.tox-tinymce) { border: 1px solid var(--color-primary-green-dark) !important; border-radius: 4px !important; }
.editor-root :deep(.tox-toolbar__primary) { background: #fff !important; border-bottom: 1px solid var(--color-neutral-200) !important; }
.editor-root :deep(.tox-toolbar-overlord) { background: #fff !important; }
.editor-root :deep(.tox .tox-tbtn svg) { fill: var(--color-primary-green-dark) !important; }
.editor-root :deep(.tox .tox-tbtn:hover) { background: rgba(28,66,64,0.06) !important; }
.editor-root :deep(.tox .tox-statusbar) { border-top: 1px solid var(--color-neutral-200) !important; }
.editor-root :deep(.tox-statusbar__branding) { display: none; }
</style>