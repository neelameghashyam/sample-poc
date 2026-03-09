<script setup lang="ts">
import { computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { RadioGroup, RadioOption } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
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
  <ChapterPreview v-if="data">
    <div style="display: flex; flex-direction: column; gap: 10px">
      <div v-if="data.Material_Supplied">
        <strong>2.1 Form of material:</strong>
        <div v-html="data.Material_Supplied" style="margin-top: 4px"></div>
      </div>
      <div v-if="data.Min_Plant_Material">
        <strong>2.2 Minimum quantity:</strong>
        <div v-html="data.Min_Plant_Material" style="margin-top: 4px"></div>
      </div>
      <div v-if="data.SeedQualityReq">
        <strong>2.3 Seed Quality Requirement:</strong> {{ data.SeedQualityReq }}
      </div>
      <div v-if="data.Material_AddInfo">
        <strong>2.4 Additional information:</strong>
        <div v-html="data.Material_AddInfo" style="margin-top: 4px"></div>
      </div>
      <em v-if="!data.Material_Supplied && !data.Min_Plant_Material && !data.SeedQualityReq && !data.Material_AddInfo">No content yet</em>
    </div>
  </ChapterPreview>
</template>