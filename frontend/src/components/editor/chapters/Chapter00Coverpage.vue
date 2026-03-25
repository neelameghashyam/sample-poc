<script setup lang="ts">
import { computed } from 'vue';
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

// Ch00 data lives on store.tg (tgHeader), NOT store.chapters['00']
const tg = computed(() => store.tg);

function onFieldChange(field: string, value: string | null | undefined) {
  store.autosave('00', field, value);
  markDirty();
}

// UPOV Code(s) — read-only, managed via UPOV codes
const upovCodesStr = computed(() =>
  store.upovCodes.map((uc: any) => uc.code).filter(Boolean).join('; '),
);

// Botanical Name(s) — read-only, preserve inline HTML like <i>
const botanicalNames = computed(() =>
  store.upovCodes
    .map((uc: any) => (uc.botanicalName || '').replace(/<\/?p>/g, '').trim())
    .filter(Boolean)
    .join(', '),
);
</script>

<template>
  <ChapterPreview
    v-if="tg"
    :loading="previewLoading"
    :needs-refresh="needsRefresh"
    @refresh="handleRefresh"
  >
    <template #edit>
      <Card elevation="low">
        <div style="display: flex; flex-direction: column; gap: 16px">

          <!-- Main Common Name(s) -->
          <div style="display: flex; flex-direction: column; gap: 6px">
            <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
              Main Common Name(s)
            </label>
            <input
              type="text"
              :value="tg.TG_Name || ''"
              :disabled="!store.canEdit"
              placeholder="Enter main common name"
              maxlength="250"
              style="height: 40px; width: 100%; padding: 0 12px; border: 1px solid var(--color-neutral-300); border-radius: 6px; font-size: 14px; color: var(--color-neutral-800); background: #fff; outline: none;"
              @input="onFieldChange('TG_Name', ($event.target as HTMLInputElement).value)"
            />
          </div>

          <!-- UPOV Code(s) — read-only -->
          <div style="display: flex; flex-direction: column; gap: 6px">
            <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
              UPOV Code(s)
            </label>
            <div style="min-height: 40px; display: flex; align-items: center; padding: 8px 12px; border: 1px solid var(--color-neutral-200); border-radius: 6px; background: var(--color-neutral-50); font-size: 14px; font-weight: 600; color: var(--color-primary-green-dark, #1c4240);">
              {{ upovCodesStr || '—' }}
            </div>
            <span style="font-size: 12px; color: var(--color-neutral-500)">Managed via UPOV codes</span>
          </div>

          <!-- Botanical Name(s) — read-only -->
          <div style="display: flex; flex-direction: column; gap: 6px">
            <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
              Botanical Name(s)
            </label>
            <div
              style="min-height: 40px; display: flex; align-items: center; padding: 8px 12px; border: 1px solid var(--color-neutral-200); border-radius: 6px; background: var(--color-neutral-50); font-size: 14px; font-weight: 600; color: var(--color-primary-green-dark, #1c4240);"
              v-html="botanicalNames || '—'"
            />
            <span style="font-size: 12px; color: var(--color-neutral-500)">Managed via UPOV codes</span>
          </div>

          <!-- Other associated UPOV documents -->
          <div style="display: flex; flex-direction: column; gap: 6px">
            <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
              Please indicate other associated UPOV documents
            </label>
            <Editor
              :model-value="tg.Name_AssoDocInfo || ''"
              :api-key="apiKey"
              :init="init"
              :disabled="!store.canEdit"
              @update:model-value="onFieldChange('Name_AssoDocInfo', $event)"
            />
          </div>

        </div>
      </Card>
    </template>

    <div v-if="previewError" style="color: #D32F2F; font-size: 13px">⚠ {{ previewError }}</div>
    <div v-else-if="previewHtml" v-html="previewHtml" />
  </ChapterPreview>
</template>