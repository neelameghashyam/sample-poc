<script setup lang="ts">
import { computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card, RadioGroup, RadioOption, Links } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { useTinymce } from '@/composables/useTinymce';
import { useChapterPreview } from '@/composables/useChapterPreview';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 200 });
const { previewHtml, previewLoading, previewError, needsRefresh, markDirty, handleRefresh } = useChapterPreview('01');

const data = computed(() => store.chapters['01']);

function onFieldChange(field: string, value: string | null | undefined) {
  store.autosave('01', field, value);
  markDirty();
}

function setRadio(field: string, value: 'Y' | 'N') {
  onFieldChange(field, value);
}
</script>

<template>
  <ChapterPreview
    v-if="data"
    :loading="previewLoading"
    :needs-refresh="needsRefresh"
    @refresh="handleRefresh"
  >
    <!-- ── Edit content goes in the named #edit slot ── -->
    <template #edit>
      <Card elevation="low">
        <div style="display: flex; flex-direction: column; gap: 12px">
          <h2 style="font-size: 18px; font-weight: 700; color: var(--color-neutral-800); line-height: 22px">
            1.1 Standard items are configured by default
          </h2>

          <Links :links="[
            { text: 'More than one species (GN3)' },
            { text: 'Different types or groups within a species or genus (GN4)' },
            { text: 'Family name (GN5)' },
            { text: 'Guidance for New Types and Species (GN6)' },
          ]" />

          <!-- Question 1.1.1 — SubjectClarificationIndicator -->
          <div style="display: flex; flex-direction: column; gap: 10px">
            <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">
              1.1.1 Subject clarification
            </h3>
            <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">
              Should clarification be provided that any other species or hybrids not explicitly
              covered by these Test Guidelines should be treated according to the provisions of
              document TGP/12 &quot;Guidance for New Types and Species&quot;?
              <span style="color: #D32F2F; margin-left: 2px">*</span>
            </p>
            <RadioGroup
              :model-value="data.SubjectClarificationIndicator"
              direction="horizontal"
              @update:model-value="setRadio('SubjectClarificationIndicator', $event)"
            >
              <RadioOption value="Y" label="Yes" />
              <RadioOption value="N" label="No" />
            </RadioGroup>
          </div>

          <!-- Question 1.1.2 — Sub_check -->
          <div style="display: flex; flex-direction: column; gap: 10px">
            <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">
              1.1.2 Additional characteristics
            </h3>
            <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">
              Might it be necessary to add additional characteristics or additional states of
              expressions for ornamental, fruit, industrial, vegetable, agricultural or other varieties?
              <span style="color: #D32F2F; margin-left: 2px">*</span>
            </p>
            <RadioGroup
              :model-value="data.Sub_check"
              direction="horizontal"
              @update:model-value="setRadio('Sub_check', $event)"
            >
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
        </div>
      </Card>
    </template>

    <!-- ── Preview HTML goes in the default slot (unchanged) ── -->
    <div v-if="previewError" style="color: #D32F2F; font-size: 13px">
      ⚠ {{ previewError }}
    </div>
    <div v-else-if="previewHtml" v-html="previewHtml" />
  </ChapterPreview>
</template>