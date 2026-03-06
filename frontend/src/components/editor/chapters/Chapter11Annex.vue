<script setup lang="ts">
import { computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card, Button } from 'upov-ui';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';
import { useEditorStore } from '@/stores/editor';
import { useTinymce } from '@/composables/useTinymce';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 400 });

const data = computed(() => store.chapters['11']);

function onContentChange(value: string) {
  store.autosave('11', 'annexRefData', value);
}

}
</script>

<template>
  <div v-if="data" style="display: flex; flex-direction: column; gap: 12px">
    <Card elevation="low">
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

    <!-- ── Chapter-level Preview (end of chapter) ── -->
    <ChapterPreview :chapter-number="11">
      <div style="display: flex; flex-direction: column; gap: 8px">
        <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px">11.1 Annex content</p>
        <div v-if="data.annexRefData" v-html="data.annexRefData"></div>
        <em v-else style="color: var(--color-neutral-500)">No content yet</em>
      </div>
    </ChapterPreview>

  </div>
</template>
