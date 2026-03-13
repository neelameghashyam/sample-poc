<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useDashboardStore } from '@/stores/dashboard';
import { useConfigStore } from '@/stores/config';
import { PaginationNav } from 'upov-ui';
import type { DataTableSortState, ActionMenuItem } from 'upov-ui';
import TestGuidelinesTable from '@/components/common/TestGuidelinesTable.vue';

const store = useDashboardStore();
const configStore = useConfigStore();
const tableRef = ref<InstanceType<typeof TestGuidelinesTable> | null>(null);

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    tableRef.value?.toggleFilters('name');
  }
}

const downloadAction: ActionMenuItem[] = [
  { id: 'download', label: 'Download Word', icon: 'download' },
];

function onAction(actionId: string, tgId: number) {
  if (actionId === 'download') {
    const baseUrl = configStore.config?.services.docGenerateUrl || '';
    window.open(`${baseUrl}/doc-generate/${tgId}`, '_blank');
  }
}

const filterValues = ref<Record<string, string>>({});
const sortState = ref<DataTableSortState>({ key: '', direction: null });
const currentPage = ref(1);
const itemsPerPage = 20;

const statusOptions = [
  { value: 'ADT', label: 'Adopted' },
  { value: 'ABT', label: 'Aborted' },
];

const filteredItems = computed(() => {
  const filters = filterValues.value;
  const keys = Object.keys(filters).filter((k) => filters[k]);
  if (keys.length === 0) return store.testGuidelines;
  return store.testGuidelines.filter((row) =>
    keys.every((key) => {
      if (key === 'upovCodes') {
        return row.upovCodes?.some((c) =>
          c.toLowerCase().includes(filters[key].toLowerCase()),
        );
      }
      if (key === 'twps') {
        return row.twps
          ?.split(',')
          .map((t) => t.trim())
          .includes(filters[key]);
      }
      if (key === 'status') {
        return row.status === filters[key];
      }
      const cell = String((row as any)[key] ?? '').toLowerCase();
      return cell.includes(filters[key].toLowerCase());
    }),
  );
});

const sortedItems = computed(() => {
  const { key, direction } = sortState.value;
  if (!key || !direction) return filteredItems.value;
  const dir = direction === 'asc' ? 1 : -1;
  return [...filteredItems.value].sort((a, b) => {
    const aVal = (a as any)[key] ?? '';
    const bVal = (b as any)[key] ?? '';
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return cmp * dir;
  });
});

const displayedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return sortedItems.value.slice(start, start + itemsPerPage);
});

function onFilter(values: Record<string, string>) {
  filterValues.value = values;
  currentPage.value = 1;
}

function onSort(state: DataTableSortState) {
  sortState.value = state;
  currentPage.value = 1;
}

onMounted(() => {
  store.setTab('adopted');
  store.fetchStats();
  document.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <TestGuidelinesTable
    ref="tableRef"
    :items="displayedItems"
    :loading="store.loading"
    :filter-values="filterValues"
    :sort-state="sortState"
    :status-options="statusOptions"
    status-label="Status"
    :date-column="{ key: 'adoptionDate', label: 'Adoption Date' }"
    :actions="downloadAction"
    @action="onAction"
    @update:filter-values="filterValues = $event"
    @filter="onFilter"
    @sort="onSort"
  >
    <template #pagination>
      <PaginationNav
        :current-page="currentPage"
        :total-items="sortedItems.length"
        :items-per-page="itemsPerPage"
        @page-change="currentPage = $event"
      />
    </template>
  </TestGuidelinesTable>
</template>
