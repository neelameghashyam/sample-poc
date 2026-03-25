<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { DataTable, StatusBadge, ActionMenu } from 'upov-ui';
import type { DataTableColumn, DataTableSortState, StatusBadgeVariant, ActionMenuItem } from 'upov-ui';
import type { TGStatus, TestGuidelineListItem } from '@/types';
import TgDocPreview from '@/components/common/TgDocPreview.vue';

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
  // Default actions: edit redirects to editor page; preview is handled by row click
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

// ── Doc preview state ─────────────────────────────────────────────────────────
const previewTgId = ref<number | null>(null);
const previewTgReference = ref<string | undefined>(undefined);
const previewTgName = ref<string | undefined>(undefined);

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

// ── Row click → open full-document preview ────────────────────────────────────
function onRowClick(row: Record<string, any>) {
  // Find the full item to get reference/name for the panel header
  const item = props.items.find((i) => i.id === row.id);
  previewTgId.value = row.id;
  previewTgReference.value = item?.reference ?? String(row.id);
  previewTgName.value = item?.name ?? undefined;
  // Also emit select so parent stores can track the selected id
  emit('select', row.id);
}

// ── Preview panel close ───────────────────────────────────────────────────────
function onPreviewClose() {
  previewTgId.value = null;
  previewTgReference.value = undefined;
  previewTgName.value = undefined;
}

// ── Preview panel → Edit button → navigate to editor ─────────────────────────
function onPreviewEdit(id: number) {
  onPreviewClose();
  router.push(`/admin/test-guidelines/${id}`);
}

// ── Action menu (Edit, etc.) in the row ──────────────────────────────────────
function onAction(actionId: string, tgId: number) {
  if (actionId === 'edit') {
    // Edit action always navigates directly to the editor page
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
      <!-- Reference is now plain text; clicking the row opens the preview -->
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
      <ActionMenu :items="actions" @select="(item: ActionMenuItem) => onAction(item.id, row.id)" />
    </template>

    <template #row-detail="{ row, index }">
      <slot name="row-detail" :row="row" :index="index" />
    </template>

    <template #pagination>
      <slot name="pagination" />
    </template>
  </DataTable>

  <!-- Full-document preview panel (shown on row click) -->
  <TgDocPreview
    :tg-id="previewTgId"
    :tg-reference="previewTgReference"
    :tg-name="previewTgName"
    @close="onPreviewClose"
    @edit="onPreviewEdit"
  />
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

/* Reference text styled to hint it's clickable (row is the click target) */
.tg-reference {
  font-weight: 500;
  color: var(--color-primary, #2563eb);
  cursor: pointer;
}
</style>