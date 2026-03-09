<script setup lang="ts">
import { computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { RadioGroup, RadioOption, Input } from 'upov-ui';
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
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">4.1.1 Hybrid parent formula</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Does the TG cover hybrid varieties with a known parent formula?</p>
          <RadioGroup :model-value="data.IsHybridParentFormula" direction="horizontal"
            @update:model-value="onFieldChange('IsHybridParentFormula', $event)">
            <RadioOption value="Y" label="Yes" />
            <RadioOption value="N" label="No" />
          </RadioGroup>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">4.1.2 Hybrid variety</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Does the TG cover hybrid varieties?</p>
          <RadioGroup :model-value="data.IsHybridVariety" direction="horizontal"
            @update:model-value="onFieldChange('IsHybridVariety', $event)">
            <RadioOption value="Y" label="Yes" />
            <RadioOption value="N" label="No" />
          </RadioGroup>
        </div>

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
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">4.2.1 Type of propagation</h3>
          <RadioGroup :model-value="data.typeOfPropagation" direction="vertical"
            @update:model-value="onFieldChange('typeOfPropagation', $event)">
            <RadioOption value="seed-propagated" label="Seed-propagated varieties" />
            <RadioOption value="vegetatively-propagated" label="Vegetatively propagated varieties" />
            <RadioOption value="both" label="Both seed and vegetatively propagated" />
          </RadioGroup>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">4.2.2 Propagation methods</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Is there more than one method of propagation?</p>
          <RadioGroup :model-value="data.IsOneMethodOfPropogation" direction="horizontal"
            @update:model-value="onFieldChange('IsOneMethodOfPropogation', $event)">
            <RadioOption value="Y" label="Yes" />
            <RadioOption value="N" label="No" />
          </RadioGroup>
        </div>

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

    <!-- Chapter-level Preview (one preview for the entire chapter) -->
    <ChapterPreview>
      <div style="display: flex; flex-direction: column; gap: 14px">
        <!-- 4.1 -->
        <div v-if="data.IsHybridParentFormula || data.IsHybridVariety || data.DistinctnessAddInfo">
          <strong style="font-size: 13px; text-transform: uppercase; color: #AD4E02; letter-spacing: 0.5px">4.1 Distinctness</strong>
          <p v-if="data.IsHybridParentFormula"><strong>Hybrid parent formula:</strong> {{ data.IsHybridParentFormula === 'Y' ? 'Yes' : 'No' }}</p>
          <p v-if="data.IsHybridVariety"><strong>Hybrid varieties covered:</strong> {{ data.IsHybridVariety === 'Y' ? 'Yes' : 'No' }}</p>
          <div v-if="data.DistinctnessAddInfo" v-html="data.DistinctnessAddInfo"></div>
        </div>
        <!-- 4.2 -->
        <div v-if="data.typeOfPropagation || data.IsOneMethodOfPropogation || data.SinglePlant || data.PartsPlant">
          <strong style="font-size: 13px; text-transform: uppercase; color: #AD4E02; letter-spacing: 0.5px">4.2 Uniformity</strong>
          <p v-if="data.typeOfPropagation"><strong>Propagation type:</strong> {{ data.typeOfPropagation }}</p>
          <p v-if="data.IsOneMethodOfPropogation"><strong>Multiple propagation methods:</strong> {{ data.IsOneMethodOfPropogation === 'Y' ? 'Yes' : 'No' }}</p>
          <p v-if="data.SinglePlant || data.PartsPlant"><strong>Plants:</strong> {{ data.SinglePlant }} single plants, {{ data.PartsPlant }} parts</p>
        </div>
        <!-- 4.3 -->
        <div v-if="data.StabilityAddInfo">
          <strong style="font-size: 13px; text-transform: uppercase; color: #AD4E02; letter-spacing: 0.5px">4.3 Stability</strong>
          <div v-html="data.StabilityAddInfo"></div>
        </div>
        <em v-if="!data.IsHybridParentFormula && !data.IsHybridVariety && !data.typeOfPropagation && !data.StabilityAddInfo">
          No content yet
        </em>
      </div>
    </ChapterPreview>
  </div>
</template>
