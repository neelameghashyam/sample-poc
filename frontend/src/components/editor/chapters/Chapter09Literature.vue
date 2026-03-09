<script setup lang="ts">
import { ref, computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card } from 'upov-ui';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';
import { useEditorStore } from '@/stores/editor';
import { editorApi } from '@/services/editor-api';
import { useTinymce } from '@/composables/useTinymce';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 400 });

const data = computed(() => store.chapters['09']);

function onContentChange(value: string) {
  store.autosave('09', 'LiteratureReferences', value);
}

const previewHtml = ref<string | null>(null);
const previewLoading = ref(false);
const previewError = ref<string | null>(null);

async function handleRefresh(lang: string) {
  if (!store.tgId) return;
  previewLoading.value = true;
  previewError.value = null;
  try {
    previewHtml.value = await editorApi.docPreview(store.tgId, '09', lang);
  } catch (err: any) {
    previewError.value = err?.response?.data?.error?.message || 'Failed to load preview';
  } finally {
    previewLoading.value = false;
  }
}
</script>

<template>
  <Card v-if="data" elevation="low">
    <div style="display: flex; flex-direction: column; gap: 12px">
      <h2 style="font-size: 18px; font-weight: 700; color: var(--color-neutral-800); line-height: 22px">9.1 Literature references</h2>
      <p style="font-size: 14px; font-weight: 400; color: #606060; line-height: 20px">
        List of relevant literature references for these Test Guidelines.
      </p>

      <Editor
        :model-value="data.LiteratureReferences || ''"
        :api-key="apiKey"
        :init="init"
        @update:model-value="onContentChange"
      />

    </div>
  </Card>

  <!-- Chapter-level Preview -->
  <ChapterPreview v-if="data" :loading="previewLoading" @refresh="handleRefresh">
    <div v-if="previewError" style="color: #D32F2F; font-size: 13px">⚠ {{ previewError }}</div>
    <div v-else-if="previewHtml" v-html="previewHtml" />
    <div v-else><div v-html="data.LiteratureReferences || '<em>No content yet</em>'"></div></div>
  </ChapterPreview>
</template>
