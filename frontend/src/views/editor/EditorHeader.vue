<script setup lang="ts">
import { ref, computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card, Button } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { useTinymce } from '@/composables/useTinymce';

const store = useEditorStore();
const { apiKey, init: tinymceInit } = useTinymce({ height: 200 });

const showDetails = ref(false);
const upovDocumentsContent = ref('');

function toggleDetails() {
  showDetails.value = !showDetails.value;
}

const mainCommonName = computed(() => store.tg?.TG_Name ?? '');
const upovCodesStr = computed(() =>
  store.upovCodes.map((uc) => uc.code).join('; '),
);
const botanicalNames = computed(() =>
  store.upovCodes.map((uc) => uc.botanicalName).join(', '),
);
const documentName = computed(() => store.tg?.TG_Reference ?? '');
const lastUpdated = computed(() => {
  if (!store.tg?.TG_lastupdated) return '';
  return `Saved: ${new Date(store.tg.TG_lastupdated).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
});

// Initialize upov docs content from store
if (store.tg?.Name_AssoDocInfo) {
  upovDocumentsContent.value = store.tg.Name_AssoDocInfo;
}

function onDocumentsChange(content: string) {
  store.autosave('tg', 'Name_AssoDocInfo', content);
}
</script>

<template>
  <Card elevation="low" padding="compact">
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--color-neutral-200, #E2E2E2)">
      <div style="display: flex; align-items: flex-start; gap: 48px; flex: 1; flex-wrap: wrap">
        <div style="display: flex; flex-direction: column; gap: 4px">
          <span style="font-size: 14px; font-weight: 400; color: var(--color-neutral-500); line-height: 18px">Main Common Name(s):</span>
          <span style="font-size: 22px; font-weight: 700; color: var(--color-primary-green-dark); line-height: 27px">{{ mainCommonName }}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px">
          <span style="font-size: 14px; font-weight: 400; color: var(--color-neutral-500); line-height: 18px">UPOV Code(s):</span>
          <span style="font-size: 16px; font-weight: 600; color: var(--color-primary-green-dark); line-height: 20px">{{ upovCodesStr }}</span>
        </div>
      </div>
      <Button type="primary" icon-left="check-circle">Submit</Button>
    </div>

    <Transition name="slide">
      <div v-if="showDetails" style="padding: 16px 0; border-bottom: 1px solid var(--color-neutral-200, #E2E2E2); display: flex; flex-direction: column; gap: 20px">
        <div style="display: flex; flex-direction: column; gap: 6px">
          <span style="font-size: 14px; font-weight: 400; color: var(--color-neutral-500); line-height: 18px">Botanical Name(s):</span>
          <p style="font-weight: 700; font-size: 15px; line-height: 20px; color: var(--color-primary-green-dark)">{{ botanicalNames }}</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px">
          <span style="font-size: 14px; font-weight: 400; color: var(--color-neutral-500); line-height: 18px">Please indicate other associated UPOV documents:</span>
          <Editor
            v-model="upovDocumentsContent"
            :api-key="apiKey"
            :init="tinymceInit"
            @update:model-value="onDocumentsChange"
          />
        </div>
      </div>
    </Transition>

    <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px">
      <Button type="tertiary" :icon-left="showDetails ? 'chevron-up' : 'chevron-down'" @click="toggleDetails">
        {{ showDetails ? 'Less details' : 'More details' }}
      </Button>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px">
        <span style="font-size: 13px; font-weight: 600; color: var(--color-neutral-500)">{{ documentName }}</span>
        <span v-if="store.saveStatus === 'saving'" class="save-status save-status--saving">
          <span class="save-spinner" /> Saving...
        </span>
        <span v-else-if="store.saveStatus === 'saved'" class="save-status save-status--saved">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="var(--color-primary-green-bright, #009A6E)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Saved
        </span>
        <span v-else-if="store.saveStatus === 'error'" class="save-status save-status--error" @click="store.dismissSaveError()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 4v3M7 9h.01" stroke="#D32F2F" stroke-width="1.5" stroke-linecap="round"/></svg>
          Save failed
        </span>
        <span v-else style="font-size: 12px; font-weight: 400; color: var(--color-neutral-500)">{{ lastUpdated }}</span>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: max-height 0.3s ease, opacity 0.25s ease; overflow: hidden; max-height: 700px; }
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; }

/* Save status indicator */
.save-status { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 500; }
.save-status--saving { color: var(--color-neutral-500); }
.save-status--saved { color: var(--color-primary-green-bright); }
.save-status--error { color: #D32F2F; cursor: pointer; }
.save-status--error:hover { text-decoration: underline; }
.save-spinner {
  width: 12px; height: 12px; border: 2px solid var(--color-neutral-300); border-top-color: var(--color-primary-green-dark);
  border-radius: 50%; animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
