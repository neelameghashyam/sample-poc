<script setup lang="ts">
import { computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card } from 'upov-ui';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';
import { useEditorStore } from '@/stores/editor';
import { useTinymce } from '@/composables/useTinymce';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 400 });

const data = computed(() => store.chapters['11']);

function onContentChange(value: string) {
  store.autosave('11', 'annexRefData', value);
}
</script>

<template>
  <Card v-if="data" elevation="low">
    <div style="display: flex; flex-direction: column; gap: 12px">
      <h2 style="font-size: 18px; font-weight: 700; color: var(--color-neutral-800); line-height: 22px">11.1 Annex content</h2>
      <p style="font-size: 14px; font-weight: 400; color: #606060; line-height: 20px">
        Supplementary reference data and annexes for these Test Guidelines.
      </p>

      <Editor
        :model-value="data.annexRefData || ''"
        :api-key="apiKey"
        :init="init"
        @update:model-value="onContentChange"
      />

    </div>
  </Card>

  <!-- Chapter-level Preview (one preview for the entire chapter) -->
  <ChapterPreview v-if="data">
    <div v-html="data.annexRefData || '<em>No content yet</em>'"></div>
  </ChapterPreview>
</template>
