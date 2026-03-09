<script setup lang="ts">
import { ref, computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { RadioGroup, RadioOption, Input } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { editorApi } from '@/services/editor-api';
import { useTinymce } from '@/composables/useTinymce';
import SectionAccordion from '@/components/editor/shared/SectionAccordion.vue';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 200 });

const data = computed(() => store.chapters['04']);

function onFieldChange(field: string, value: any) {
  store.autosave('04', field, value);
}

const previewHtml = ref<string | null>(null);
const previewLoading = ref(false);
const previewError = ref<string | null>(null);

async function handleRefresh(lang: string) {
  if (!store.tgId) return;
  previewLoading.value = true;
  previewError.value = null;
  try {
    previewHtml.value = await editorApi.docPreview(store.tgId, '04', lang);
  } catch (err: any) {
    previewError.value = err?.response?.data?.error?.message || 'Failed to load preview';
  } finally {
    previewLoading.value = false;
  }
}
</script>

<template>
  <div v-if="data" style="display: flex; flex-direction: column; gap: 12px">

    <!-- 4.1 Distinctness -->
    <SectionAccordion number="4.1" title="Distinctness" :open="true">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <!-- Hybrid parent formula -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">4.1.1 Hybrid parent formula</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Does the TG cover hybrid varieties with a known parent formula?</p>
          <RadioGroup :model-value="data.IsHybridParentFormula" direction="horizontal"
            @update:model-value="onFieldChange('IsHybridParentFormula', $event)">
            <RadioOption value="Y" label="Yes" />
            <RadioOption value="N" label="No" />
          </RadioGroup>
        </div>

        <!-- Hybrid variety -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">4.1.2 Hybrid variety</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Does the TG cover hybrid varieties?</p>
          <RadioGroup :model-value="data.IsHybridVariety" direction="horizontal"
            @update:model-value="onFieldChange('IsHybridVariety', $event)">
            <RadioOption value="Y" label="Yes" />
            <RadioOption value="N" label="No" />
          </RadioGroup>
        </div>

        <!-- Additional distinctness info -->
        <div style="display: flex; flex-direction: column; gap: 6px">
          <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">Additional distinctness information</label>
          <Editor
            :model-value="data.DistinctnessAddInfo || ''"
            :api-key="apiKey"
            :init="init"
            @update:model-value="onFieldChange('DistinctnessAddInfo', $event)"
          />
        </div>

      </div>
    </SectionAccordion>

    <!-- 4.2 Uniformity -->
    <SectionAccordion number="4.2" title="Uniformity">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <!-- Type of propagation -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">4.2.1 Type of propagation</h3>
          <RadioGroup :model-value="data.typeOfPropagation" direction="vertical"
            @update:model-value="onFieldChange('typeOfPropagation', $event)">
            <RadioOption value="seed-propagated" label="Seed-propagated varieties" />
            <RadioOption value="vegetatively-propagated" label="Vegetatively propagated varieties" />
            <RadioOption value="both" label="Both seed and vegetatively propagated" />
          </RadioGroup>
        </div>

        <!-- More than one method of propagation -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">4.2.2 Propagation methods</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Is there more than one method of propagation?</p>
          <RadioGroup :model-value="data.IsOneMethodOfPropogation" direction="horizontal"
            @update:model-value="onFieldChange('IsOneMethodOfPropogation', $event)">
            <RadioOption value="Y" label="Yes" />
            <RadioOption value="N" label="No" />
          </RadioGroup>
        </div>

        <!-- Uniformity plant counts -->
        <div style="display: flex; gap: 16px; flex-wrap: wrap">
          <Input :model-value="data.SinglePlant || ''" placeholder="20" label="Single plant count" size="small"
            @update:model-value="onFieldChange('SinglePlant', $event)" />
          <Input :model-value="data.PartsPlant || ''" placeholder="2" label="Parts of plant" size="small"
            @update:model-value="onFieldChange('PartsPlant', $event)" />
        </div>

      </div>
    </SectionAccordion>

    <!-- 4.3 Stability -->
    <SectionAccordion number="4.3" title="Stability">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <div style="display: flex; flex-direction: column; gap: 6px">
          <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">Stability additional information</label>
          <Editor
            :model-value="data.StabilityAddInfo || ''"
            :api-key="apiKey"
            :init="init"
            @update:model-value="onFieldChange('StabilityAddInfo', $event)"
          />
        </div>

      </div>
    </SectionAccordion>
  </div>

  <!-- Chapter-level Preview -->
  <ChapterPreview v-if="data" :loading="previewLoading" @refresh="handleRefresh">
    <div v-if="previewError" style="color: #D32F2F; font-size: 13px">⚠ {{ previewError }}</div>
    <div v-else-if="previewHtml" v-html="previewHtml" />
    <div v-else><div style="display: flex; flex-direction: column; gap: 10px">
      <div v-if="data.IsHybridParentFormula"><strong>4.1.1 Hybrid parent formula:</strong> {{ data.IsHybridParentFormula === 'Y' ? 'Yes' : 'No' }}</div>
      <div v-if="data.IsHybridVariety"><strong>4.1.2 Hybrid variety:</strong> {{ data.IsHybridVariety === 'Y' ? 'Yes' : 'No' }}</div>
      <div v-if="data.DistinctnessAddInfo">
        <strong>4.1 Additional distinctness info:</strong>
        <div v-html="data.DistinctnessAddInfo" style="margin-top:4px"></div>
      </div>
      <div v-if="data.typeOfPropagation"><strong>4.2.1 Type of propagation:</strong> {{ data.typeOfPropagation }}</div>
      <div v-if="data.IsOneMethodOfPropogation"><strong>4.2.2 More than one propagation method:</strong> {{ data.IsOneMethodOfPropogation === 'Y' ? 'Yes' : 'No' }}</div>
      <div v-if="data.SinglePlant"><strong>Single plant count:</strong> {{ data.SinglePlant }}</div>
      <div v-if="data.PartsPlant"><strong>Parts of plant:</strong> {{ data.PartsPlant }}</div>
      <div v-if="data.StabilityAddInfo">
        <strong>4.3 Stability additional info:</strong>
        <div v-html="data.StabilityAddInfo" style="margin-top:4px"></div>
      </div>
      <em v-if="!data.IsHybridParentFormula && !data.typeOfPropagation && !data.StabilityAddInfo">No content yet</em>
    </div></div>
  </ChapterPreview>
</template>
