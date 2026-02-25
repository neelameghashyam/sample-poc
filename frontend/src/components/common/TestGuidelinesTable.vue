<script setup lang="ts">
import { DataTable, StatusBadge } from 'upov-ui';
import type { DataTableColumn, StatusBadgeVariant } from 'upov-ui';
import type { TGStatus, TestGuidelineListItem } from '@/types';

interface Props {
  items?: TestGuidelineListItem[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  items: () => [],
  loading: false,
});

const columns: DataTableColumn[] = [
  { key: 'reference', label: 'Reference' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'leadExpert', label: 'Lead Expert' },
  { key: 'lastUpdated', label: 'Last Updated' },
];

const statusLabels: Record<TGStatus, string> = {
  LED: 'LE Draft',
  IEC: 'IE Comments',
  LEC: 'LE Checking',
  LES: 'LE Signed Off',
  ADO: 'Adopted',
  STU: 'Study',
  DEL: 'Deleted',
};

const statusVariants: Record<TGStatus, StatusBadgeVariant> = {
  LED: 'warning',
  IEC: 'info',
  LEC: 'success',
  LES: 'info',
  ADO: 'success',
  STU: 'warning',
  DEL: 'danger',
};
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="items"
    row-key="id"
    :loading="loading"
    empty-message="No test guidelines found."
    :striped="true"
    :hoverable="true"
  >
    <template #cell-reference="{ row }">
      <RouterLink :to="`/admin/test-guidelines/${row.id}`" class="tg-link">
        {{ row.reference }}
      </RouterLink>
    </template>
    <template #cell-status="{ row }">
      <StatusBadge
        :label="statusLabels[row.status as TGStatus] || row.status"
        :variant="statusVariants[row.status as TGStatus] || 'neutral'"
      />
    </template>
    <template #cell-lastUpdated="{ value }">
      {{ new Date(value).toLocaleDateString() }}
    </template>
  </DataTable>
</template>

<style scoped>
.tg-link {
  color: var(--color-primary-green-dark);
  text-decoration-line: underline;
  text-decoration-color: var(--color-primary-green-light);
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
  font-weight: 600;
}
</style>
