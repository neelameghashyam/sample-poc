<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { PageHeader, SidePanel, SidePanelLayout, Button, Input, DatePicker, DateRangePicker, Alert, Icon, ConfirmDialog, FormRow, Spinner, useConfirmDialog } from 'upov-ui';

const { confirm } = useConfirmDialog();
import { CalendarDate, type DateValue } from '@internationalized/date';
import type { DateRange } from 'radix-vue';
import type { TechnicalBody, TechnicalBodyOption } from '@/types';
import api from '@/services/api';
import { NO_DEADLINE_BODIES } from '@/config/constants';

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

/**
 * Calculate phase deadlines from a meeting start date.
 * Offsets (101, 73, 45 days before meeting) match the legacy rule in addTechnicalBody.jsp.
 */
function calcDeadlines(meetingStart: DateValue) {
  const leDraftEnd = meetingStart.subtract({ days: 101 });
  const ieCommentsStart = leDraftEnd.add({ days: 1 });
  const ieCommentsEnd = meetingStart.subtract({ days: 73 });
  const leCheckingStart = ieCommentsEnd.add({ days: 1 });
  const leCheckingEnd = meetingStart.subtract({ days: 45 });
  const sentToUpov = leCheckingEnd.add({ days: 1 });
  return { leDraftEnd, ieCommentsStart, ieCommentsEnd, leCheckingStart, leCheckingEnd, sentToUpov };
}

function formatDate(value: string | null): string {
  if (!value) return '__/__/____';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}


const now = new Date();
const today = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate());

// Calendar default date: same day/month as today but in the selected year
const calendarDefault = computed(() => {
  const now = new Date();
  return new CalendarDate(selectedYear.value, now.getMonth() + 1, now.getDate());
});

const router = useRouter();

// Data
const items = ref<TechnicalBody[]>([]);
const bodies = ref<TechnicalBodyOption[]>([]);
const loading = ref(false);

function yearFromHash(): number {
  const hash = window.location.hash.replace('#', '');
  const n = parseInt(hash, 10);
  return n > 0 ? n : new Date().getFullYear();
}

const selectedYear = ref<number>(yearFromHash());

// Fetch body codes
async function fetchOptions() {
  try {
    const res = await api.get<{ bodies: TechnicalBodyOption[] }>('/api/admin/technical-bodies/options');
    bodies.value = res.data.bodies;
  } catch (err) {
    console.error('Failed to fetch options:', err);
  }
}

// Fetch sessions for selected year
async function fetchSessions() {
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

let initialized = false;

watch(selectedYear, (y) => {
  if (initialized) router.replace({ hash: `#${y}` });
  closePanel();
  fetchSessions();
});

onMounted(async () => {
  await fetchOptions();
  await fetchSessions();
  initialized = true;
});

// Year navigation
function prevYear() { selectedYear.value--; }
function nextYear() { selectedYear.value++; }

// Build card data: one card per body, with session data if exists
interface BodyCard {
  code: string;
  description: string;
  data: TechnicalBody | null;
}

const bodyCards = computed<BodyCard[]>(() =>
  bodies.value.map((b) => ({
    code: b.code,
    description: b.description,
    data: items.value.find((i) => i.code === b.code) || null,
  })),
);

// Side panel (unified create/edit)
const panelOpen = ref(false);
const panelMode = ref<'create' | 'edit'>('create');
const panelCode = ref('');
const panelDescription = ref('');
const panelEditId = ref<number | null>(null);
const saving = ref(false);
const panelError = ref('');

const form = ref({
  session: '',
  location: '',
  meeting: undefined as DateRange | undefined,
  leDraftStart: undefined as DateValue | undefined,
  leDraftEnd: undefined as DateValue | undefined,
  ieComments: undefined as DateRange | undefined,
  leChecking: undefined as DateRange | undefined,
  translation: undefined as DateRange | undefined,
  sentToUpov: undefined as DateValue | undefined,
  adoptionDate: undefined as DateValue | undefined,
});

const initialFormSnapshot = ref('');

function serialize(obj: unknown): string {
  return JSON.stringify(obj, (_, v) => {
    if (v && typeof v === 'object' && 'year' in v && 'month' in v && 'day' in v) {
      return `${v.year}-${v.month}-${v.day}`;
    }
    return v;
  });
}

function takeSnapshot() {
  initialFormSnapshot.value = serialize(form.value);
}

const hasChanges = computed(() => serialize(form.value) !== initialFormSnapshot.value);

// Date sequence validation: each phase must not have start > end,
// and phases must follow the workflow timeline order.
function isBefore(a?: DateValue, b?: DateValue): boolean {
  if (!a || !b) return true; // skip if either is missing
  return a.compare(b) <= 0;
}

const formErrors = computed<string[]>(() => {
  const errs: string[] = [];
  const f = form.value;

  // Meeting range
  if (f.meeting?.start && f.meeting?.end && !isBefore(f.meeting.start, f.meeting.end)) {
    errs.push('Meeting start must be before end');
  }

  if (!hasDeadlines.value) return errs;

  // LE Draft
  if (!isBefore(f.leDraftStart, f.leDraftEnd)) errs.push('LE Draft start must be before end');
  // IE Comments
  if (f.ieComments?.start && f.ieComments?.end && !isBefore(f.ieComments.start, f.ieComments.end)) {
    errs.push('IE Comments start must be before end');
  }
  // LE Checking
  if (f.leChecking?.start && f.leChecking?.end && !isBefore(f.leChecking.start, f.leChecking.end)) {
    errs.push('LE Checking start must be before end');
  }
  // Translation
  if (f.translation?.start && f.translation?.end && !isBefore(f.translation.start, f.translation.end)) {
    errs.push('Translation start must be before end');
  }
  // Sent to UPOV before Adoption
  if (!isBefore(f.sentToUpov, f.adoptionDate)) errs.push('Sent to UPOV must be before Adoption Date');

  // Timeline order: LE Draft End → IE Comments Start → IE Comments End → LE Checking Start → ...
  if (!isBefore(f.leDraftEnd, f.ieComments?.start)) errs.push('LE Draft must end before IE Comments starts');
  if (!isBefore(f.ieComments?.end, f.leChecking?.start)) errs.push('IE Comments must end before LE Checking starts');
  if (!isBefore(f.leChecking?.end, f.sentToUpov)) errs.push('LE Checking must end before Sent to UPOV');

  // Meeting should be after all deadlines
  if (!isBefore(f.sentToUpov, f.meeting?.start)) errs.push('Sent to UPOV must be before meeting');

  return errs;
});

const canSave = computed(() => hasChanges.value && formErrors.value.length === 0);

const hasDeadlines = computed(() => !NO_DEADLINE_BODIES.includes(panelCode.value));

const panelTitle = computed(() =>
  panelMode.value === 'create'
    ? `New ${panelCode.value} ${selectedYear.value} Session`
    : `Edit ${panelCode.value} ${selectedYear.value}`,
);

function openCreate(code: string) {
  const body = bodies.value.find((b) => b.code === code);
  panelCode.value = code;
  panelDescription.value = body?.description || '';
  panelMode.value = 'create';
  panelEditId.value = null;
  form.value = {
    session: '',
    location: '',
    meeting: undefined,
    leDraftStart: undefined,
    leDraftEnd: undefined,
    ieComments: undefined,
    leChecking: undefined,
    translation: undefined,
    sentToUpov: undefined,
    adoptionDate: undefined,
  };
  panelError.value = '';
  panelOpen.value = true;
  takeSnapshot();

  if (hasDeadlines.value) {
    fetchAndSetLeDraftStart(code, selectedYear.value);
  }
}

function openEdit(row: TechnicalBody) {
  const body = bodies.value.find((b) => b.code === row.code);
  panelCode.value = row.code;
  panelDescription.value = body?.description || '';
  panelMode.value = 'edit';
  panelEditId.value = row.id;
  form.value = {
    session: row.session || '',
    location: row.location || '',
    meeting: toDateRange(row.dateFrom, row.dateTo),
    leDraftStart: toCalendarDate(row.leDraftStart),
    leDraftEnd: toCalendarDate(row.leDraftEnd),
    ieComments: toDateRange(row.ieCommentsStart, row.ieCommentsEnd),
    leChecking: toDateRange(row.leCheckingStart, row.leCheckingEnd),
    translation: toDateRange(row.translationStart, row.translationEnd),
    sentToUpov: toCalendarDate(row.sentToUpov),
    adoptionDate: toCalendarDate(row.adoptionDate),
  };
  panelError.value = '';
  panelOpen.value = true;
  takeSnapshot();
}

function closePanel() {
  panelOpen.value = false;
}

// Auto-fill deadlines when meeting start date changes
watch(() => form.value.meeting?.start, (newStart, oldStart) => {
  if (!hasDeadlines.value) return;
  if (!newStart || (oldStart && newStart.toString() === oldStart.toString())) return;
  const d = calcDeadlines(newStart);
  form.value.leDraftEnd = d.leDraftEnd;
  form.value.ieComments = { start: d.ieCommentsStart, end: d.ieCommentsEnd } as DateRange;
  form.value.leChecking = { start: d.leCheckingStart, end: d.leCheckingEnd } as DateRange;
  form.value.sentToUpov = d.sentToUpov;
});

// Auto-fill LE Draft Start from previous year's meeting end + 7 days
async function fetchAndSetLeDraftStart(code: string, year: number) {
  try {
    const res = await api.get<{ dateTo: string | null }>('/api/admin/technical-bodies/previous-meeting-end', {
      params: { code, year: String(year) },
    });
    if (res.data.dateTo) {
      form.value.leDraftStart = toCalendarDate(res.data.dateTo)!.add({ days: 7 });
    }
  } catch {
    // silent
  }
}

function buildPayload(): Record<string, string | number | null> {
  const payload: Record<string, string | number | null> = {
    session: form.value.session,
    location: form.value.location,
    dateFrom: toISOString(form.value.meeting?.start),
    dateTo: toISOString(form.value.meeting?.end),
  };
  if (hasDeadlines.value) {
    payload.leDraftStart = toISOString(form.value.leDraftStart);
    payload.leDraftEnd = toISOString(form.value.leDraftEnd);
    payload.ieCommentsStart = toISOString(form.value.ieComments?.start);
    payload.ieCommentsEnd = toISOString(form.value.ieComments?.end);
    payload.leCheckingStart = toISOString(form.value.leChecking?.start);
    payload.leCheckingEnd = toISOString(form.value.leChecking?.end);
    payload.translationStart = toISOString(form.value.translation?.start);
    payload.translationEnd = toISOString(form.value.translation?.end);
    payload.sentToUpov = toISOString(form.value.sentToUpov);
    payload.adoptionDate = toISOString(form.value.adoptionDate);
  }
  return payload;
}

async function save() {
  saving.value = true;
  panelError.value = '';
  try {
    if (panelMode.value === 'edit' && panelEditId.value) {
      await api.patch(`/api/admin/technical-bodies/${panelEditId.value}`, buildPayload());
    } else {
      const body = bodies.value.find((b) => b.code === panelCode.value);
      await api.post('/api/admin/technical-bodies', {
        code: panelCode.value,
        year: selectedYear.value,
        description: body?.description || null,
        ...buildPayload(),
      });
    }
    panelOpen.value = false;
    await fetchSessions();
  } catch (err) {
    console.error('Save error:', err);
    panelError.value = 'Failed to save changes.';
  } finally {
    saving.value = false;
  }
}

async function deleteSession(row: TechnicalBody) {
  const ok = await confirm({
    title: 'Cancel Session',
    message: `Are you sure you want to cancel the ${row.code} ${row.year} session?`,
    confirmLabel: 'Cancel Session',
    variant: 'danger',
  });
  if (!ok) return;
  try {
    await api.delete(`/api/admin/technical-bodies/${row.id}`);
    if (panelOpen.value && panelEditId.value === row.id) closePanel();
    await fetchSessions();
  } catch (err) {
    console.error('Delete error:', err);
  }
}

</script>

<template>
  <div class="tb-wrapper">
  <SidePanelLayout :open="panelOpen" panel-width="520px" fixed top-offset="48px">
    <div class="tb-main">
      <PageHeader
        title="Technical Bodies"
        subtitle="Manage TWP meeting sessions and deadline schedules"
      />

      <div v-if="loading" class="tb-loading">
        <Spinner />
      </div>

      <template v-else>
        <div class="tb-grid">
          <div v-for="card in bodyCards" :key="card.code" class="tb-card" :class="{ 'tb-card--empty': !card.data, 'tb-card--active': panelOpen && panelCode === card.code }" @click="card.data ? openEdit(card.data) : openCreate(card.code)">
            <div class="tb-card-header">
              <div>
                <span class="tb-card-code">{{ card.code }}</span>
                <p class="tb-card-desc">{{ card.description }}</p>
              </div>
              <span class="tb-card-year">{{ selectedYear }}</span>
            </div>
            <hr class="tb-card-divider" />

            <template v-if="card.data">
              <p v-if="card.data.session" class="tb-card-session">{{ card.data.session }}</p>
              <p v-if="card.data.location" class="tb-card-location">{{ card.data.location }}</p>
              <p class="tb-card-dates">
                {{ formatDate(card.data.dateFrom) }}
                <Icon icon="arrow-right" size="small" class="tb-card-arrow" />
                {{ formatDate(card.data.dateTo) }}
              </p>
            </template>

            <button v-else class="tb-card-add" @click="openCreate(card.code)">
              <Icon icon="plus-circle" size="large" />
            </button>
          </div>
        </div>

        <div class="tb-year-nav">
          <Button type="tertiary" size="small" icon-left="chevron-left" @click="prevYear">Previous Year</Button>
          <span class="tb-year-current">{{ selectedYear }}</span>
          <Button type="tertiary" size="small" icon-right="chevron-right" @click="nextYear">Next Year</Button>
        </div>
      </template>
    </div>

    <template #panel>
      <SidePanel
        :title="panelTitle"
        width="520px"
        @close="closePanel"
      >
        <template #default>
          <Alert v-if="panelError" variant="error" class="panel-alert">{{ panelError }}</Alert>

          <div class="form-grid">
            <div class="form-section">
              <h4 class="form-section-title">Session Info</h4>
              <FormRow>
                <Input v-model="form.session" label="Session" placeholder="e.g. fifty-fifth session" />
                <Input v-model="form.location" label="Location" placeholder="e.g. Geneva" />
              </FormRow>
              <DateRangePicker v-model="form.meeting" label="Meeting Dates" placeholder="Enter a date range" :default-date="calendarDefault" />
            </div>

            <template v-if="hasDeadlines">
              <div class="form-section">
                <h4 class="form-section-title">Deadlines</h4>
                <FormRow>
                  <DatePicker v-model="form.leDraftStart" label="LE Draft Start" :default-date="calendarDefault" :max-date="form.leDraftEnd" typeable />
                  <DatePicker v-model="form.leDraftEnd" label="LE Draft End" :default-date="calendarDefault" :min-date="form.leDraftStart" typeable />
                </FormRow>
                <DateRangePicker v-model="form.ieComments" label="IE Comments" placeholder="Enter a date range" :default-date="calendarDefault" />
                <DateRangePicker v-model="form.leChecking" label="LE Checking" placeholder="Enter a date range" :default-date="calendarDefault" />
                <DateRangePicker v-model="form.translation" label="Translation" placeholder="Enter a date range" :default-date="calendarDefault" />
                <FormRow>
                  <DatePicker v-model="form.sentToUpov" label="Sent to UPOV" :default-date="calendarDefault" :max-date="form.adoptionDate" typeable />
                  <DatePicker v-model="form.adoptionDate" label="Adoption Date" :default-date="calendarDefault" :min-date="form.sentToUpov" typeable />
                </FormRow>
              </div>
            </template>
          </div>

          <Alert v-if="formErrors.length" variant="error" class="panel-validation">
            <ul class="panel-validation-list">
              <li v-for="err in formErrors" :key="err">{{ err }}</li>
            </ul>
          </Alert>

          <div class="panel-footer">
            <Button v-if="panelMode === 'edit' && form.meeting?.start && form.meeting.start.compare(today) > 0" type="tertiary" size="small" :disabled="saving" @click="deleteSession(items.find(i => i.id === panelEditId)!)">
              Cancel Session
            </Button>
            <Button type="primary" size="small" :disabled="saving || !canSave" @click="save">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </Button>
          </div>
        </template>
      </SidePanel>
    </template>

  <ConfirmDialog />
  </SidePanelLayout>
  </div>
</template>

<style scoped>
.tb-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.tb-main {
  display: flex;
  flex-direction: column;
}

.tb-loading {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.tb-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: 1fr;
  gap: 16px;
  margin-top: 16px;
}

.tb-card {
  background: var(--color-bg-white);
  border: 1px solid var(--color-neutral-200);
  border-radius: 8px;
  padding: 16px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
}

.tb-card:hover,
.tb-card--active {
  background: color-mix(in srgb, var(--color-primary-green) 6%, transparent);
  cursor: pointer;
}

.tb-card--empty {
  border-style: dashed;
}

.tb-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.tb-card-year {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.tb-card-code {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary-green-dark);
}

.tb-card-desc {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  margin: 2px 0 0;
}

.tb-card-divider {
  border: none;
  border-top: 1px solid var(--color-neutral-200);
  margin: 8px 0;
}

.tb-card-session {
  font-size: 0.85rem;
  font-weight: 500;
  color: #009A6E;
  margin: 0 0 2px;
}

.tb-card-location {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0 0 8px;
}

.tb-card-dates {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: auto 0 0;
  white-space: nowrap;
  text-align: right;
}

.tb-card-arrow {
  font-size: 10px;
  width: 10px;
  height: 10px;
  vertical-align: middle;
  opacity: 0.5;
}

.tb-card-add {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-neutral-400);
  padding: 8px;
  border-radius: 6px;
  transition: color 0.15s, background-color 0.15s;
  margin: auto auto;
}

.tb-card--empty:hover .tb-card-add {
  color: var(--color-primary-green);
}

.tb-year-nav {
  position: fixed;
  bottom: 0;
  left: 240px;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px 0;
  z-index: 5;
}

.tb-year-current {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary-green-dark);
  letter-spacing: 0.02em;
}

/* Panel form */
.panel-alert {
  margin-bottom: 16px;
}

.panel-validation {
  margin-top: 12px;
}

.panel-validation-list {
  margin: 0;
  padding-left: 16px;
  font-size: 0.8rem;
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

.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 20px;
  margin-top: 8px;
  border-top: 1px solid var(--color-neutral-200);
}
</style>
