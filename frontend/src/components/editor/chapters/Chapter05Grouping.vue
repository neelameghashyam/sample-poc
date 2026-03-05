<script setup lang="ts">
import { ref, computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card, Button } from 'upov-ui';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';
import { useEditorStore } from '@/stores/editor';
import { editorApi } from '@/services/editor-api';
import { useTinymce } from '@/composables/useTinymce';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 300 });

const data = computed(() => store.chapters['05']);
const refreshing = ref(false);

function onContentChange(value: string) {
  store.autosave('05', 'GroupingSummaryText', value);
}

async function refreshPreview() {
  refreshing.value = true;
  try {
    const res = await editorApi.open(store.tgId!);
    store.chapters['05'] = res.chapters['05'];
  } finally {
    refreshing.value = false;
  }
}
</script>

<template>
  <div v-if="data" style="display: flex; flex-direction: column; gap: 12px">
    <Card elevation="low">
      <div style="display: flex; flex-direction: column; gap: 12px">
        <h2 style="font-size: 18px; font-weight: 700; color: var(--color-neutral-800); line-height: 22px">5.1 Grouping summary</h2>
        <p style="font-size: 14px; font-weight: 400; color: #606060; line-height: 20px">
          Additional text identifying grouping characteristics and their states of expression
          that can be used to organise the growing trial for assessment of distinctness.
        </p>

        <Editor
          :model-value="data.GroupingSummaryText || ''"
          :api-key="apiKey"
          :init="init"
          @update:model-value="onContentChange"
        />
      </div>
    </Card>

    <!-- ── Chapter-level Preview (end of chapter) ── -->
    <ChapterPreview>
      <div style="display: flex; flex-direction: column; gap: 8px">
        <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px">5.1 Grouping summary</p>
        <div v-if="data.GroupingSummaryText" v-html="data.GroupingSummaryText"></div>
        <em v-else style="color: var(--color-neutral-500)">No content yet</em>
      </div>
    </ChapterPreview>

    <!-- ── Refresh Button ── -->
    <div style="display: flex; justify-content: flex-end">
      <Button type="secondary" :disabled="refreshing" @click="refreshPreview">
        <svg v-if="!refreshing" width="14" height="14" viewBox="0 0 14 14" fill="none" style="margin-right: 6px">
          <path d="M1 7A6 6 0 0 1 12.5 4M1 7l2-2M1 7l2 2M13 7A6 6 0 0 1 1.5 10M13 7l-2 2M13 7l-2-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ refreshing ? 'Refreshing...' : 'Refresh Preview' }}
      </Button>
    </div>
  </div>
</template>
