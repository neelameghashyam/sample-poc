<script setup lang="ts">
import { computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Radiobutton, Input } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { useTinymce } from '@/composables/useTinymce';
import SectionAccordion from '@/components/editor/shared/SectionAccordion.vue';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 200 });

const data = computed(() => store.chapters['04']);

function onFieldChange(field: string, value: any) {
  store.autosave('04', field, value);
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
          <div style="display: flex; align-items: center; gap: 24px">
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('IsHybridParentFormula', 'Y')">
              <Radiobutton :model-value="data.IsHybridParentFormula === 'Y'" />
              <span>Yes</span>
            </span>
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('IsHybridParentFormula', 'N')">
              <Radiobutton :model-value="data.IsHybridParentFormula === 'N'" />
              <span>No</span>
            </span>
          </div>
        </div>

        <!-- Hybrid variety -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">4.1.2 Hybrid variety</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Does the TG cover hybrid varieties?</p>
          <div style="display: flex; align-items: center; gap: 24px">
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('IsHybridVariety', 'Y')">
              <Radiobutton :model-value="data.IsHybridVariety === 'Y'" />
              <span>Yes</span>
            </span>
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('IsHybridVariety', 'N')">
              <Radiobutton :model-value="data.IsHybridVariety === 'N'" />
              <span>No</span>
            </span>
          </div>
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

        <ChapterPreview empty-message="There is currently no information to fill in." />
      </div>
    </SectionAccordion>

    <!-- 4.2 Uniformity -->
    <SectionAccordion number="4.2" title="Uniformity">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <!-- Type of propagation -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">4.2.1 Type of propagation</h3>
          <div style="display: flex; flex-direction: column; gap: 12px">
            <span style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 16px; color: var(--color-neutral-800)" @click="onFieldChange('typeOfPropagation', 'seed-propagated')">
              <Radiobutton :model-value="data.typeOfPropagation === 'seed-propagated'" />
              <span>Seed-propagated varieties</span>
            </span>
            <span style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 16px; color: var(--color-neutral-800)" @click="onFieldChange('typeOfPropagation', 'vegetatively-propagated')">
              <Radiobutton :model-value="data.typeOfPropagation === 'vegetatively-propagated'" />
              <span>Vegetatively propagated varieties</span>
            </span>
            <span style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 16px; color: var(--color-neutral-800)" @click="onFieldChange('typeOfPropagation', 'both')">
              <Radiobutton :model-value="data.typeOfPropagation === 'both'" />
              <span>Both seed and vegetatively propagated</span>
            </span>
          </div>
        </div>

        <!-- More than one method of propagation -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">4.2.2 Propagation methods</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Is there more than one method of propagation?</p>
          <div style="display: flex; align-items: center; gap: 24px">
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('IsOneMethodOfPropogation', 'Y')">
              <Radiobutton :model-value="data.IsOneMethodOfPropogation === 'Y'" />
              <span>Yes</span>
            </span>
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('IsOneMethodOfPropogation', 'N')">
              <Radiobutton :model-value="data.IsOneMethodOfPropogation === 'N'" />
              <span>No</span>
            </span>
          </div>
        </div>

        <!-- Uniformity plant counts -->
        <div style="display: flex; gap: 16px; flex-wrap: wrap">
          <div style="width: 180px">
            <Input :model-value="data.SinglePlant || ''" placeholder="20" label="Single plant count"
              @update:model-value="onFieldChange('SinglePlant', $event)" />
          </div>
          <div style="width: 180px">
            <Input :model-value="data.PartsPlant || ''" placeholder="2" label="Parts of plant"
              @update:model-value="onFieldChange('PartsPlant', $event)" />
          </div>
        </div>

        <ChapterPreview empty-message="There is currently no information to fill in." />
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

        <ChapterPreview empty-message="There is currently no information to fill in." />
      </div>
    </SectionAccordion>
  </div>
</template>
