<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { RadioGroup, RadioOption } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { editorApi } from '@/services/editor-api';
import { useTinymce } from '@/composables/useTinymce';
import SectionAccordion from '@/components/editor/shared/SectionAccordion.vue';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 200 });

const data = computed(() => store.chapters['02']);

function onFieldChange(field: string, value: any) {
  store.autosave('02', field, value);
}

const aswOptions = computed(() => store.lookups?.aswOptions?.seedQuality ?? []);

const previewHtml = ref<string | null>(null);
const previewLoading = ref(false);
const previewError = ref<string | null>(null);

async function loadPreview(lang: string) {
  if (!store.tgId) return;
  previewLoading.value = true;
  previewError.value = null;
  try {
    previewHtml.value = await editorApi.docPreview(store.tgId, '02', lang);
  } catch (err: any) {
    previewError.value = err?.response?.data?.error?.message || 'Failed to load preview';
  } finally {
    previewLoading.value = false;
  }
}

async function handleRefresh(lang: string) {
  await loadPreview(lang);
}

onMounted(() => {
  loadPreview('en');
});
</script>

<template>
  <div v-if="data" style="display: flex; flex-direction: column; gap: 12px">
    <!-- 2.1 Form of material -->
    <SectionAccordion number="2.1" title="Form of material" >
      <div style="display: flex; flex-direction: column; gap: 16px">
        <Editor
          :model-value="data.Material_Supplied || ''"
          :api-key="apiKey"
          :init="init"
          @update:model-value="onFieldChange('Material_Supplied', $event)"
        />

      </div>
    </SectionAccordion>

    <!-- 2.2 Minimum quantity -->
    <SectionAccordion number="2.2" title="Minimum quantity of plant material" >
      <div style="display: flex; flex-direction: column; gap: 16px">
        <Editor
          :model-value="data.Min_Plant_Material || ''"
          :api-key="apiKey"
          :init="init"
          @update:model-value="onFieldChange('Min_Plant_Material', $event)"
        />

      </div>
    </SectionAccordion>

    <!-- 2.3 Seed Quality Requirements -->
    <SectionAccordion number="2.3" title="Seed Quality Requirements" :open="true">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <p style="font-size: 15px; font-weight: 400; color: var(--color-neutral-800); line-height: 19px">Please select one of the options (if applicable).</p>
        <RadioGroup :model-value="data.SeedQualityReq || ''" direction="vertical"
          @update:model-value="onFieldChange('SeedQualityReq', $event || null)">
          <RadioOption v-for="opt in aswOptions" :key="opt.code" :value="opt.code" :label="opt.label" />
          <RadioOption value="" label="Not applicable" />
        </RadioGroup>


      </div>
    </SectionAccordion>

    <!-- Additional info -->
    <SectionAccordion v-if="data.Material_AddInfo" number="2.4" title="Additional information" :open="false">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <Editor
          :model-value="data.Material_AddInfo || ''"
          :api-key="apiKey"
          :init="init"
          @update:model-value="onFieldChange('Material_AddInfo', $event)"
        />
      </div>
    </SectionAccordion>
  </div>
  <!-- Chapter-level Preview -->
  <ChapterPreview v-if="data" :loading="previewLoading" @refresh="handleRefresh">
    <div v-if="previewError" style="color: #D32F2F; font-size: 13px">⚠ {{ previewError }}</div>
    <div v-else-if="previewHtml" v-html="previewHtml" />
  </ChapterPreview>
</template>