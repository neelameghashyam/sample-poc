<script setup lang="ts">
import { ref } from 'vue';
import { FooterAtom } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { editorApi } from '@/services/editor-api';

const store = useEditorStore();

const importLoading = ref(false);
const importError   = ref<string | null>(null);
const selectedLang  = ref('en');

const languages = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
];

async function handleImport() {
  if (!store.tgId || importLoading.value) return;

  importLoading.value = true;
  importError.value   = null;

  try {
    const { blob, contentType, contentDisposition } = await editorApi.docGenerate(
      store.tgId,
      selectedLang.value,
    );

    // Derive filename from Content-Disposition or fall back to a sensible default
    let filename = `document-${store.tgId}.docx`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i);
      if (match) filename = decodeURIComponent(match[1].trim());
    } else if (contentType.includes('pdf')) {
      filename = `document-${store.tgId}.pdf`;
    } else if (contentType.includes('html')) {
      filename = `document-${store.tgId}.html`;
    }

    // Trigger browser download
    const url = URL.createObjectURL(new Blob([blob], { type: contentType }));
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err: any) {
    importError.value =
      err?.response?.data?.error?.message || 'Failed to generate document. Please try again.';
  } finally {
    importLoading.value = false;
  }
}
</script>

<template>
  <div>
    <!-- Language + Import controls -->
    <div style="
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 8px 16px 0;
    ">
      <!-- Language selector -->
      <div style="position: relative; display: flex; align-items: center;">
        <select
          v-model="selectedLang"
          :disabled="importLoading"
          style="
            appearance: none;
            -webkit-appearance: none;
            background: #ffffff;
            border: 1px solid var(--color-neutral-300, #d1d5db);
            border-radius: 5px;
            padding: 5px 28px 5px 10px;
            font-size: 13px;
            font-weight: 500;
            color: var(--color-neutral-700, #374151);
            cursor: pointer;
            outline: none;
            line-height: 1.4;
            min-width: 110px;
          "
          :style="importLoading ? { opacity: '0.5', cursor: 'not-allowed' } : {}"
        >
          <option v-for="lang in languages" :key="lang.value" :value="lang.value">
            {{ lang.label }}
          </option>
        </select>
        <!-- Chevron -->
        <span style="
          position: absolute; right: 8px; pointer-events: none;
          display: flex; align-items: center;
          color: var(--color-neutral-500, #6b7280);
          font-size: 10px;
        ">▾</span>
      </div>

      <!-- Import button -->
      <button
        @click="handleImport"
        :disabled="importLoading"
        style="
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--color-primary-green-dark, #1C4240);
          color: #ffffff;
          border: none;
          border-radius: 5px;
          padding: 5px 14px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Figtree', sans-serif;
          cursor: pointer;
          line-height: 1.4;
          white-space: nowrap;
          transition: background 0.15s, opacity 0.15s;
        "
        :style="importLoading ? { opacity: '0.65', cursor: 'not-allowed' } : {}"
        @mouseenter="(e) => { if (!importLoading) (e.currentTarget as HTMLElement).style.background = '#163533'; }"
        @mouseleave="(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-primary-green-dark, #1C4240)'; }"
      >
        <!-- Spinner while loading -->
        <span v-if="importLoading" style="
          width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: footer-spin 0.65s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        " />
        <!-- Download icon at rest -->
        <svg v-else width="13" height="13" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
          <path d="M8 1v9M4 7l4 4 4-4M2 13h12" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ importLoading ? 'Generating…' : 'Import' }}</span>
      </button>
    </div>

    <!-- Inline error message -->
    <div
      v-if="importError"
      style="
        margin: 6px 16px 0;
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
      <span>⚠ {{ importError }}</span>
      <button
        @click="importError = null"
        style="background: none; border: none; cursor: pointer; color: #D32F2F; font-size: 16px; line-height: 1; padding: 0;"
      >&times;</button>
    </div>

    <!-- FooterAtom for chapter navigation -->
    <FooterAtom
      :has-previous-chapter="store.activeChapterIndex > 0"
      :has-next-chapter="store.activeChapterIndex < 10"
      export-label="Export"
      @previous-chapter="store.goPrevious()"
      @next-chapter="store.goNext()"
    />
  </div>
</template>

<style scoped>
@keyframes footer-spin {
  to { transform: rotate(360deg); }
}
</style>