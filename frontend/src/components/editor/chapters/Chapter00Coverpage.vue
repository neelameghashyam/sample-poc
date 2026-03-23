<script setup lang="ts">
import { computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { useTinymce } from '@/composables/useTinymce';
import { useChapterPreview } from '@/composables/useChapterPreview';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 400 });
const { previewHtml, previewLoading, previewError, needsRefresh, markDirty, handleRefresh } =
  useChapterPreview('00');

const data = computed(() => store.chapters['00'] ?? {});

function onContentChange(value: string) {
  store.autosave('00', 'coverPageInfo', value);
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

          <label style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">
            Please enter the cover page information for these Test Guidelines:
          </label>

          <Editor
            :model-value="(data as any).coverPageInfo ?? ''"
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