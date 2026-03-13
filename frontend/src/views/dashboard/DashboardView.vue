<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useDashboardStore } from '@/stores/dashboard';
import { SidePanelLayout, SidePanel, Spinner, Toggle } from 'upov-ui';
import type { DataTableSortState, TabItem } from 'upov-ui';
import type { IeComment } from '@/types';
import TestGuidelinesTable from '@/components/common/TestGuidelinesTable.vue';

const store = useDashboardStore();
const tableRef = ref<InstanceType<typeof TestGuidelinesTable> | null>(null);

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    tableRef.value?.toggleFilters('name');
  }
}

const filterValues = ref<Record<string, string>>({});
const sortState = ref<DataTableSortState>({ key: '', direction: null });

const statusOptions = [
  { value: 'LED', label: 'LE Draft' },
  { value: 'IEC', label: 'IE Comments' },
  { value: 'LEC', label: 'LE Checking' },
  { value: 'LES', label: 'LE Signed Off' },
];

const panelTabs: TabItem[] = [
  { label: 'Details', id: 'details' },
  { label: 'IE Comments', id: 'comments' },
];

const panelTabCounts = computed<Record<string, number | null>>(() => ({
  details: null,
  comments: store.ieComments.length,
}));

const panelOpen = computed(() => store.selectedTgId != null);

const commentSort = ref<'left' | 'right'>('left');

interface CommentGroup {
  title: string;
  comments: IeComment[];
}

const groupedComments = computed<CommentGroup[]>(() => {
  const map = new Map<string, IeComment[]>();
  for (const c of store.ieComments) {
    let key: string;
    if (commentSort.value === 'right') {
      key = c.ieName + (c.ieCountry ? ` (${c.ieCountry})` : '');
    } else {
      key = [c.chapterName, c.sectionName].filter(Boolean).join(' / ');
    }
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return Array.from(map.entries()).map(([title, comments]) => ({ title, comments }));
});

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

function onFilter(values: Record<string, string>) {
  filterValues.value = values;
}

function onSort(state: DataTableSortState) {
  sortState.value = state;
}

function onRowSelect(id: number) {
  store.selectTg(id);
}

function onPanelClose() {
  store.selectTg(store.selectedTgId!);
}

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

onMounted(() => {
  store.setTab('active');
  store.fetchStats();
  document.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <SidePanelLayout :open="panelOpen" panel-width="360px" class="active-layout">
    <TestGuidelinesTable
      ref="tableRef"
      :items="sortedItems"
      :loading="store.loading"
      :selected-id="store.selectedTgId"
      :filter-values="filterValues"
      :sort-state="sortState"
      :status-options="statusOptions"
      @select="onRowSelect"
      @update:filter-values="filterValues = $event"
      @filter="onFilter"
      @sort="onSort"
    />

    <template #panel>
      <SidePanel
        :open="panelOpen"
        :tabs="panelTabs"
        width="100%"
        @close="onPanelClose"
      >
        <template #tab-label="{ tab }">
          {{ tab.label }} <span v-if="panelTabCounts[tab.id] != null" class="tab-sub">({{ panelTabCounts[tab.id] }})</span>
        </template>
        <template #tab-details>
          <div v-if="store.detailLoading" class="detail-loading">
            <Spinner />
          </div>
          <template v-else-if="store.selectedTgDetail">
            <h4 class="panel-title">{{ store.selectedTgDetail.reference }}</h4>
            <p class="panel-subtitle">{{ store.selectedTgDetail.name }}</p>

            <h5 class="detail-heading">Deadlines</h5>
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
          </template>
        </template>

        <template #tab-comments>
          <div v-if="store.ieCommentsLoading" class="detail-loading">
            <Spinner />
          </div>
          <template v-else>
            <div class="comments-header">
              <span class="comments-group-label">Group by:</span>
              <Toggle
                v-model="commentSort"
                :options="[
                  { label: 'Chapter', value: 'left' },
                  { label: 'Expert', value: 'right' },
                ]"
              />
            </div>
            <p v-if="!store.ieComments.length" class="detail-empty">No IE comments.</p>
            <div v-else class="comments-list">
              <div v-for="group in groupedComments" :key="group.title" class="comment-group">
                <div class="comment-group-title">{{ group.title }}</div>
                <div v-for="c in group.comments" :key="c.id" class="comment-item">
                  <div class="comment-item-header">
                    <span v-if="commentSort === 'left'" class="comment-ie">
                      {{ c.ieName }}<span v-if="c.ieCountry" class="comment-country"> ({{ c.ieCountry }})</span>
                    </span>
                    <span v-else class="comment-chapter-label">
                      {{ [c.chapterName, c.sectionName].filter(Boolean).join(' / ') }}
                    </span>
                    <span class="comment-date">{{ formatDate(c.lastUpdated) }}</span>
                  </div>
                  <div class="comment-body" v-html="c.comments" />
                </div>
              </div>
            </div>
          </template>
        </template>
      </SidePanel>
    </template>
  </SidePanelLayout>
</template>

<style scoped>
.active-layout {
  height: calc(100vh - 64px - 48px - 42px);
}

.detail-loading {
  display: flex;
  justify-content: center;
  padding: 16px;
}

.panel-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.panel-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 4px 0 16px;
}

.detail-heading {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-secondary);
  margin: 16px 0 8px;
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
  width: 100px;
}

.detail-empty {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.comments-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}

.comments-group-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-group-title {
  font-size: .8rem;
  font-weight: 600;
  color: var(--color-primary-green-dark);
  background: color-mix(in srgb,var(--color-primary-green) 12%,transparent) !important;
  padding: 6px 2px;
  border-radius: 4px;
}

.comment-item {
  padding: 6px 0 6px 8px;
  border-bottom: 1px solid var(--color-neutral-200);
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-item-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}

.comment-ie {
  font-size: 0.8rem;
  font-weight: 500;
}

.comment-chapter-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.comment-country {
  color: var(--color-text-secondary);
  font-weight: 400;
}

.comment-body {
  font-size: 0.8rem;
  line-height: 1.5;
  margin-bottom: 2px;
}

.comment-body :deep(p) {
  margin: 0;
}

.comment-date {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
}
</style>
