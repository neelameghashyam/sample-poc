<script setup lang="ts">
import { ref, computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card, Button } from 'upov-ui';
import SaveStatus from '@/components/common/SaveStatus.vue';
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

  const date = new Date(store.tg.TG_lastupdated);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);

  let timeStr: string;

  if (diffSecs < 60) {
    timeStr = 'a few seconds ago';
  } else if (diffMins === 1) {
    timeStr = 'a minute ago';
  } else if (diffMins < 60) {
    timeStr = `${diffMins} minutes ago`;
  } else {
    // ≥ 1 hour: show full date and time
    const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
    timeStr = `${datePart}, ${timePart}`;
  }

  return `Saved: ${timeStr}`;
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
    <div class="header-top">
      <div class="header-fields">
        <div class="header-field">
          <span class="header-label">Main Common Name(s):</span>
          <span class="header-value header-value--lg">{{ mainCommonName }}</span>
        </div>
        <div class="header-field">
          <span class="header-label">UPOV Code(s):</span>
          <span class="header-value">{{ upovCodesStr }}</span>
        </div>
      </div>
      <Button type="primary" icon-left="check-circle">Submit</Button>
    </div>

    <Transition name="slide">
      <div v-if="showDetails" class="header-details">
        <div class="header-field">
          <span class="header-label">Botanical Name(s):</span>
          <p class="header-value header-value--bold">{{ botanicalNames }}</p>
        </div>
        <div class="header-field">
          <span class="header-label">Please indicate other associated UPOV documents:</span>
          <Editor
            v-model="upovDocumentsContent"
            :api-key="apiKey"
            :init="tinymceInit"
            @update:model-value="onDocumentsChange"
          />
        </div>
      </div>
    </Transition>

    <div class="header-footer">
      <Button type="tertiary" :icon-left="showDetails ? 'chevron-up' : 'chevron-down'" @click="toggleDetails">
        {{ showDetails ? 'Less details' : 'More details' }}
      </Button>
      <div class="header-meta">
        <span class="header-doc-name">{{ documentName }}</span>
        <SaveStatus :status="store.saveStatus" :idle-message="lastUpdated" />
      </div>
    </div>
  </Card>
</template>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: max-height 0.3s ease, opacity 0.25s ease; overflow: hidden; max-height: 700px; }
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; }

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-neutral-200, #E2E2E2);
}

.header-fields {
  display: flex;
  align-items: flex-start;
  gap: 48px;
  flex: 1;
  flex-wrap: wrap;
}

.header-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-label {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-neutral-500);
  line-height: 18px;
}

.header-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary-green-dark);
  line-height: 20px;
  margin: 0;
}

.header-value--lg {
  font-size: 22px;
  font-weight: 700;
  line-height: 27px;
}

.header-value--bold {
  font-weight: 700;
  font-size: 15px;
  line-height: 20px;
}

.header-details {
  padding: 16px 0;
  border-bottom: 1px solid var(--color-neutral-200, #E2E2E2);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-details .header-field {
  gap: 6px;
}

.header-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
}

.header-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.header-doc-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-neutral-500);
}
</style>