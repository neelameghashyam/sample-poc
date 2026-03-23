<script setup lang="ts">
import { computed } from 'vue';
import { Card, Button } from 'upov-ui';
import SaveStatus from '@/components/common/SaveStatus.vue';
import { useEditorStore } from '@/stores/editor';

const store = useEditorStore();

const mainCommonName = computed(() => store.tg?.TG_Name ?? '');
const upovCodesStr = computed(() =>
  store.upovCodes.map((uc) => uc.code).join('; '),
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
    const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
    timeStr = `${datePart}, ${timePart}`;
  }

  return `Saved: ${timeStr}`;
});
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
      <div class="header-right">
        <div class="header-meta">
          <span class="header-doc-name">{{ documentName }}</span>
          <SaveStatus :status="store.saveStatus" :idle-message="lastUpdated" />
        </div>
        <Button type="primary" icon-left="check-circle">Submit</Button>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
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

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
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