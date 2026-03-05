<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useDashboardStore } from '@/stores/dashboard';
import type { DashboardTab } from '@/stores/dashboard';
import { Tabs, Spinner, PaginationNav } from 'upov-ui';
import type { TabItem, DataTableSortState } from 'upov-ui';
import type { TgUser } from '@/types';
import TestGuidelinesTable from '@/components/common/TestGuidelinesTable.vue';

const store = useDashboardStore();

// Filtering, Sorting + Pagination — same pattern as UsersView
const filterValues = ref<Record<string, string>>({});
const sortState = ref<DataTableSortState>({ key: '', direction: null });
const currentPage = ref(1);
const itemsPerPage = 20;

const hasPagination = computed(() => store.activeTab !== 'active');

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
  if (!hasPagination.value) return sortedItems.value;
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

function onPageChange(page: number) {
  currentPage.value = page;
}

const tabs = computed<TabItem[]>(() => [
  { id: 'active', label: 'Active' },
  { id: 'adopted', label: 'Adopted' },
  { id: 'archived', label: 'Archived' },
]);

const statusOptionsMap: Record<DashboardTab, { value: string; label: string }[]> = {
  active: [
    { value: 'LED', label: 'LE Draft' },
    { value: 'IEC', label: 'IE Comments' },
    { value: 'LEC', label: 'LE Checking' },
    { value: 'LES', label: 'LE Signed Off' },
  ],
  adopted: [
    { value: 'ADT', label: 'Adopted' },
    { value: 'ABT', label: 'Aborted' },
  ],
  archived: [
    { value: 'STU', label: 'Submitted' },
    { value: 'ARC', label: 'Archived' },
  ],
};

const statusOptions = computed(() => statusOptionsMap[store.activeTab]);

function onTabChange(tab: TabItem) {
  filterValues.value = {};
  sortState.value = { key: '', direction: null };
  currentPage.value = 1;
  store.setTab(tab.id as DashboardTab);
}

function onRowSelect(id: number) {
  store.selectTg(id);
}

// Detail panel
const interestedExperts = computed<TgUser[]>(() => {
  if (!store.selectedTgDetail?.users) return [];
  return store.selectedTgDetail.users
    .filter((u) => u.role === 'IE')
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
});

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

onMounted(() => {
  store.fetchStats();
  store.fetchTestGuidelines();
});
</script>

<template>
  <div class="dashboard">
    <div class="table-section">
      <Tabs :tabs="tabs" :active-tab-id="store.activeTab" @tab-change="onTabChange" />

      <TestGuidelinesTable
        :items="displayedItems"
        :loading="store.loading"
        :selected-id="store.selectedTgId"
        :filter-values="filterValues"
        :sort-state="sortState"
        :status-options="statusOptions"
        @select="onRowSelect"
        @update:filter-values="filterValues = $event"
        @filter="onFilter"
        @sort="onSort"
      >
        <template #row-detail>
          <div class="detail-panel">
            <div v-if="store.detailLoading" class="detail-loading">
              <Spinner />
            </div>
            <template v-else-if="store.selectedTgDetail">
              <div class="detail-grid">
                <div class="detail-section">
                  <h4 class="detail-heading">Deadlines</h4>
                  <table class="detail-table">
                    <tbody>
                      <tr>
                        <td class="detail-label">LE Draft</td>
                        <td>{{ formatDate(store.selectedTgDetail.leDraftStart) }} - {{ formatDate(store.selectedTgDetail.leDraftEnd) }}</td>
                      </tr>
                      <tr>
                        <td class="detail-label">IE Comments</td>
                        <td>{{ formatDate(store.selectedTgDetail.ieCommentsStart) }} - {{ formatDate(store.selectedTgDetail.ieCommentsEnd) }}</td>
                      </tr>
                      <tr>
                        <td class="detail-label">LE Checking</td>
                        <td>{{ formatDate(store.selectedTgDetail.leCheckingStart) }} - {{ formatDate(store.selectedTgDetail.leCheckingEnd) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="detail-section">
                  <h4 class="detail-heading">Interested Experts ({{ interestedExperts.length }})</h4>
                  <ul v-if="interestedExperts.length" class="ie-list">
                    <li v-for="ie in interestedExperts" :key="ie.id" class="ie-item">
                      {{ ie.fullName }}<span v-if="ie.country" class="ie-country"> ({{ ie.country }})</span>
                    </li>
                  </ul>
                  <p v-else class="detail-empty">No interested experts assigned.</p>
                </div>
              </div>
              <div class="detail-grid detail-grid--bottom">
                <div class="detail-section">
                  <h4 class="detail-heading">IE Comments ({{ store.selectedTgDetail.ieCommentCount }})</h4>
                  <p v-if="!store.selectedTgDetail.ieCommentCount" class="detail-empty">No IE comments.</p>
                </div>
                <div class="detail-section">
                  <h4 class="detail-heading">Admin Comments</h4>
                  <p v-if="store.selectedTgDetail.adminComments" class="admin-comments">
                    {{ store.selectedTgDetail.adminComments }}
                  </p>
                  <p v-else class="detail-empty">No admin comments.</p>
                </div>
              </div>
            </template>
          </div>
        </template>

        <template v-if="hasPagination" #pagination>
          <PaginationNav
            :current-page="currentPage"
            :total-items="sortedItems.length"
            :items-per-page="itemsPerPage"
            @page-change="onPageChange"
          />
        </template>
      </TestGuidelinesTable>
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

.detail-panel {
  padding: 20px 24px;
}

.detail-loading {
  display: flex;
  justify-content: center;
  padding: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 32px;
}

.detail-grid--bottom {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-neutral-200);
}

.detail-heading {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}

.detail-table {
  width: 100%;
  font-size: 0.875rem;
}

.detail-table td {
  padding: 4px 0;
}

.detail-label {
  font-weight: 500;
  color: var(--color-text-secondary);
  width: 120px;
}

.ie-list {
  list-style: none;
  padding: 0;
  columns: 4;
  column-gap: 24px;
}

.ie-item {
  padding: 4px 0;
  font-size: 0.875rem;
  color: var(--color-text);
  break-inside: avoid;
}

.ie-country {
  color: var(--color-text-secondary);
}

.admin-comments {
  font-size: 0.875rem;
  color: var(--color-text);
  white-space: pre-wrap;
}

.detail-empty {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

</style>
