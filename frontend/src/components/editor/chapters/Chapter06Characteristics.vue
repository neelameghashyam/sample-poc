<script setup lang="ts">
import { ref, computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card, ToggleSwitch } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { editorApi } from '@/services/editor-api';
import { useTinymce } from '@/composables/useTinymce';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 200 });

const data = computed(() => store.chapters['06']);

function onFieldChange(field: string, value: any) {
  store.autosave('06', field, value);
}

function onLegendToggle(val: 'left' | 'right') {
  onFieldChange('isCharacteristicsLegend', val === 'right' ? 'Y' : 'N');
}

function onExampleVarietyToggle(val: 'left' | 'right') {
  onFieldChange('isExampleVarietyText', val === 'right' ? 'Y' : 'N');
}

const previewHtml = ref<string | null>(null);
const previewLoading = ref(false);
const previewError = ref<string | null>(null);

async function handleRefresh(lang: string) {
  if (!store.tgId) return;
  previewLoading.value = true;
  previewError.value = null;
  try {
    previewHtml.value = await editorApi.docPreview(store.tgId, '06', lang);
  } catch (err: any) {
    previewError.value = err?.response?.data?.error?.message || 'Failed to load preview';
  } finally {
    previewLoading.value = false;
  }
}
</script>

<template>
  <Card v-if="data" elevation="low">
    <!-- Legend section -->
    <div style="display: flex; flex-direction: column; gap: 12px">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px">
        <h2 style="font-size: 18px; font-weight: 700; color: var(--color-neutral-800); line-height: 22px">6.1 Characteristics legend</h2>
        <ToggleSwitch
          :model-value="data.isCharacteristicsLegend === 'Y' ? 'right' : 'left'"
          left-label="Disabled"
          right-label="Enabled"
          @update:model-value="onLegendToggle"
        />
      </div>

      <p style="font-size: 14px; font-weight: 400; color: #606060; line-height: 20px">
        Enable to add a legend explaining symbols and abbreviations used in the table of characteristics.
      </p>

      <template v-if="data.isCharacteristicsLegend === 'Y'">
        <Editor
          :model-value="data.CharacteristicLegend || ''"
          :api-key="apiKey"
          :init="init"
          @update:model-value="onFieldChange('CharacteristicLegend', $event)"
        />
      </template>
    </div>

    <!-- Example variety text section -->
    <div style="display: flex; flex-direction: column; gap: 12px">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px">
        <h2 style="font-size: 18px; font-weight: 700; color: var(--color-neutral-800); line-height: 22px">6.2 Example variety text</h2>
        <ToggleSwitch
          :model-value="data.isExampleVarietyText === 'Y' ? 'right' : 'left'"
          left-label="Disabled"
          right-label="Enabled"
          @update:model-value="onExampleVarietyToggle"
        />
      </div>

      <p style="font-size: 14px; font-weight: 400; color: #606060; line-height: 20px">
        Enable to add text explaining the example varieties used in the table of characteristics.
      </p>

      <template v-if="data.isExampleVarietyText === 'Y'">
        <Editor
          :model-value="data.ExampleVarietyText || ''"
          :api-key="apiKey"
          :init="init"
          @update:model-value="onFieldChange('ExampleVarietyText', $event)"
        />
      </template>
    </div>
  </Card>
</template>
