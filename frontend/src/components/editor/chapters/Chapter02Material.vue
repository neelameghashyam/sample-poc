<script setup lang="ts">
import { ref, computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Radiobutton } from 'upov-ui';
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

}
</script>

<template>
  <div v-if="data" style="display: flex; flex-direction: column; gap: 12px">
    <!-- 2.1 Form of material -->
    <SectionAccordion number="2.1" title="Form of material">
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
    <SectionAccordion number="2.2" title="Minimum quantity of plant material">
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
        <div style="display: flex; flex-direction: column; gap: 12px">
          <span
            v-for="opt in aswOptions"
            :key="opt.code"
            style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 16px; color: var(--color-neutral-800)"
            @click="onFieldChange('SeedQualityReq', opt.code)"
          >
            <Radiobutton :model-value="data.SeedQualityReq === opt.code" />
            <span>{{ opt.label }}</span>
          </span>
          <span style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 16px; color: var(--color-neutral-800)" @click="onFieldChange('SeedQualityReq', null)">
            <Radiobutton :model-value="!data.SeedQualityReq" />
            <span>Not applicable</span>
          </span>
        </div>
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

    <!-- ── Chapter-level Preview (end of chapter) ── -->
    <ChapterPreview :chapter-number="2" />
  </div>
</template>
