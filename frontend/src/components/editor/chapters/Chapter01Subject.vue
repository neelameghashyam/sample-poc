<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card, RadioGroup, RadioOption, Links } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { useTinymce } from '@/composables/useTinymce';
import { editorApi } from '@/services/editor-api';
import AddParagraphButton from '@/components/editor/shared/AddParagraphButton.vue';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 200 });

const data = computed(() => store.chapters['01']);

const previewHtml = ref<string | null>(null);
const previewLoading = ref(false);
const previewError = ref<string | null>(null);

function onFieldChange(field: string, value: any) {
  store.autosave('01', field, value);
}

function setRadio(field: string, value: 'Y' | 'N') {
  onFieldChange(field, value);
}

async function loadPreview(lang: string) {
  if (!store.tgId) return;
  previewLoading.value = true;
  previewError.value = null;
  try {
    previewHtml.value = await editorApi.docPreview(store.tgId, '01', lang);
  } catch (err: any) {
    previewError.value = err?.response?.data?.error?.message || 'Failed to load preview';
  } finally {
    previewLoading.value = false;
  }
}

async function handleRefresh(lang: string) {
  await loadPreview(lang);
}

// Auto-load preview when the chapter mounts
onMounted(() => {
  loadPreview('en');
});
</script>

<template>
  <Card v-if="data" elevation="low">
    <div style="display: flex; flex-direction: column; gap: 12px">
      <h2 style="font-size: 18px; font-weight: 700; color: var(--color-neutral-800); line-height: 22px">1.1 Standard items are configured by default</h2>

      <Links :links="[
        { text: 'More than one species (GN3)' },
        { text: 'Different types or groups within a species or genus (GN4)' },
        { text: 'Family name (GN5)' },
        { text: 'Guidance for New Types and Species (GN6)' },
      ]" />

      <!-- Question 1.1.1 — SubjectClarificationIndicator -->
      <div style="display: flex; flex-direction: column; gap: 10px">
        <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">1.1.1 Subject clarification</h3>
        <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">
          Should clarification be provided that any other species or hybrids not explicitly
          covered by these Test Guidelines should be treated according to the provisions of
          document TGP/12 &quot;Guidance for New Types and Species&quot;?
          <span style="color: #D32F2F; margin-left: 2px">*</span>
        </p>
        <RadioGroup :model-value="data.SubjectClarificationIndicator" direction="horizontal"
          @update:model-value="setRadio('SubjectClarificationIndicator', $event)">
          <RadioOption value="Y" label="Yes" />
          <RadioOption value="N" label="No" />
        </RadioGroup>
      </div>

      <!-- Question 1.1.2 — Sub_check -->
      <div style="display: flex; flex-direction: column; gap: 10px">
        <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">1.1.2 Additional characteristics</h3>
        <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">
          Might it be necessary to add additional characteristics or additional states of
          expressions for ornamental, fruit, industrial, vegetable, agricultural or other varieties?
          <span style="color: #D32F2F; margin-left: 2px">*</span>
        </p>
        <RadioGroup :model-value="data.Sub_check" direction="horizontal"
          @update:model-value="setRadio('Sub_check', $event)">
          <RadioOption value="Y" label="Yes" />
          <RadioOption value="N" label="No" />
        </RadioGroup>
      </div>

      <!-- Subject additional info (TinyMCE) -->
      <div v-if="data.Sub_check === 'Y'" style="display: flex; flex-direction: column; gap: 6px">
        <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">Additional information</label>
        <Editor
          :model-value="data.Sub_Add_Info || ''"
          :api-key="apiKey"
          :init="init"
          @update:model-value="onFieldChange('Sub_Add_Info', $event)"
        />
      </div>

      <!-- Other info (TinyMCE) -->
      <div v-if="data.Sub_OtherInfo" style="display: flex; flex-direction: column; gap: 6px">
        <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">Other information</label>
        <Editor
          :model-value="data.Sub_OtherInfo || ''"
          :api-key="apiKey"
          :init="init"
          @update:model-value="onFieldChange('Sub_OtherInfo', $event)"
        />
      </div>

      <!-- Paragraphs -->
      <AddParagraphButton />
    </div>
  </Card>

  <!-- Chapter-level Preview -->
  <ChapterPreview
    v-if="data"
    :loading="previewLoading"
    @refresh="handleRefresh"
  >
    <!-- Error state -->
    <div v-if="previewError" style="color: #D32F2F; font-size: 13px">
      ⚠ {{ previewError }}
    </div>

    <!-- API-rendered HTML preview -->
    <div v-else-if="previewHtml" v-html="previewHtml" />
  </ChapterPreview>
</template>