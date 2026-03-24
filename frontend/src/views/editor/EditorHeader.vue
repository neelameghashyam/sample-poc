<script setup lang="ts">
import { computed } from 'vue';
import { Card, Button } from 'upov-ui';
import SaveStatus from '@/components/common/SaveStatus.vue';
import { useEditorStore } from '@/stores/editor';

const store = useEditorStore();

const mainCommonName = computed(() => store.tg?.TG_Name ?? '');
const upovCodesStr = computed(() => store.upovCodes.map((uc) => uc.code).join('; '));
const documentName = computed(() => store.tg?.TG_Reference ?? '');
const lastUpdated = computed(() => {
  if (!store.tg?.TG_lastupdated) return '';
  const date = new Date(store.tg.TG_lastupdated);
  const now = new Date();
  const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  if (diffSecs < 60) return 'Saved: a few seconds ago';
  if (diffMins === 1) return 'Saved: a minute ago';
  if (diffMins < 60) return `Saved: ${diffMins} minutes ago`;
  const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `Saved: ${datePart}, ${timePart}`;
});
</script>

<template>
  <Card elevation="low" padding="compact">
    <div class="header-row">
      <!-- Left: name + code inline -->
      <div class="header-info">
        <span class="header-name">{{ mainCommonName }}</span>
        <span class="header-divider">·</span>
        <span class="header-code">{{ upovCodesStr }}</span>
      </div>

      <!-- Right: doc ref + save status + submit -->
      <div class="header-actions">
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
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.header-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary-green-dark);
  line-height: 20px;
  white-space: nowrap;
}

.header-divider {
  font-size: 14px;
  color: var(--color-neutral-300);
}

.header-code {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-neutral-500);
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.header-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.header-doc-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-neutral-500);
  line-height: 16px;
}
</style>