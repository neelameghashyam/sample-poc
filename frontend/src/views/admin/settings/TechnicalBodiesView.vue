<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { PageHeader, Select, DataTable, Button, Modal, Input, DatePicker, DateRangePicker, YearPicker, Alert, Icon, ConfirmDialog, FormField, FormRow, ActionMenu, useConfirmDialog } from 'upov-ui';
import type { DataTableColumn, SelectOption, ActionMenuItem } from 'upov-ui';

const { confirm } = useConfirmDialog();
import { CalendarDate, type DateValue } from '@internationalized/date';
import type { DateRange } from 'radix-vue';
import type { TechnicalBody, TechnicalBodyOption } from '@/types';
import api from '@/services/api';

function toCalendarDate(value: string | null): DateValue | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  return new CalendarDate(y, m, d);
}

function toISOString(value: DateValue | undefined): string {
  if (!value) return '';
  return `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
}

function toDateRange(start: string | null, end: string | null): DateRange | undefined {
  const s = toCalendarDate(start);
  const e = toCalendarDate(end);
  if (!s && !e) return undefined;
  return { start: s!, end: e! };
}

// Data
const items = ref<TechnicalBody[]>([]);
const years = ref<number[]>([]);
const bodies = ref<TechnicalBodyOption[]>([]);
const loading = ref(false);
const selectedYear = ref<number | undefined>();

// Fetch options (years + body codes)
async function fetchOptions() {
  try {
    const res = await api.get<{ years: number[]; bodies: TechnicalBodyOption[] }>('/api/admin/technical-bodies/options');
    years.value = res.data.years;
    bodies.value = res.data.bodies;
    if (years.value.length > 0) {
      selectedYear.value = years.value[0];
    }
  } catch (err) {
    console.error('Failed to fetch options:', err);
  }
}

// Fetch sessions for selected year
async function fetchSessions() {
  if (selectedYear.value === undefined) return;
  loading.value = true;
  try {
    const res = await api.get<{ items: TechnicalBody[] }>('/api/admin/technical-bodies', {
      params: { year: String(selectedYear.value) },
    });
    items.value = res.data.items;
  } catch (err) {
    console.error('Failed to fetch sessions:', err);
  } finally {
    loading.value = false;
  }
}

watch(selectedYear, () => fetchSessions());

onMounted(async () => {
  await fetchOptions();
});

// Table columns
const columns: DataTableColumn[] = [
  { key: 'code', label: 'Body', width: '80px' },
  { key: 'session', label: 'Session', width: '180px' },
  { key: 'location', label: 'Location', width: '160px' },
  { key: 'dateFrom', label: 'Meeting Dates', width: '190px', align: 'center' },
  { key: 'leDraft', label: 'LE Draft Dates', width: '190px', align: 'center' },
  { key: 'ieComments', label: 'IE Comments Dates', width: '190px', align: 'center' },
  { key: 'leChecking', label: 'LE Checking Dates', width: '190px', align: 'center' },
  { key: 'actions', label: '', width: '48px' },
];

function formatDate(value: string | null): string {
  if (!value) return ' ';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}


// Edit modal
const showEditModal = ref(false);
const editItem = ref<TechnicalBody | null>(null);
const editForm = ref({
  session: '',
  location: '',
  meeting: undefined as DateRange | undefined,
  leDraft: undefined as DateRange | undefined,
  ieComments: undefined as DateRange | undefined,
  leChecking: undefined as DateRange | undefined,
  translation: undefined as DateRange | undefined,
  sentToUpov: undefined as DateValue | undefined,
  adoptionDate: undefined as DateValue | undefined,
});
const saving = ref(false);
const editError = ref('');

function openEdit(row: TechnicalBody) {
  editItem.value = row;
  editForm.value = {
    session: row.session || '',
    location: row.location || '',
    meeting: toDateRange(row.dateFrom, row.dateTo),
    leDraft: toDateRange(row.leDraftStart, row.leDraftEnd),
    ieComments: toDateRange(row.ieCommentsStart, row.ieCommentsEnd),
    leChecking: toDateRange(row.leCheckingStart, row.leCheckingEnd),
    translation: toDateRange(row.translationStart, row.translationEnd),
    sentToUpov: toCalendarDate(row.sentToUpov),
    adoptionDate: toCalendarDate(row.adoptionDate),
  };
  editError.value = '';
  showEditModal.value = true;
}

async function saveEdit() {
  if (!editItem.value) return;
  saving.value = true;
  editError.value = '';
  try {
    const payload: Record<string, string> = {
      session: editForm.value.session,
      location: editForm.value.location,
      dateFrom: toISOString(editForm.value.meeting?.start),
      dateTo: toISOString(editForm.value.meeting?.end),
      leDraftStart: toISOString(editForm.value.leDraft?.start),
      leDraftEnd: toISOString(editForm.value.leDraft?.end),
      ieCommentsStart: toISOString(editForm.value.ieComments?.start),
      ieCommentsEnd: toISOString(editForm.value.ieComments?.end),
      leCheckingStart: toISOString(editForm.value.leChecking?.start),
      leCheckingEnd: toISOString(editForm.value.leChecking?.end),
      translationStart: toISOString(editForm.value.translation?.start),
      translationEnd: toISOString(editForm.value.translation?.end),
      sentToUpov: toISOString(editForm.value.sentToUpov),
      adoptionDate: toISOString(editForm.value.adoptionDate),
    };
    await api.patch(`/api/admin/technical-bodies/${editItem.value.id}`, payload);
    showEditModal.value = false;
    await fetchSessions();
  } catch (err) {
    console.error('Save error:', err);
    editError.value = 'Failed to save changes.';
  } finally {
    saving.value = false;
  }
}

async function deleteSession(row: TechnicalBody) {
  const ok = await confirm({
    title: 'Delete Session',
    message: `Are you sure you want to delete the ${row.code} ${row.year} session?`,
    confirmLabel: 'Delete',
    variant: 'danger',
  });
  if (!ok) return;
  try {
    await api.delete(`/api/admin/technical-bodies/${row.id}`);
    await fetchSessions();
  } catch (err) {
    console.error('Delete error:', err);
  }
}

// Create modal
const showCreateModal = ref(false);
const createForm = ref({
  code: '',
  year: undefined as number | undefined,
  session: '',
  location: '',
  meeting: undefined as DateRange | undefined,
});
const creating = ref(false);
const createError = ref('');

const bodyOptions = computed<SelectOption[]>(() =>
  bodies.value.map((b) => ({ value: b.code, label: b.code })),
);

function openCreate() {
  createForm.value = {
    code: '',
    year: selectedYear.value || new Date().getFullYear(),
    session: '',
    location: '',
    meeting: undefined,
  };
  createError.value = '';
  showCreateModal.value = true;
}

async function saveCreate() {
  if (!createForm.value.code || !createForm.value.year) {
    createError.value = 'Body and year are required.';
    return;
  }

  // Check for duplicate
  const exists = items.value.some(
    (i) => i.code === createForm.value.code && i.year === createForm.value.year,
  );
  if (exists) {
    createError.value = `A session for ${createForm.value.code} in ${createForm.value.year} already exists.`;
    return;
  }

  creating.value = true;
  createError.value = '';
  try {
    const body = bodies.value.find((b) => b.code === createForm.value.code);
    await api.post('/api/admin/technical-bodies', {
      code: createForm.value.code,
      year: createForm.value.year,
      session: createForm.value.session,
      location: createForm.value.location,
      dateFrom: toISOString(createForm.value.meeting?.start),
      dateTo: toISOString(createForm.value.meeting?.end),
      description: body?.description || null,
    });
    showCreateModal.value = false;
    // Refresh options in case new year was added
    await fetchOptions();
    if (selectedYear.value === createForm.value.year) {
      await fetchSessions();
    } else {
      selectedYear.value = createForm.value.year;
    }
  } catch (err) {
    console.error('Create error:', err);
    createError.value = 'Failed to create session.';
  } finally {
    creating.value = false;
  }
}

const rowActions: ActionMenuItem[] = [
  { id: 'edit', label: 'Edit', icon: 'pencil' },
  { id: 'delete', label: 'Delete', icon: 'trash', danger: true },
];

function onRowAction(item: ActionMenuItem, row: TechnicalBody) {
  if (item.id === 'edit') openEdit(row);
  if (item.id === 'delete') deleteSession(row);
}
</script>

<template>
  <div class="tb-page">
    <PageHeader
      title="Technical Bodies"
      subtitle="Manage TWP meeting sessions and deadline schedules"
      :actions="[{ id: 'create', label: 'New Session', icon: 'plus-lg', variant: 'primary' }]"
      @action="openCreate"
    />

    <div class="tb-toolbar">
      <YearPicker
        v-model="selectedYear"
        placeholder="Select year"
        :clearable="false"
        :min-year="years.length ? years[years.length - 1] : 2000"
        :max-year="new Date().getFullYear() + 3"
      />
    </div>

    <div class="table-section">
      <DataTable
        :columns="columns"
        :rows="items"
        row-key="id"
        :loading="loading"
        hoverable
        empty-message="No sessions found for this year."
      >
        <template #cell-code="{ row }">
          <strong>{{ row.code }}</strong>
        </template>

        <template #cell-session="{ row }">
          {{ row.session || '-' }}
        </template>

        <template #cell-location="{ row }">
          {{ row.location || '-' }}
        </template>

        <template #cell-dateFrom="{ row }">
          <span class="date-range">
            <span class="date-slot">{{ formatDate(row.dateFrom) }}</span>
            <span class="date-sep"><Icon v-if="row.dateFrom && row.dateTo" icon="arrow-right" size="small" style="font-size: 10px; width: 10px; height: 10px;" /></span>
            <span class="date-slot">{{ formatDate(row.dateTo) }}</span>
          </span>
        </template>

        <template #cell-leDraft="{ row }">
          <span class="date-range">
            <span class="date-slot">{{ formatDate(row.leDraftStart) }}</span>
            <span class="date-sep"><Icon v-if="row.leDraftStart && row.leDraftEnd" icon="arrow-right" size="small" style="font-size: 10px; width: 10px; height: 10px;" /></span>
            <span class="date-slot">{{ formatDate(row.leDraftEnd) }}</span>
          </span>
        </template>

        <template #cell-ieComments="{ row }">
          <span class="date-range">
            <span class="date-slot">{{ formatDate(row.ieCommentsStart) }}</span>
            <span class="date-sep"><Icon v-if="row.ieCommentsStart && row.ieCommentsEnd" icon="arrow-right" size="small" style="font-size: 10px; width: 10px; height: 10px;" /></span>
            <span class="date-slot">{{ formatDate(row.ieCommentsEnd) }}</span>
          </span>
        </template>

        <template #cell-leChecking="{ row }">
          <span class="date-range">
            <span class="date-slot">{{ formatDate(row.leCheckingStart) }}</span>
            <span class="date-sep"><Icon v-if="row.leCheckingStart && row.leCheckingEnd" icon="arrow-right" size="small" style="font-size: 10px; width: 10px; height: 10px;" /></span>
            <span class="date-slot">{{ formatDate(row.leCheckingEnd) }}</span>
          </span>
        </template>

        <template #cell-actions="{ row }">
          <ActionMenu :items="rowActions" @select="onRowAction($event, row as TechnicalBody)" />
        </template>
      </DataTable>
    </div>

    <!-- Edit Modal -->
    <Modal v-model:open="showEditModal" :title="`Edit ${editItem?.code} ${editItem?.year}`" max-width="800px">
      <template v-if="editItem">
        <Alert v-if="editError" variant="error" class="modal-alert">{{ editError }}</Alert>

        <div class="form-grid">
          <div class="form-section">
            <h4 class="form-section-title">Session Info</h4>
            <FormRow>
              <Input v-model="editForm.session" label="Session" placeholder="e.g. fifty-fifth session" />
              <Input v-model="editForm.location" label="Location" placeholder="e.g. Geneva" />
            </FormRow>
            <DateRangePicker v-model="editForm.meeting" label="Meeting Dates" placeholder="Enter a date range" />
          </div>

          <div class="form-section">
            <h4 class="form-section-title">Deadlines</h4>
            <FormRow>
              <DateRangePicker v-model="editForm.leDraft" label="LE Draft Dates" placeholder="Enter a date range" />
              <DateRangePicker v-model="editForm.ieComments" label="IE Comments Dates" placeholder="Enter a date range" />
            </FormRow>
            <FormRow>
              <DateRangePicker v-model="editForm.leChecking" label="LE Checking Dates" placeholder="Enter a date range" />
              <DateRangePicker v-model="editForm.translation" label="Translation" placeholder="Enter a date range" />
            </FormRow>
            <FormRow>
              <DatePicker v-model="editForm.sentToUpov" label="Sent to UPOV" />
              <DatePicker v-model="editForm.adoptionDate" label="Adoption Date" />
            </FormRow>
          </div>
        </div>
      </template>
      <template #footer>
        <Button type="primary" size="small" :disabled="saving" @click="saveEdit">
          {{ saving ? 'Saving...' : 'Save' }}
        </Button>
      </template>
    </Modal>

    <!-- Create Modal -->
    <Modal v-model:open="showCreateModal" title="New Session" max-width="480px">
      <Alert v-if="createError" variant="error" class="modal-alert">{{ createError }}</Alert>

      <div class="form-grid">
        <FormRow>
          <FormField label="Body" required>
            <Select v-model="createForm.code" :options="bodyOptions" placeholder="Select body" />
          </FormField>
          <YearPicker v-model="createForm.year" label="Year" :clearable="false" required />
        </FormRow>
        <FormRow>
          <Input v-model="createForm.session" label="Session" placeholder="e.g. fifty-fifth session" />
          <Input v-model="createForm.location" label="Location" placeholder="e.g. Geneva" />
        </FormRow>
        <DateRangePicker v-model="createForm.meeting" label="Meeting Dates" placeholder="Enter a date range" />
      </div>
      <template #footer>
        <Button type="secondary" size="small" @click="showCreateModal = false">Cancel</Button>
        <Button type="primary" size="small" :disabled="creating || !createForm.code || !createForm.year" @click="saveCreate">
          {{ creating ? 'Creating...' : 'Create' }}
        </Button>
      </template>
    </Modal>

    <ConfirmDialog />
  </div>
</template>

<style scoped>
.tb-page {
  max-width: 1400px;
  margin: 0 auto;
}

.tb-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  max-width: 200px;
}

.table-section {
  background: var(--color-bg-white);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.modal-alert {
  margin-bottom: 16px;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-section-title {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin: 0;
  padding-top: 8px;
  border-top: 1px solid var(--color-neutral-200);
}

.form-section:first-child .form-section-title {
  border-top: none;
  padding-top: 0;
}



.date-range {
  display: inline-flex;
  align-items: center;
  font-family: monospace;
  font-size: 0.7rem;
}

.date-slot {
  display: inline-block;
  width: 72px;
  text-align: center;
  background: transparent;
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--color-text-secondary);
}

.date-sep {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  color: var(--color-text-secondary);
}
</style>
