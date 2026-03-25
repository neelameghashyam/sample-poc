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

const data = computed(() => store.chapters['00'] ?? {});

function onFieldChange(field: string, value: string | null | undefined) {
  store.autosave('00', field, value);
  markDirty();
}

const upovCodesStr = computed(() =>
  store.upovCodes.map((uc) => uc.code).filter(Boolean).join('; '),
);

const botanicalNames = computed(() =>
  store.upovCodes
    .map((uc) => (uc.botanicalName || '').replace(/<\/?p>/g, '').trim())
    .filter(Boolean)
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

          <!-- Section heading — mirrors Chapter 01's h2 style -->
          <h2 style="font-size: 18px; font-weight: 700; color: var(--color-neutral-800); line-height: 22px">
            0. Name and UPOV Information
          </h2>

          <!-- ── 0.1 Main Common Name(s) ── -->
          <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--color-neutral-200); border-radius: 8px;">
            <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px; margin: 0">
              0.1 Main Common Name(s)
            </h3>
            <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
              Enter the main common name used to identify this crop in these Test Guidelines.
              <span style="color: #D32F2F; margin-left: 2px">*</span>
            </p>
            <input
              type="text"
              :value="(data as any).TG_Name || ''"
              :disabled="!store.canEdit"
              placeholder="Enter main common name"
              maxlength="250"
              style="height: 40px; width: 100%; padding: 0 12px; border: 1px solid var(--color-neutral-300); border-radius: 6px; font-size: 14px; color: var(--color-neutral-800); background: #fff; outline: none; box-sizing: border-box;"
              @input="onFieldChange('TG_Name', ($event.target as HTMLInputElement).value)"
            />
          </div>

          <!-- ── 0.2 UPOV Code(s) — read-only ── -->
          <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--color-neutral-200); border-radius: 8px;">
            <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px; margin: 0">
              0.2 UPOV Code(s)
            </h3>
            <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
              The UPOV code(s) associated with this Test Guideline. Managed centrally via the UPOV codes panel.
            </p>
            <div style="min-height: 40px; display: flex; align-items: center; padding: 8px 12px; border: 1px solid var(--color-neutral-200); border-radius: 6px; background: var(--color-neutral-50); font-size: 14px; font-weight: 600; color: var(--color-primary-green-dark, #1c4240);">
              {{ upovCodesStr || '—' }}
            </div>
            <span style="font-size: 12px; color: var(--color-neutral-500)">
              Read-only — managed via UPOV codes
            </span>
          </div>

          <!-- ── 0.3 Botanical Name(s) — read-only ── -->
          <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--color-neutral-200); border-radius: 8px;">
            <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px; margin: 0">
              0.3 Botanical Name(s)
            </h3>
            <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
              The botanical name(s) derived from the associated UPOV codes. Managed centrally via the UPOV codes panel.
            </p>
            <div
              style="min-height: 40px; display: flex; align-items: center; padding: 8px 12px; border: 1px solid var(--color-neutral-200); border-radius: 6px; background: var(--color-neutral-50); font-size: 14px; font-weight: 600; color: var(--color-primary-green-dark, #1c4240);"
              v-html="botanicalNames || '—'"
            />
            <span style="font-size: 12px; color: var(--color-neutral-500)">
              Read-only — managed via UPOV codes
            </span>
          </div>

          <!-- ── 0.4 Other associated UPOV documents ── -->
          <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--color-neutral-200); border-radius: 8px;">
            <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px; margin: 0">
              0.4 Associated UPOV documents
            </h3>
            <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
              Please indicate other associated UPOV documents relevant to these Test Guidelines.
              <span style="font-size: 12px; font-weight: 400; color: var(--color-neutral-500); margin-left: 6px">(optional)</span>
            </p>
            <Editor
              :model-value="(data as any).Name_AssoDocInfo || ''"
              :api-key="apiKey"
              :init="init"
              :disabled="!store.canEdit"
              @update:model-value="onFieldChange('Name_AssoDocInfo', $event)"
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