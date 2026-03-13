<script setup lang="ts">
import { computed, ref } from 'vue';
import { DataTable, StatusBadge, Chip, ActionMenu } from 'upov-ui';
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
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  loading: false,
  selectedId: null,
  filterValues: () => ({}),
  sortState: undefined,
  statusOptions: () => [],
  statusLabel: 'Status (Period)',
  actions: () => [{ id: 'edit', label: 'Edit', icon: 'pencil' }],
  dateColumn: () => ({ key: 'lastUpdated', label: 'Last Updated' }),
});

const emit = defineEmits<{
  select: [id: number];
  action: [actionId: string, tgId: number];
  'update:filterValues': [values: Record<string, string>];
  filter: [values: Record<string, string>];
  sort: [state: DataTableSortState];
}>();

const columns = computed<DataTableColumn[]>(() => [
  { key: 'reference', label: 'TG Reference', width: '180px', filterable: true },
  { key: 'name', label: 'Common Name', width: '180px', filterable: true },
  { key: 'twps', label: 'TWP', width: '140px', filterable: true, filterType: 'select', filterOptions: [
    { value: 'TWA', label: 'TWA' },
    { value: 'TWC', label: 'TWC' },
    { value: 'TWF', label: 'TWF' },
    { value: 'TWO', label: 'TWO' },
    { value: 'TWV', label: 'TWV' },
  ]},
  { key: 'upovCodes', label: 'UPOV Code(s)', width: '240px', filterable: true },
  { key: 'leadExpert', label: 'Leading Expert', width: '200px', filterable: true },
  { key: 'status', label: props.statusLabel, width: '160px', filterable: true, filterType: 'select', filterOptions: props.statusOptions },
  { key: props.dateColumn.key, label: props.dateColumn.label, width: '140px', sortable: true },
]);

const statusLabels: Record<TGStatus, string> = {
  LED: 'LE Draft',
  IEC: 'IE Comments',
  LEC: 'LE Checking',
  LES: 'LE Signed Off',
  ADT: 'Adopted',
  ABT: 'Aborted',
  SSD: 'Suspended',
  ARC: 'Archived',
  STU: 'Submitted',
  DEL: 'Deleted',
};

const statusVariants: Record<TGStatus, StatusBadgeVariant> = {
  LED: 'warning',
  IEC: 'info',
  LEC: 'success',
  LES: 'info',
  ADT: 'success',
  ABT: 'danger',
  SSD: 'neutral',
  ARC: 'neutral',
  STU: 'warning',
  DEL: 'danger',
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text: string, filter: string): string {
  if (!filter || !text) return text;
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const re = new RegExp(`(${escapeRegex(filter)})`, 'gi');
  return escaped.replace(re, '<mark class="data-table__mark">$1</mark>');
}

const dataTableRef = ref<InstanceType<typeof DataTable> | null>(null);

function toggleFilters(colKey?: string) {
  dataTableRef.value?.toggleFilters(colKey);
}

defineExpose({ toggleFilters });

function onRowClick(row: Record<string, any>) {
  emit('select', row.id);
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
    filter-mode="remote"
    :filter-values="filterValues"
    :sort-state="sortState"
    empty-message="No test guidelines found."
    @row-click="onRowClick"
    @update:filter-values="(vals: Record<string, string>) => emit('update:filterValues', vals)"
    @filter="(vals: Record<string, string>) => emit('filter', vals)"
    @sort="(state: DataTableSortState) => emit('sort', state)"
  >
    <template #cell-reference="{ row, filter }">
      <RouterLink :to="`/admin/test-guidelines/${row.id}`" class="tg-link" @click.stop>
        <span v-if="filter" v-html="highlightText(row.reference, filter)" />
        <template v-else>{{ row.reference }}</template>
      </RouterLink>
    </template>

    <template #cell-upovCodes="{ row, filter }">
      <span v-if="filter" v-html="highlightText((row.upovCodes || []).join(', '), filter)" />
      <template v-else>{{ (row.upovCodes || []).join(', ') }}</template>
    </template>

    <template #cell-twps="{ row }">
      <div v-if="row.twps" class="twp-chips">
        <Chip
          v-for="code in row.twps.split(',')"
          :key="code"
          :label="code.trim()"
          size="small"
          :removable="false"
          variant="tonal"
        />
      </div>
    </template>

    <template #cell-leadExpert="{ row, filter }">
      <template v-if="row.leadExpert">
        <span v-if="filter" v-html="highlightText(row.leadExpert, filter)" />
        <template v-else>{{ row.leadExpert }}</template>
        <span v-if="row.leadExpertCountry" class="expert-country"> ({{ row.leadExpertCountry }})</span>
      </template>
    </template>

    <template #cell-status="{ row }">
      <div class="status-cell">
        <StatusBadge
          :label="statusLabels[row.status as TGStatus] || row.status"
          :variant="statusVariants[row.status as TGStatus] || 'neutral'"
        />
        <span v-if="row.periodStart || row.periodEnd" class="status-period">
          ({{ formatDate(row.periodStart) }} – {{ formatDate(row.periodEnd) }})
        </span>
      </div>
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
      <ActionMenu :items="actions" @select="(item: ActionMenuItem) => emit('action', item.id, row.id)" />
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

.twp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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
</style>
