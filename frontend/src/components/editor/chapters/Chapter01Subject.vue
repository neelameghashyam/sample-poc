<script setup lang="ts">
import { ref, computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card, Radiobutton, Button } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { useTinymce } from '@/composables/useTinymce';
import { editorApi } from '@/services/editor-api';
import AddParagraphButton from '@/components/editor/shared/AddParagraphButton.vue';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 200 });

const data = computed(() => store.chapters['01']);
const refreshing = ref(false);

function onFieldChange(field: string, value: any) {
  store.autosave('01', field, value);
}

function setRadio(field: string, value: 'Y' | 'N') {
  onFieldChange(field, value);
}

async function refreshPreview() {
  refreshing.value = true;
  try {
    const res = await editorApi.open(store.tgId!);
    store.chapters['01'] = res.chapters['01'];
  } finally {
    refreshing.value = false;
  }
}
</script>

<template>
  <div v-if="data" style="display: flex; flex-direction: column; gap: 12px">
    <Card elevation="low">
      <div style="display: flex; flex-direction: column; gap: 12px">
        <h2 style="font-size: 18px; font-weight: 700; color: var(--color-neutral-800); line-height: 22px">1.1 Standard items are configured by default</h2>

        <div style="display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap">
          <span style="font-size: 13px; font-weight: 400; color: var(--color-neutral-800); white-space: nowrap">Related links:</span>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
            <a href="#" class="ext-link">
              More than one species (GN3)
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M4.875 2.438H2.438A1.063 1.063 0 0 0 1.375 3.5v7.063A1.063 1.063 0 0 0 2.438 11.624H9.5a1.063 1.063 0 0 0 1.063-1.062V8.125M7.813 1.375H11.625M11.625 1.375V5.188M11.625 1.375L4.875 8.125" stroke="var(--color-primary-green-dark, #1C4240)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
            <a href="#" class="ext-link">
              Different types or groups within a species or genus (GN4)
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M4.875 2.438H2.438A1.063 1.063 0 0 0 1.375 3.5v7.063A1.063 1.063 0 0 0 2.438 11.624H9.5a1.063 1.063 0 0 0 1.063-1.062V8.125M7.813 1.375H11.625M11.625 1.375V5.188M11.625 1.375L4.875 8.125" stroke="var(--color-primary-green-dark, #1C4240)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
            <a href="#" class="ext-link">
              Family name (GN5)
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M4.875 2.438H2.438A1.063 1.063 0 0 0 1.375 3.5v7.063A1.063 1.063 0 0 0 2.438 11.624H9.5a1.063 1.063 0 0 0 1.063-1.062V8.125M7.813 1.375H11.625M11.625 1.375V5.188M11.625 1.375L4.875 8.125" stroke="var(--color-primary-green-dark, #1C4240)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
            <a href="#" class="ext-link">
              Guidance for New Types and Species (GN6)
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M4.875 2.438H2.438A1.063 1.063 0 0 0 1.375 3.5v7.063A1.063 1.063 0 0 0 2.438 11.624H9.5a1.063 1.063 0 0 0 1.063-1.062V8.125M7.813 1.375H11.625M11.625 1.375V5.188M11.625 1.375L4.875 8.125" stroke="var(--color-primary-green-dark, #1C4240)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Question 1.1.1 — SubjectClarificationIndicator -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">1.1.1 Subject clarification</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">
            Should clarification be provided that any other species or hybrids not explicitly
            covered by these Test Guidelines should be treated according to the provisions of
            document TGP/12 "Guidance for New Types and Species"?
            <span style="color: #D32F2F; margin-left: 2px">*</span>
          </p>
          <div style="display: flex; align-items: center; gap: 24px">
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="setRadio('SubjectClarificationIndicator', 'Y')">
              <Radiobutton :model-value="data.SubjectClarificationIndicator === 'Y'" />
              <span>Yes</span>
            </span>
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="setRadio('SubjectClarificationIndicator', 'N')">
              <Radiobutton :model-value="data.SubjectClarificationIndicator === 'N'" />
              <span>No</span>
            </span>
          </div>
        </div>

        <!-- Question 1.1.2 — Sub_check -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">1.1.2 Additional characteristics</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">
            Might it be necessary to add additional characteristics or additional states of
            expressions for ornamental, fruit, industrial, vegetable, agricultural or other varieties?
            <span style="color: #D32F2F; margin-left: 2px">*</span>
          </p>
          <div style="display: flex; align-items: center; gap: 24px">
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="setRadio('Sub_check', 'Y')">
              <Radiobutton :model-value="data.Sub_check === 'Y'" />
              <span>Yes</span>
            </span>
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="setRadio('Sub_check', 'N')">
              <Radiobutton :model-value="data.Sub_check === 'N'" />
              <span>No</span>
            </span>
          </div>
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

        <!-- Paragraphs -->
        <AddParagraphButton />
      </div>
    </Card>

    <!-- ── Chapter-level Preview (end of chapter) ── -->
    <ChapterPreview>
      <div style="display: flex; flex-direction: column; gap: 12px">
        <div v-if="data.Sub_Add_Info">
          <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px">1.1.2 Additional characteristics</p>
          <div v-html="data.Sub_Add_Info"></div>
        </div>
        <div v-if="data.Sub_OtherInfo">
          <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px">Other information</p>
          <div v-html="data.Sub_OtherInfo"></div>
        </div>
        <em v-if="!data.Sub_Add_Info && !data.Sub_OtherInfo" style="color: var(--color-neutral-500)">No content yet</em>
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

<style scoped>
.ext-link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 13px; font-weight: 600; color: var(--color-primary-green-dark);
  text-decoration: underline; text-decoration-color: var(--color-primary-green-light);
  text-decoration-thickness: 2px; text-underline-offset: 2px;
  cursor: pointer; transition: opacity 0.15s;
}
.ext-link:hover { opacity: 0.7; }
</style>