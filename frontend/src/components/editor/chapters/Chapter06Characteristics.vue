<script setup lang="ts">
import { ref, computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card, ToggleSwitch, Button } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { editorApi } from '@/services/editor-api';
import { useTinymce } from '@/composables/useTinymce';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 200 });

const data = computed(() => store.chapters['06']);
const refreshing = ref(false);

function onFieldChange(field: string, value: any) {
  store.autosave('06', field, value);
}

function onLegendToggle(val: 'left' | 'right') {
  onFieldChange('isCharacteristicsLegend', val === 'right' ? 'Y' : 'N');
}

function onExampleVarietyToggle(val: 'left' | 'right') {
  onFieldChange('isExampleVarietyText', val === 'right' ? 'Y' : 'N');
}

async function refreshPreview() {
  refreshing.value = true;
  try {
    const res = await editorApi.open(store.tgId!);
    store.chapters['06'] = res.chapters['06'];
  } finally {
    refreshing.value = false;
  }
}
</script>

<template>
  <div v-if="data" style="display: flex; flex-direction: column; gap: 12px">
    <Card elevation="low">
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
      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 16px">
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

    <!-- ── Chapter-level Preview (end of chapter) ── -->
    <ChapterPreview>
      <div style="display: flex; flex-direction: column; gap: 14px">
        <div>
          <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px">6.1 Characteristics legend</p>
          <p v-if="data.isCharacteristicsLegend !== 'Y'" style="color: var(--color-neutral-500); font-style: italic">Legend disabled</p>
          <div v-else-if="data.CharacteristicLegend" v-html="data.CharacteristicLegend"></div>
          <em v-else style="color: var(--color-neutral-500)">Enabled but no content yet</em>
        </div>
        <div>
          <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px">6.2 Example variety text</p>
          <p v-if="data.isExampleVarietyText !== 'Y'" style="color: var(--color-neutral-500); font-style: italic">Example variety text disabled</p>
          <div v-else-if="data.ExampleVarietyText" v-html="data.ExampleVarietyText"></div>
          <em v-else style="color: var(--color-neutral-500)">Enabled but no content yet</em>
        </div>
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
