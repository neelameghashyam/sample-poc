<script setup lang="ts">
import { ref } from 'vue';
import { FooterAtom } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { editorApi } from '@/services/editor-api';

const store = useEditorStore();

const exportLoading = ref(false);
const exportError   = ref<string | null>(null);

async function handleExport() {
  if (!store.tgId || exportLoading.value) return;

  exportLoading.value = true;
  exportError.value   = null;

  try {
    const { blob, contentType, contentDisposition } = await editorApi.docGenerate(
      store.tgId,
      'en',
    );

    let filename = `document-${store.tgId}.docx`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i);
      if (match) filename = decodeURIComponent(match[1].trim());
    } else if (contentType.includes('pdf')) {
      filename = `document-${store.tgId}.pdf`;
    } else if (contentType.includes('html')) {
      filename = `document-${store.tgId}.html`;
    }

    const url = URL.createObjectURL(new Blob([blob], { type: contentType }));
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err: any) {
    exportError.value =
      err?.response?.data?.error?.message || 'Failed to generate document. Please try again.';
  } finally {
    exportLoading.value = false;
  }
}
</script>

<template>
  <div>
    <!-- Inline error message -->
    <div
      v-if="exportError"
      style="
        margin: 6px 16px;
        padding: 6px 10px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 5px;
        font-size: 12px;
        color: #D32F2F;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      "
    >
      <span>⚠ {{ exportError }}</span>
      <button
        @click="exportError = null"
        style="background: none; border: none; cursor: pointer; color: #D32F2F; font-size: 16px; line-height: 1; padding: 0;"
      >&times;</button>
    </div>

    <FooterAtom
      :has-previous-chapter="store.activeChapterIndex > 0"
      :has-next-chapter="store.activeChapterIndex < 10"
      :export-label="exportLoading ? 'Exporting…' : 'Export'"
      @previous-chapter="store.goPrevious()"
      @next-chapter="store.goNext()"
      @export="handleExport"
    />
  </div>
</template>