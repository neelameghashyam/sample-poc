<script setup lang="ts">
import { ref, computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Radiobutton, Button } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { editorApi } from '@/services/editor-api';
import { useTinymce } from '@/composables/useTinymce';
import SectionAccordion from '@/components/editor/shared/SectionAccordion.vue';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 200 });

const data = computed(() => store.chapters['02']);
const refreshing = ref(false);

function onFieldChange(field: string, value: any) {
  store.autosave('02', field, value);
}

const aswOptions = computed(() => store.lookups?.aswOptions?.seedQuality ?? []);

async function refreshPreview() {
  refreshing.value = true;
  try {
    const res = await editorApi.open(store.tgId!);
    store.chapters['02'] = res.chapters['02'];
  } finally {
    refreshing.value = false;
  }
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
    <ChapterPreview>
      <div style="display: flex; flex-direction: column; gap: 14px">
        <div>
          <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px">2.1 Form of material</p>
          <div v-if="data.Material_Supplied" v-html="data.Material_Supplied"></div>
          <em v-else style="color: var(--color-neutral-500)">No content yet</em>
        </div>
        <div>
          <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px">2.2 Minimum quantity of plant material</p>
          <div v-if="data.Min_Plant_Material" v-html="data.Min_Plant_Material"></div>
          <em v-else style="color: var(--color-neutral-500)">No content yet</em>
        </div>
        <div>
          <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px">2.3 Seed Quality Requirements</p>
          <p v-if="data.SeedQualityReq">Selected: <strong>{{ data.SeedQualityReq }}</strong></p>
          <em v-else style="color: var(--color-neutral-500)">No seed quality requirement selected.</em>
        </div>
        <div v-if="data.Material_AddInfo">
          <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px">2.4 Additional information</p>
          <div v-html="data.Material_AddInfo"></div>
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
