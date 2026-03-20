<script setup lang="ts">
import { computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card } from 'upov-ui';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';
import { useEditorStore } from '@/stores/editor';
import { useChapterPreview } from '@/composables/useChapterPreview';
import { useTinymce } from '@/composables/useTinymce';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 400 });
const { previewHtml, previewLoading, previewError, needsRefresh, markDirty, handleRefresh } = useChapterPreview('09');

const data = computed(() => store.chapters['09']);

function onContentChange(value: string) {
  store.autosave('09', 'LiteratureReferences', value);
  markDirty();
}
</script>

<template>
  <ChapterPreview
    v-if="data"
    :loading="previewLoading"
    :needs-refresh="needsRefresh"
    @refresh="handleRefresh"
  >
    <template #edit>
      <Card elevation="low">
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
    </template>

    <div v-if="previewError" style="color: #D32F2F; font-size: 13px">⚠ {{ previewError }}</div>
    <div v-else-if="previewHtml" v-html="previewHtml" />
  </ChapterPreview>
</template>