<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { useTinymce } from '@/composables/useTinymce';
import { useChapterPreview } from '@/composables/useChapterPreview';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 200 });
const { previewHtml, previewLoading, previewError, needsRefresh, markDirty, handleRefresh } =
  useChapterPreview('00');

// Main Common Name(s) — editable, backed by tg.TG_Name
const mainCommonName = ref(store.tg?.TG_Name ?? '');
watch(
  () => store.tg?.TG_Name,
  (value) => {
    mainCommonName.value = value ?? '';
  },
);

// UPOV Code(s) — read-only
const upovCodesStr = computed(() =>
  store.upovCodes.map((uc) => uc.code).filter(Boolean).join('; '),
);

// Botanical Name(s) — read-only, keep inline HTML like <i>
const botanicalNames = computed(() =>
  store.upovCodes
    .map((uc) => (uc.botanicalName || '').replace(/<\/?p>/g, '').trim())
    .filter(Boolean)
    .join(', '),
);

// Associated UPOV Documents — rich text, backed by tg.Name_AssoDocInfo
const upovDocumentsContent = ref(store.tg?.Name_AssoDocInfo ?? '');
watch(
  () => store.tg?.Name_AssoDocInfo,
  (value) => {
    upovDocumentsContent.value = value ?? '';
  },
);

function onFieldChange(field: 'TG_Name' | 'Name_AssoDocInfo', value: string) {
  store.autosave('00', field, value);
  markDirty();
}

function onMainCommonNameChange(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  mainCommonName.value = value;
  onFieldChange('TG_Name', value);
}

function onDocumentsChange(content: string) {
  upovDocumentsContent.value = content;
  onFieldChange('Name_AssoDocInfo', content);
}
</script>

<template>
  <ChapterPreview
    v-if="store.tg"
    :loading="previewLoading"
    :needs-refresh="needsRefresh"
    @refresh="handleRefresh"
  >
    <template #edit>
      <Card elevation="low">
        <div style="display: flex; flex-direction: column; gap: 16px">
          <h2
            style="
              font-size: 18px;
              font-weight: 700;
              color: var(--color-neutral-800);
              line-height: 22px;
              margin: 0;
            "
          >
            C. Cover Page Information
          </h2>

          <div style="display: flex; flex-direction: column; gap: 6px">
            <label
              for="cover-main-name"
              style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)"
            >
              Main Common Name(s)
            </label>
            <input
              id="cover-main-name"
              type="text"
              :value="mainCommonName"
              :disabled="!store.canEdit"
              placeholder="Enter main common name"
              style="
                height: 40px;
                max-width: 480px;
                padding: 0 12px;
                border: 1px solid var(--color-neutral-300);
                border-radius: 6px;
                font-size: 14px;
                color: var(--color-neutral-800);
                background: #fff;
                outline: none;
              "
              @input="onMainCommonNameChange"
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px">
            <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
              UPOV Code(s)
            </label>
            <div
              style="
                min-height: 40px;
                max-width: 480px;
                display: flex;
                align-items: center;
                padding: 8px 12px;
                border: 1px solid var(--color-neutral-200);
                border-radius: 6px;
                background: var(--color-neutral-50);
                font-size: 14px;
                font-weight: 600;
                color: var(--color-primary-green-dark, #1c4240);
              "
            >
              {{ upovCodesStr || '—' }}
            </div>
            <span style="font-size: 12px; color: var(--color-neutral-500)">
              Managed via UPOV codes
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px">
            <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
              Botanical Name(s)
            </label>
            <div
              style="
                min-height: 40px;
                max-width: 480px;
                display: flex;
                align-items: center;
                padding: 8px 12px;
                border: 1px solid var(--color-neutral-200);
                border-radius: 6px;
                background: var(--color-neutral-50);
                font-size: 14px;
                font-weight: 600;
                color: var(--color-primary-green-dark, #1c4240);
              "
              v-html="botanicalNames || '—'"
            />
            <span style="font-size: 12px; color: var(--color-neutral-500)">
              Managed via UPOV codes
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px">
            <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
              Please indicate other associated UPOV documents
            </label>
            <Editor
              :model-value="upovDocumentsContent"
              :api-key="apiKey"
              :init="init"
              :disabled="!store.canEdit"
              @update:model-value="onDocumentsChange"
            />
          </div>
        </div>
      </Card>
    </template>

    <div v-if="previewError" style="color: #d32f2f; font-size: 13px">
      ⚠ {{ previewError }}
    </div>
    <div v-else-if="previewHtml" v-html="previewHtml" />
  </ChapterPreview>
</template>