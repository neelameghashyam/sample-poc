import { ref, onMounted } from 'vue';
import { useEditorStore } from '@/stores/editor';
import { editorApi } from '@/services/editor-api';

export function useChapterPreview(chapterNumber: string) {
  const store = useEditorStore();
  
  const previewHtml = ref<string | null>(null);
  const previewLoading = ref(false);
  const previewError = ref<string | null>(null);

  const needsRefresh = ref(false);

  /**
   * Call this after every successful autosave to flag the preview as stale.
   */
  function markDirty() {
    needsRefresh.value = true;
  }

  /**
   * Load the preview for the current chapter
   * @param lang - Language code (default: 'en')
   */
  async function loadPreview(lang: string = 'en') {
    if (!store.tgId) return;
    
    previewLoading.value = true;
    previewError.value = null;
    
    try {
      previewHtml.value = await editorApi.docPreview(store.tgId, chapterNumber, lang);
      needsRefresh.value = false; // preview is now up-to-date
    } catch (err: any) {
      previewError.value = err?.response?.data?.error?.message || 'Failed to load preview';
      console.error(`Chapter ${chapterNumber} preview error:`, err);
    } finally {
      previewLoading.value = false;
    }
  }

  /**
   * Refresh the preview (can be called by user action)
   * @param lang - Language code (default: 'en')
   */
  async function handleRefresh(lang: string = 'en') {
    await loadPreview(lang);
  }

  /**
   * Clear the preview and error state
   */
  function clearPreview() {
    previewHtml.value = null;
    previewError.value = null;
    needsRefresh.value = false;
  }

  // Auto-load preview when component mounts
  onMounted(() => {
    loadPreview('en');
  });

  return {
    previewHtml,
    previewLoading,
    previewError,
    needsRefresh,
    markDirty,
    handleRefresh,
    loadPreview,
    clearPreview,
  };
}