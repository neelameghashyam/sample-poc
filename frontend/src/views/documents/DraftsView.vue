<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDashboardStore } from '@/stores/dashboard';
import { SidePanel, PaginationNav, Spinner, Toggle, StatCard } from 'upov-ui';
import type { DataTableSortState, TabItem } from 'upov-ui';
import type { IeComment } from '@/types';
import TestGuidelinesTable from '@/components/common/TestGuidelinesTable.vue';

const store = useDashboardStore();
const router = useRouter();
const tableRef = ref<InstanceType<typeof TestGuidelinesTable> | null>(null);

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    tableRef.value?.focusSearch();
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
const sortState = ref<DataTableSortState>({ key: 'lastUpdated', direction: 'desc' });
const search = ref('');
const searchPlaceholder = computed(() => `Search ${twpCards.find(c => c.code === activeTwp.value)?.label ?? 'All'}...`);

const statusOptions = [
  { value: 'LED', label: 'LE Draft' },
  { value: 'IEC', label: 'IE Comments' },
  { value: 'LEC', label: 'LE Checking' },
  { value: 'LES', label: 'LE Signed Off' },
];

const filterValues = ref<Record<string, string>>({});

function buildParams() {
  const params: Record<string, string | number> = {
    page: store.meta.page,
    limit: store.meta.limit,
  };
  if (search.value) params.search = search.value;
  if (activeTwp.value && activeTwp.value !== 'all') params.twp = activeTwp.value;
  if (sortState.value.direction) params.order = sortState.value.direction;
  if (filterValues.value.status) params.status_filter = filterValues.value.status;
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

function onFilter(values: Record<string, string>) {
  filterValues.value = values;
  store.meta.page = 1;
  load();
}

function onPageChange(page: number) {
  store.meta.page = page;
  load();
}

watch(activeTwp, () => {
  store.meta.page = 1;
  load();
});

// Side panel
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
  document.addEventListener('keydown', onKeydown);
  store.activeTab = 'active';
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
  <div class="active-layout">
    <div class="active-view" :style="{ marginRight: panelOpen ? '360px' : '0' }">
      <div class="stat-cards">
        <StatCard
          v-for="card in twpCards"
          :key="card.code"
          :label="card.label"
          :count="card.code === 'all' ? (store.stats.active || 0) : (store.stats.twpCounts?.active?.[card.code] || 0)"
          :active="activeTwp === card.code"
          :loading="store.statsLoading"
          @click="activeTwp = card.code"
        />
      </div>

      <TestGuidelinesTable
        ref="tableRef"
        :items="store.testGuidelines"
        :loading="store.loading"
        :selected-id="store.selectedTgId"
        :filter-values="filterValues"
        :sort-state="sortState"
        :status-options="statusOptions"
        status-label="Status"
        show-deadline-column
        searchable
        :search-placeholder="searchPlaceholder"
        @select="onRowSelect"
        @update:filter-values="filterValues = $event"
        @filter="onFilter"
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

    <Transition name="slide-panel">
      <SidePanel
        v-if="panelOpen"
        :open="panelOpen"
        :tabs="panelTabs"
        width="360px"
        class="active-panel"
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

            <h5 class="detail-heading">UPOV Code(s)</h5>
            <p v-if="store.selectedTgDetail.upovCodes?.length" class="detail-value">
              {{ store.selectedTgDetail.upovCodes.join(', ') }}
            </p>
            <p v-else class="detail-value detail-empty">—</p>

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
    </Transition>
  </div>
</template>

<style scoped>
.active-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: margin-right 0.3s ease;
}

.active-panel {
  position: fixed;
  top: 48px;
  right: 0;
  height: calc(100vh - 48px);
  z-index: 10;
}

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.3s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);
}

.stat-cards {
  display: flex;
  gap: 12px;
}

.stat-cards :deep(.stat-card) {
  flex: 1;
}

.active-view :deep(.data-table__wrapper) {
  background: var(--color-bg-white);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
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

.detail-value {
  font-size: 0.875rem;
  margin: 0;
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
