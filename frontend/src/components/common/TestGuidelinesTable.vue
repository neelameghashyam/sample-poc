<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { DataTable, StatusBadge, ActionMenu } from 'upov-ui';
import type { DataTableColumn, DataTableSortState, StatusBadgeVariant, ActionMenuItem } from 'upov-ui';
import type { TGStatus, TestGuidelineListItem } from '@/types';

interface StatusOption {
  value: string;
  label: string;
}

interface Props {
  items?: TestGuidelineListItem[];
  loading?: boolean;
  selectedId?: number | null;
  filterValues?: Record<string, string>;
  sortState?: DataTableSortState;
  statusOptions?: StatusOption[];
  statusLabel?: string;
  actions?: ActionMenuItem[];
  dateColumn?: { key: string; label: string };
  showDeadlineColumn?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchDebounce?: number;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  loading: false,
  selectedId: null,
  filterValues: () => ({}),
  sortState: undefined,
  statusOptions: () => [],
  statusLabel: 'Status (Period)',
  // Edit action navigates to the editor; row click navigates to the preview route
  actions: () => [{ id: 'edit', label: 'Edit', icon: 'pencil' }],
  dateColumn: () => ({ key: 'lastUpdated', label: 'Last Updated' }),
  showDeadlineColumn: false,
  searchable: false,
  searchPlaceholder: 'Search...',
  searchDebounce: 300,
});

const emit = defineEmits<{
  select: [id: number];
  action: [actionId: string, tgId: number];
  'update:filterValues': [values: Record<string, string>];
  filter: [values: Record<string, string>];
  sort: [state: DataTableSortState];
  search: [value: string];
}>();

const router = useRouter();

// ── Columns ───────────────────────────────────────────────────────────────────
const columns = computed<DataTableColumn[]>(() => {
  const cols: DataTableColumn[] = [
    { key: 'reference', label: 'TG Reference', width: '180px' },
    { key: 'name', label: 'Common Name', width: '180px' },
  ];
  cols.push({ key: 'leadExpert', label: 'Leading Expert', width: '200px' });
  if (props.statusOptions.length) {
    cols.push({ key: 'status', label: props.statusLabel, width: '160px', filterable: true, filterType: 'select', filterOptions: props.statusOptions });
  }
  if (props.showDeadlineColumn) {
    cols.push({ key: 'periodEnd', label: 'Deadline', width: '120px' });
  }
  cols.push({ key: props.dateColumn.key, label: props.dateColumn.label, width: '140px', sortable: true });
  return cols;
});

import { STATUS_LABELS, STATUS_VARIANTS } from '@/config/constants';

function formatDate(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const dataTableRef = ref<InstanceType<typeof DataTable> | null>(null);

function toggleFilters(colKey?: string) {
  dataTableRef.value?.toggleFilters(colKey);
}

function focusSearch() {
  dataTableRef.value?.focusSearch();
}

defineExpose({ toggleFilters, focusSearch });

// ── Row click → navigate to the full-document preview page ───────────────────
function onRowClick(row: Record<string, any>) {
  emit('select', row.id);
  router.push({ name: 'tg-doc-preview', params: { id: row.id } });
}

// ── Action menu: Edit → navigate to editor; others bubble up ─────────────────
function onAction(actionId: string, tgId: number) {
  if (actionId === 'edit') {
    router.push(`/admin/test-guidelines/${tgId}`);
  } else {
    emit('action', actionId, tgId);
  }
}
</script>

<template>
  <DataTable
    ref="dataTableRef"
    :columns="columns"
    :rows="items"
    row-key="id"
    selectable
    :selected-row-key="selectedId"
    :loading="loading"
    :loading-rows="8"
    appearance="card"
    filter-mode="remote"
    :filter-values="filterValues"
    :sort-state="sortState"
    :searchable="searchable"
    :search-placeholder="searchPlaceholder"
    :search-debounce="searchDebounce"
    empty-message="No test guidelines found."
    @row-click="onRowClick"
    @update:filter-values="(vals: Record<string, string>) => emit('update:filterValues', vals)"
    @filter="(vals: Record<string, string>) => emit('filter', vals)"
    @sort="(state: DataTableSortState) => emit('sort', state)"
    @search="(value: string) => emit('search', value)"
  >
    <template #cell-reference="{ row }">
      <!-- Plain text — the whole row is the click target for preview navigation -->
      <span class="tg-reference">{{ row.reference }}</span>
    </template>

    <template #cell-leadExpert="{ row }">
      <template v-if="row.leadExpert">
        {{ row.leadExpert }}
        <span v-if="row.leadExpertCountry" class="expert-country"> ({{ row.leadExpertCountry }})</span>
      </template>
    </template>

    <template #cell-status="{ row }">
      <div class="status-cell">
        <StatusBadge
          :label="STATUS_LABELS[row.status as TGStatus] || row.status"
          :variant="STATUS_VARIANTS[row.status as TGStatus] || 'neutral'"
        />
        <span v-if="!showDeadlineColumn && (row.periodStart || row.periodEnd)" class="status-period">
          ({{ formatDate(row.periodStart) }} – {{ formatDate(row.periodEnd) }})
        </span>
      </div>
    </template>

    <template #cell-periodEnd="{ row }">
      {{ formatDate(row.periodEnd) }}
    </template>

    <template #cell-lastUpdated="{ row }">
      {{ formatDate(row.lastUpdated) }}
    </template>

    <template #cell-adoptionDate="{ row }">
      {{ formatDate(row.adoptionDate) }}
    </template>

    <template #cell-statusDate="{ row }">
      {{ formatDate(row.statusDate) }}
    </template>

    <template #row-actions="{ row }">
      <ActionMenu
        :items="actions"
        @select="(item: ActionMenuItem) => onAction(item.id, row.id)"
      />
    </template>

    <template #row-detail="{ row, index }">
      <slot name="row-detail" :row="row" :index="index" />
    </template>

    <template #pagination>
      <slot name="pagination" />
    </template>
  </DataTable>
</template>

<style scoped>
.expert-country {
  color: var(--color-text-secondary);
}

.status-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.status-period {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* Visually hints the reference is the row entry point */
.tg-reference {
  font-weight: 500;
  color: var(--color-primary, #2563eb);
}
</style>