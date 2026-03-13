<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Tabs } from 'upov-ui';
import type { TabItem } from 'upov-ui';
import { useDashboardStore } from '@/stores/dashboard';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const store = useDashboardStore();
const authStore = useAuthStore();

const allTabs: TabItem[] = [
  { id: 'active', label: 'Drafts' },
  { id: 'adopted', label: 'Adopted' },
  { id: 'archived', label: 'Archived' },
];

const tabs = computed(() =>
  authStore.isAdmin ? allTabs : allTabs.filter((t) => t.id !== 'adopted'),
);

const counts = computed<Record<string, number>>(() => ({
  active: store.stats.active,
  adopted: store.stats.adopted,
  archived: store.stats.archive,
}));

const activeTabId = computed(() => {
  const name = route.name as string;
  if (name === 'dashboard-adopted') return 'adopted';
  if (name === 'dashboard-archived') return 'archived';
  return 'active';
});

function onTabChange(tab: TabItem) {
  router.push({ name: `dashboard-${tab.id}` });
}
</script>

<template>
  <div class="dashboard">
    <div class="table-section">
      <Tabs :tabs="tabs" :active-tab-id="activeTabId" @tab-change="onTabChange">
        <template #tab-label="{ tab }">
          {{ tab.label }} <span class="tab-sub">({{ counts[tab.id] }})</span>
        </template>
      </Tabs>
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.table-section {
  background: var(--color-bg-white);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
</style>
