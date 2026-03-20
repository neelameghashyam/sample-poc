<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDashboardStore } from '@/stores/dashboard';
import { useConfigStore } from '@/stores/config';
import { PaginationNav, StatCard } from 'upov-ui';
import type { DataTableSortState, ActionMenuItem } from 'upov-ui';
import TestGuidelinesTable from '@/components/common/TestGuidelinesTable.vue';

const store = useDashboardStore();
const router = useRouter();
const configStore = useConfigStore();

const downloadAction: ActionMenuItem[] = [
  { id: 'download', label: 'Download Word', icon: 'download' },
];

function onAction(actionId: string, tgId: number) {
  if (actionId === 'download') {
    const baseUrl = configStore.config?.services.docGenerateUrl || '';
    window.open(`${baseUrl}/doc-generate/${tgId}`, '_blank');
  }
}

// TWP cards
const twpCards = [
  { code: 'all', label: 'All' },
  { code: 'TWA', label: 'TWA' },
  { code: 'TWF', label: 'TWF' },
  { code: 'TWO', label: 'TWO' },
  { code: 'TWV', label: 'TWV' },
];
function twpFromHash(): string {
  const hash = window.location.hash.slice(1).toLowerCase();
  const match = twpCards.find(c => c.code.toLowerCase() === hash);
  return match?.code || 'all';
}
const activeTwp = ref(twpFromHash());

watch(activeTwp, (code) => {
  router.replace({ hash: `#${code.toLowerCase()}` });
});

// Server-side state
const sortState = ref<DataTableSortState>({ key: 'statusDate', direction: 'desc' });
const search = ref('');
const searchPlaceholder = computed(() => `Search ${twpCards.find(c => c.code === activeTwp.value)?.label ?? 'All'}...`);

function buildParams() {
  const params: Record<string, string | number> = {
    page: store.meta.page,
    limit: store.meta.limit,
  };
  if (search.value) params.search = search.value;
  if (activeTwp.value && activeTwp.value !== 'all') params.twp = activeTwp.value;
  if (sortState.value.direction) params.order = sortState.value.direction;
  return params;
}

function load() {
  store.fetchTestGuidelines(buildParams());
}

function onSearch(value: string) {
  search.value = value;
  store.meta.page = 1;
  load();
}

function onSort(state: DataTableSortState) {
  sortState.value = state;
  store.meta.page = 1;
  load();
}

function onPageChange(page: number) {
  store.meta.page = page;
  load();
}

const tableRef = ref<InstanceType<typeof TestGuidelinesTable> | null>(null);

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    tableRef.value?.focusSearch();
  }
}

watch(activeTwp, () => {
  store.meta.page = 1;
  load();
});

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  store.activeTab = 'submitted';
  store.fetchStats();
  store.meta.page = 1;
  store.meta.limit = 9;
  load();
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <div class="submitted-view">
    <div class="stat-cards">
      <StatCard
        v-for="card in twpCards"
        :key="card.code"
        :label="card.label"
        :count="card.code === 'all' ? (store.stats.submitted || 0) : (store.stats.twpCounts?.submitted?.[card.code] || 0)"
        :active="activeTwp === card.code"
        :loading="store.statsLoading"
        @click="activeTwp = card.code"
      />
    </div>

    <TestGuidelinesTable
      ref="tableRef"
      :items="store.testGuidelines"
      :loading="store.loading"
      :sort-state="sortState"
      :date-column="{ key: 'statusDate', label: 'Sent to UPOV Date' }"
      :actions="downloadAction"

      searchable
      :search-placeholder="searchPlaceholder"
      @action="onAction"
      @sort="onSort"
      @search="onSearch"
    >
      <template #pagination>
        <PaginationNav
          v-if="store.meta.total > store.meta.limit"
          :current-page="store.meta.page"
          :total-items="store.meta.total"
          :items-per-page="store.meta.limit"
          @page-change="onPageChange"
        />
      </template>
    </TestGuidelinesTable>
  </div>
</template>

<style scoped>
.submitted-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-cards {
  display: flex;
  gap: 12px;
}

.stat-cards :deep(.stat-card) {
  flex: 1;
}

.submitted-view :deep(.data-table__wrapper) {
  background: var(--color-bg-white);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
</style>
