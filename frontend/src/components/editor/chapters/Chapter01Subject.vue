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

const botanicalNames = computed(() =>
  store.upovCodes
    .map((uc) => uc.botanicalName.replace(/<\/?p>/g, '').trim())
    .join(', '),
);

</script>

<template>
  <ChapterPreview
    v-if="data"
    :loading="previewLoading"
    :needs-refresh="needsRefresh"
    @refresh="handleRefresh"
  >
    <template #edit>
      <Card elevation="low">
        <div style="display: flex; flex-direction: column; gap: 16px">

          <!-- Section heading -->
          <h2 style="font-size: 18px; font-weight: 700; color: var(--color-neutral-800); line-height: 22px">
            1. Subject of these Test Guidelines
          </h2>

          <!-- Static intro sentence: "These Test Guidelines apply to all varieties of {botanical_name}" -->
          <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px">
            These Test Guidelines apply to all varieties of
            <strong>{{ botanicalNames  || '…' }}</strong>
          </p>

          <!-- Continuation sentence (maps to Sub_OtherInfo / continueSentenceInfo) -->
          <div style="display: flex; flex-direction: column; gap: 6px">
            <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
              Continue Sentence
            </label>
            <Editor
              :model-value="data.Sub_OtherInfo || ''"
              :api-key="apiKey"
              :init="{ ...init, height: 120 }"
              @update:model-value="onFieldChange('Sub_OtherInfo', $event)"
            />
          </div>

          <!-- Reference links (GN3–GN6) -->
          <Links :links="[
            { text: 'More than one species (GN3)' },
            { text: 'Different types or groups within a species or genus (GN4)' },
            { text: 'Family name (GN5)' },
            { text: 'Guidance for New Types and Species (GN6)' },
          ]" />

          <!-- ── Question 1.1.1 — Subject Clarification (SubjectClarificationIndicator) ── -->
          <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--color-neutral-200); border-radius: 8px;">
            <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px; margin: 0">
              1.1.1 Subject clarification
            </h3>
            <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
              Should clarification be provided that any other species or hybrids not explicitly
              covered by these Test Guidelines should be treated according to the provisions of
              document TGP/12 "Guidance for New Types and Species"?
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

            <!-- Conditional: species category text input when SubjectClarificationIndicator = Y -->
            <!-- Maps to SubjectSpeciesCategory / subjectSpeciesCategoriesValue in legacy -->
            <div
              v-if="data.SubjectClarificationIndicator === 'Y'"
              style="display: flex; flex-direction: column; gap: 6px; padding-top: 4px"
            >
              <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                Guidance on the use of Test Guidelines for
                <input
                  type="text"
                  :value="data.SubjectSpeciesCategory || ''"
                  maxlength="250"
                  placeholder="Enter species / category"
                  style="display: inline-block; width: 220px; margin: 0 6px; padding: 4px 8px; border: 1px solid var(--color-neutral-300); border-radius: 4px; font-size: 14px;"
                  @input="onFieldChange('SubjectSpeciesCategory', ($event.target as HTMLInputElement).value)"
                />
                that are not explicitly covered by Test Guidelines is provided in document
                TGP/13 "Guidance for New Types and Species".
                <a href="#" style="color: #496D31; font-size: 13px; margin-left: 4px">(ASW 0)</a>
              </p>
            </div>
          </div>

          <!-- ── Question 1.1.2 — Additional Characteristics (Sub_check) ── -->
          <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--color-neutral-200); border-radius: 8px;">
            <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px; margin: 0">
              1.1.2 Additional characteristics
            </h3>
            <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
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

            <!-- Conditional: ASW 0 text + Sub_DD_Value dropdown when Sub_check = Y -->
            <!-- Maps to subDropdownValue / SUB_DD_VALUE in legacy -->
            <div
              v-if="data.Sub_check === 'Y'"
              style="display: flex; flex-direction: column; gap: 6px; padding-top: 4px"
            >
              <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                In the case of
                <input
                  type="text"
                  :value="data.Sub_DD_Value || ''"
                  maxlength="250"
                  placeholder="Enter variety type"
                  style="display: inline-block; width: 220px; margin: 0 6px; padding: 4px 8px; border: 1px solid var(--color-neutral-300); border-radius: 4px; font-size: 14px;"
                  @input="onFieldChange('Sub_DD_Value', ($event.target as HTMLInputElement).value)"
                />
                , in particular, it may be necessary to use additional characteristics or
                additional states of expression to those included in the Table of Characteristics
                in order to examine Distinctness, Uniformity and Stability.
                <a href="#" style="color: #496D31; font-size: 13px; margin-left: 4px">(ASW 0)</a>
              </p>
            </div>
          </div>

          <!-- Additional information (Sub_Add_Info / additional_Information in legacy) -->
          <!-- Togglable rich-text block -->
          <div style="display: flex; flex-direction: column; gap: 6px">
            <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
              Additional information
              <span style="font-size: 12px; font-weight: 400; color: var(--color-neutral-500); margin-left: 6px">
                (optional paragraph)
              </span>
            </label>
            <Editor
              :model-value="data.Sub_Add_Info || ''"
              :api-key="apiKey"
              :init="init"
              @update:model-value="onFieldChange('Sub_Add_Info', $event)"
            />
          </div>

        </div>
      </Card>
    </template>

    <!-- Preview slot -->
    <div v-if="previewError" style="color: #D32F2F; font-size: 13px">
      ⚠ {{ previewError }}
    </div>
    <div v-else-if="previewHtml" v-html="previewHtml" />
  </ChapterPreview>
</template>