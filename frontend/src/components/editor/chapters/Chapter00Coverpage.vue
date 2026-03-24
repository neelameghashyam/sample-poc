<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { useTinymce } from '@/composables/useTinymce';
import { useChapterPreview } from '@/composables/useChapterPreview';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';

const store = useEditorStore();
const { apiKey, init: tinymceInit } = useTinymce({ height: 200 });
const { previewHtml, previewLoading, previewError, needsRefresh, markDirty, handleRefresh } =
  useChapterPreview('00');

// ── Field values ────────────────────────────────────────────────────────────

// Main Common Name — editable, backed by tg.TG_Name
const mainCommonName = ref(store.tg?.TG_Name ?? '');
watch(() => store.tg?.TG_Name, (v) => { mainCommonName.value = v ?? ''; });

function onMainCommonNameChange(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  mainCommonName.value = val;
  store.autosave('00', 'TG_Name', val);
  markDirty();
}

// UPOV Code(s) — derived from upovCodes (read-only display, codes managed elsewhere)
const upovCodesStr = computed(() => store.upovCodes.map((uc) => uc.code).join('; '));

// Botanical Name(s) — derived from upovCodes (read-only, managed via UPOV codes)
const botanicalNames = computed(() =>
  store.upovCodes
    .map((uc) => uc.botanicalName.replace(/<\/?p>/g, '').trim())
    .join(', '),
);

// Associated UPOV Documents — editable rich text, backed by tg.Name_AssoDocInfo
const upovDocumentsContent = ref(store.tg?.Name_AssoDocInfo ?? '');
watch(() => store.tg?.Name_AssoDocInfo, (v) => { upovDocumentsContent.value = v ?? ''; });

function onDocumentsChange(content: string) {
  upovDocumentsContent.value = content;
  store.autosave('00', 'Name_AssoDocInfo', content);
  markDirty();
}
</script>

<template>
  <ChapterPreview
    :loading="previewLoading"
    :needs-refresh="needsRefresh"
    @refresh="handleRefresh"
  >
    <template #edit>
      <Card elevation="low">
        <div class="cover-fields">

          <!-- Main Common Name(s) -->
          <div class="cover-field">
            <label class="cover-label" for="cover-main-name">Main Common Name(s)</label>
            <input
              id="cover-main-name"
              class="cover-input"
              type="text"
              :value="mainCommonName"
              :disabled="!store.canEdit"
              placeholder="Enter main common name"
              @input="onMainCommonNameChange"
            />
          </div>

          <!-- UPOV Code(s) — read-only, derived -->
          <div class="cover-field">
            <label class="cover-label">UPOV Code(s)</label>
            <div class="cover-readonly">{{ upovCodesStr || '—' }}</div>
            <span class="cover-hint">Managed via UPOV codes</span>
          </div>

          <!-- Botanical Name(s) — read-only, derived -->
          <div class="cover-field">
            <label class="cover-label">Botanical Name(s)</label>
            <div class="cover-readonly" v-html="botanicalNames || '—'" />
            <span class="cover-hint">Managed via UPOV codes</span>
          </div>

          <!-- Associated UPOV Documents — rich text editor -->
          <div class="cover-field">
            <label class="cover-label">Please indicate other associated UPOV documents</label>
            <Editor
              :model-value="upovDocumentsContent"
              :api-key="apiKey"
              :init="tinymceInit"
              :disabled="!store.canEdit"
              @update:model-value="onDocumentsChange"
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

<style scoped>
.cover-fields {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.cover-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cover-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-neutral-700, #3d3d3d);
  line-height: 18px;
}

.cover-input {
  height: 40px;
  padding: 0 12px;
  font-size: 14px;
  font-family: 'Figtree', 'Segoe UI', Arial, sans-serif;
  color: var(--color-neutral-800, #1a1a1a);
  background: #fff;
  border: 1px solid var(--color-neutral-300, #c9c9c9);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.15s;
  max-width: 480px;
}

.cover-input:focus {
  border-color: var(--color-primary-green-dark, #1c4240);
  box-shadow: 0 0 0 3px rgba(28, 66, 64, 0.1);
}

.cover-input:disabled {
  background: var(--color-neutral-50, #f7f7f7);
  color: var(--color-neutral-500, #7a7a7a);
  cursor: not-allowed;
}

.cover-readonly {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary-green-dark, #1c4240);
  line-height: 20px;
  padding: 8px 12px;
  background: var(--color-neutral-50, #f7f7f7);
  border: 1px solid var(--color-neutral-200, #e2e2e2);
  border-radius: 6px;
  max-width: 480px;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.cover-hint {
  font-size: 12px;
  color: var(--color-neutral-400, #a0a0a0);
  line-height: 16px;
}
</style>