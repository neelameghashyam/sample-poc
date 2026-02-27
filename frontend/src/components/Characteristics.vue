<script setup lang="ts">
import { ref, computed,onBeforeUnmount  } from 'vue';
const rteBodyRef = ref<HTMLElement | null>(null);

let isResizing = false;
let startY = 0;
let startHeight = 0;

function startResize(e: MouseEvent) {
  if (!rteBodyRef.value) return;

  isResizing = true;
  startY = e.clientY;
  startHeight = rteBodyRef.value.offsetHeight;

  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
}

function onResize(e: MouseEvent) {
  if (!isResizing || !rteBodyRef.value) return;

  const dy = e.clientY - startY;
  const newHeight = Math.max(100, startHeight + dy); // minimum height
  rteBodyRef.value.style.height = newHeight + 'px';
}

function stopResize() {
  isResizing = false;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
});
interface StateRow {
  id: string;
  expression: string;
  notes: string | null;
  exampleVarieties: string[];
}

interface CharacteristicForm {
  asterics: boolean;
  grouping: boolean;
  tq5: boolean;
  name: string;
  typeOfExpression: string;
  growthStage: string;
  methods: {
    MG: boolean;
    MS: boolean;
    VG: boolean;
    VS: boolean;
    OTHER: boolean;
  };
  mgPlotType: string;
  msPlotType: string;
  states: StateRow[];
  explanation: string;
}

const props = withDefaults(defineProps<{
  mode?: 'add' | 'edit';
  initialData?: Partial<CharacteristicForm>;
}>(), {
  mode: 'add',
});

const emit = defineEmits<{
  exit: [];
  save: [data: CharacteristicForm];
}>();

const expressionTypes = ['QN', 'QL', 'PQ', 'QA'];
const plotTypes = ['Single', 'Replicated', 'Multiple'];
const notesOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const varietyOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

function makeState(): StateRow {
  return { id: Math.random().toString(36).slice(2), expression: '', notes: null, exampleVarieties: [] };
}

const form = ref<CharacteristicForm>({
  asterics: props.initialData?.asterics ?? false,
  grouping: props.initialData?.grouping ?? false,
  tq5: props.initialData?.tq5 ?? false,
  name: props.initialData?.name ?? '',
  typeOfExpression: props.initialData?.typeOfExpression ?? '',
  growthStage: props.initialData?.growthStage ?? '',
  methods: props.initialData?.methods ?? { MG: false, MS: false, VG: false, VS: false, OTHER: false },
  mgPlotType: props.initialData?.mgPlotType ?? '',
  msPlotType: props.initialData?.msPlotType ?? '',
  states: props.initialData?.states ?? [makeState()],
  explanation: props.initialData?.explanation ?? '',
});

const textareaValue = ref(form.value.explanation);

const hasActiveMethods = computed(() =>
  form.value.methods.MG || form.value.methods.MS || form.value.methods.VG || form.value.methods.VS || form.value.methods.OTHER
);

const isFormValid = computed(() =>
  props.mode === 'edit' ||
  (form.value.name.trim() !== '' && form.value.typeOfExpression !== '' && hasActiveMethods.value)
);

function addState() {
  form.value.states.push(makeState());
}

function removeState(id: string) {
  form.value.states = form.value.states.filter(s => s.id !== id);
}

function toggleVariety(state: StateRow, v: string) {
  const idx = state.exampleVarieties.indexOf(v);
  if (idx >= 0) state.exampleVarieties.splice(idx, 1);
  else state.exampleVarieties.push(v);
}

function removeVariety(state: StateRow, v: string) {
  state.exampleVarieties = state.exampleVarieties.filter(x => x !== v);
}

function handleSave() {
  if (!isFormValid.value) return; 
  emit('save', { ...form.value, explanation: textareaValue.value });
}

function handleExit() {
  emit('exit');
}

const openDropdown = ref<string | null>(null);

function toggleDropdown(key: string) {
  openDropdown.value = openDropdown.value === key ? null : key;
}

function closeDropdowns() {
  openDropdown.value = null;
}
</script>

<template>
  <div class="ch-overlay" @click.self="closeDropdowns">
    <div class="ch-modal">
      <div class="ch-modal-header">
        <div>
          <h2 class="ch-title">{{ mode === 'edit' ? 'Edit Characteristics' : 'Add Characteristics' }}</h2>
          <p class="ch-subtitle">Some fields are mandatory and must be completed (<span class="ch-req">*</span>)</p>
        </div>
        <button class="ch-close" @click="handleExit">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="#303030" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div class="ch-divider"></div>

      <div class="ch-body">
        <section class="ch-section">
          <h3 class="ch-section-label">Specific functions</h3>
          <div class="ch-checkboxes">
            <label class="ch-checkbox-row" @click.prevent="form.asterics = !form.asterics">
              <span class="ch-checkbox" :class="{ 'ch-checkbox--checked': form.asterics }">
                <svg v-if="form.asterics" width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <span class="ch-checkbox-text">Asterics characteristic</span>
            </label>
            <label class="ch-checkbox-row" @click.prevent="form.grouping = !form.grouping">
              <span class="ch-checkbox" :class="{ 'ch-checkbox--checked': form.grouping }">
                <svg v-if="form.grouping" width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <span class="ch-checkbox-text">Grouping characteristics</span>
            </label>
            <label class="ch-checkbox-row" @click.prevent="form.tq5 = !form.tq5">
              <span class="ch-checkbox" :class="{ 'ch-checkbox--checked': form.tq5 }">
                <svg v-if="form.tq5" width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <span class="ch-checkbox-text">Add to TQ5 characteristics</span>
            </label>
          </div>
        </section>

        <div class="ch-divider"></div>

        <section class="ch-section">
          <div class="ch-grid-3">
            <div class="ch-field">
              <label class="ch-label">Enter Characteristics Name <span class="ch-req">*</span></label>
              <input v-model="form.name" class="ch-input" type="text" placeholder="Insert the name" />
            </div>
            <div class="ch-field">
              <label class="ch-label">Type of Expression <span class="ch-req">*</span></label>
              <div class="ch-select-wrap" @click="toggleDropdown('type')">
                <span class="ch-select-value" :class="{ 'ch-select-value--filled': form.typeOfExpression }">
                  {{ form.typeOfExpression || 'Select a type of expres...' }}
                </span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708Z" fill="#727272"/></svg>
                <div v-if="openDropdown === 'type'" class="ch-dropdown">
                  <div v-for="opt in expressionTypes" :key="opt" class="ch-dropdown-item" :class="{ 'ch-dropdown-item--active': form.typeOfExpression === opt }" @click.stop="form.typeOfExpression = opt; openDropdown = null">{{ opt }}</div>
                </div>
              </div>
            </div>
            <div class="ch-field">
              <label class="ch-label">Growth {{ mode === 'edit' ? 'Stage' : 'Stages' }}</label>
              <input v-model="form.growthStage" class="ch-input" type="text" :placeholder="mode === 'edit' ? '00' : 'Insert the stages'" />
            </div>
          </div>
        </section>

        <section class="ch-section">
          <h3 class="ch-label ch-label--mb">Methods of Observation &amp; Type of Plot <span class="ch-req">*</span></h3>
          <div class="ch-methods-row">
            <label class="ch-checkbox-row" @click.prevent="form.methods.MG = !form.methods.MG">
              <span class="ch-checkbox" :class="{ 'ch-checkbox--checked': form.methods.MG }"><svg v-if="form.methods.MG" width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
              <span class="ch-checkbox-text">MG</span>
            </label>
            <label class="ch-checkbox-row" @click.prevent="form.methods.MS = !form.methods.MS">
              <span class="ch-checkbox" :class="{ 'ch-checkbox--checked': form.methods.MS }"><svg v-if="form.methods.MS" width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
              <span class="ch-checkbox-text">MS</span>
            </label>
            <label class="ch-checkbox-row" @click.prevent="form.methods.VG = !form.methods.VG">
              <span class="ch-checkbox" :class="{ 'ch-checkbox--checked': form.methods.VG }"><svg v-if="form.methods.VG" width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
              <span class="ch-checkbox-text">VG</span>
            </label>
            <div class="ch-methods-separator"></div>
            <label class="ch-checkbox-row" @click.prevent="form.methods.VS = !form.methods.VS">
              <span class="ch-checkbox" :class="{ 'ch-checkbox--checked': form.methods.VS }"><svg v-if="form.methods.VS" width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
              <span class="ch-checkbox-text">VS</span>
            </label>
            <label class="ch-checkbox-row" @click.prevent="form.methods.OTHER = !form.methods.OTHER">
              <span class="ch-checkbox" :class="{ 'ch-checkbox--checked': form.methods.OTHER }"><svg v-if="form.methods.OTHER" width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
              <span class="ch-checkbox-text">OTHER</span>
            </label>
          </div>
          <div v-if="form.methods.MG || form.methods.MS" class="ch-plot-selects">
            <div v-if="form.methods.MG" class="ch-select-wrap" @click="toggleDropdown('mg-plot')">
              <span class="ch-select-value" :class="{ 'ch-select-value--filled': form.mgPlotType }">{{ form.mgPlotType || 'Select' }}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708Z" fill="#727272"/></svg>
              <div v-if="openDropdown === 'mg-plot'" class="ch-dropdown">
                <div v-for="opt in plotTypes" :key="opt" class="ch-dropdown-item" @click.stop="form.mgPlotType = opt; openDropdown = null">{{ opt }}</div>
              </div>
            </div>
            <div v-if="form.methods.MS" class="ch-select-wrap" @click="toggleDropdown('ms-plot')">
              <span class="ch-select-value" :class="{ 'ch-select-value--filled': form.msPlotType }">{{ form.msPlotType || 'Select' }}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708Z" fill="#727272"/></svg>
              <div v-if="openDropdown === 'ms-plot'" class="ch-dropdown">
                <div v-for="opt in plotTypes" :key="opt" class="ch-dropdown-item" @click.stop="form.msPlotType = opt; openDropdown = null">{{ opt }}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="ch-section">
          <div v-for="(state, idx) in form.states" :key="state.id" class="ch-state-row">
            <div class="ch-grid-3 ch-grid-3--with-delete">
              <div class="ch-field">
                <label class="ch-label">State of Expression</label>
                <input v-model="state.expression" class="ch-input" type="text" :placeholder="mode === 'edit' ? 'Insert text' : 'Insert the expression'" />
              </div>
              <div class="ch-field">
                <label class="ch-label">Notes</label>
                <div class="ch-select-wrap" @click="toggleDropdown('notes-' + state.id)">
                  <span class="ch-select-value" :class="{ 'ch-select-value--filled': state.notes }">{{ state.notes || 'Select notes' }}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708Z" fill="#727272"/></svg>
                  <div v-if="openDropdown === 'notes-' + state.id" class="ch-dropdown">
                    <div v-for="n in notesOptions" :key="n" class="ch-dropdown-item" @click.stop="state.notes = n; openDropdown = null">{{ n }}</div>
                  </div>
                </div>
              </div>
              <div class="ch-field ch-field--varieties">
                <label class="ch-label">Example of varieties</label>
                <div class="ch-multiselect" @click.stop="toggleDropdown('varieties-' + state.id)">
                  <div class="ch-multiselect-inner">
                    <span v-for="v in state.exampleVarieties" :key="v" class="ch-tag" @click.stop="removeVariety(state, v)">{{ v }} <span class="ch-tag-x">×</span></span>
                    <span v-if="!state.exampleVarieties.length" class="ch-select-value">Select example of varieties</span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708Z" fill="#727272"/></svg>
                  <div v-if="openDropdown === 'varieties-' + state.id" class="ch-dropdown" @click.stop>
                    <div v-for="v in varietyOptions" :key="v" class="ch-dropdown-item" :class="{ 'ch-dropdown-item--active': state.exampleVarieties.includes(v) }" @click="toggleVariety(state, v)">{{ v }}</div>
                  </div>
                </div>
              </div>
              <button v-if="form.states.length > 1 || idx > 0" class="ch-delete-state" @click="removeState(state.id)" title="Remove state">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2.5 5h15M6.667 5V3.333a1.667 1.667 0 0 1 1.666-1.666h3.334a1.667 1.667 0 0 1 1.666 1.666V5m2.5 0-.833 11.667a1.667 1.667 0 0 1-1.667 1.666H6.667A1.667 1.667 0 0 1 5 16.667L4.167 5h11.666Z" stroke="#727272" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>
          <button class="ch-add-state-btn" @click="addState">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3.75v10.5M3.75 9h10.5" stroke="#1C4240" stroke-width="1.5" stroke-linecap="round"/></svg>
            Add new state
          </button>
        </section>

        <section class="ch-section">
          <h3 class="ch-label ch-label--mb">Add explanation for this characteristic</h3>
          <div class="ch-rte">
            <div class="ch-rte-toolbar">
              <button class="ch-rte-btn" title="Help"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><g clip-path="url(#a)"><path d="M12 22.5C6.201 22.5 1.5 17.799 1.5 12S6.201 1.5 12 1.5 22.5 6.201 22.5 12 17.799 22.5 12 22.5ZM12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Z" fill="#1C4240"/><path d="M7.883 8.679c-.012.205.157.37.361.37h1.237c.207 0 .372-.169.4-.374.133-.985.808-1.702 2.013-1.702 1.028 0 1.97.514 1.97 1.752 0 .952-.561 1.39-1.447 2.057-.91.733-1.709 1.59-1.652 2.98l.005.325c.003.205.17.37.375.37h1.218c.207 0 .375-.168.375-.375v-.158c0-1.076.41-1.39 1.514-2.228.915-.695 1.867-1.467 1.867-3.086 0-2.266-1.914-3.361-4.008-3.361-1.9 0-3.984.886-4.228 3.43ZM10.218 17.323c0 .8.638 1.39 1.514 1.39.914 0 1.542-.59 1.542-1.39 0-.828-.628-1.409-1.542-1.409-.876 0-1.514.581-1.514 1.41Z" fill="#1C4240"/></g><defs><clipPath id="a"><rect width="24" height="24" fill="white"/></clipPath></defs></svg></button>
              <button class="ch-rte-btn" title="Person"><svg width="18" height="20" viewBox="0 0 21 24" fill="none"><path d="M12.75 2.25C12.75 3.493 11.743 4.5 10.5 4.5 9.257 4.5 8.25 3.493 8.25 2.25 8.25 1.007 9.257 0 10.5 0c1.243 0 2.25 1.007 2.25 2.25ZM7.5 8.25 .698 7.587A.797.797 0 0 1 0 6.797C0 6.357.357 6 .797 6h19.406c.44 0 .797.357.797.797 0 .402-.3.741-.698.79L13.5 8.25V13.5l.677 9.63c.04.468-.33.87-.8.87a.866.866 0 0 1-.845-.608l-1.734-8.437a.402.402 0 0 0-.796 0L8.402 23.392A.866.866 0 0 1 7.557 24c-.47 0-.84-.402-.8-.87L7.5 13.5V8.25Z" fill="#1C4240"/></svg></button>
              <div class="ch-rte-group">
                <button class="ch-rte-btn" title="Font"><svg width="22" height="20" viewBox="0 0 24 24" fill="none"><path d="M3.366 19.622L4.781 15.418H9.99L11.405 19.622H13.292L8.309 5.625H6.483L1.5 19.622H3.366ZM7.417 7.737l2.09 6.234H5.263L7.365 7.737h.052ZM21.136 18.278H21.188V19.622H22.879V12.187c0-2.266-1.671-3.517-3.968-3.517-2.604 0-3.886 1.374-3.999 3.261h1.661c.103-1.077.892-1.784 2.276-1.784 1.457 0 2.276.78 2.276 2.195v1.097h-2.84c-2.471.01-3.784 1.199-3.784 3.086 0 1.979 1.436 3.27 3.517 3.27 1.59 0 2.574-.645 3.117-1.517Z" fill="#1C4240"/></svg></button>
                <span class="ch-rte-caret"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708Z" fill="#727272"/></svg></span>
              </div>
              <button class="ch-rte-btn" title="List"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 17.25a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 0 1.5H8.25a.75.75 0 0 1-.75-.75ZM7.5 11.25a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 0 1.5H8.25a.75.75 0 0 1-.75-.75ZM7.5 5.25A.75.75 0 0 1 8.25 4.5h13.5a.75.75 0 0 1 0 1.5H8.25A.75.75 0 0 1 7.5 5.25ZM5.78 3.22a.75.75 0 0 1 0 1.06L3.53 6.53a.75.75 0 0 1-1.06 0L1.72 5.78a.75.75 0 1 1 1.06-1.06l.22.22 1.72-1.72a.75.75 0 0 1 1.06 0ZM5.78 9.22a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 0 1-1.06 0l-.75-.75a.75.75 0 1 1 1.06-1.06l.22.22 1.72-1.72a.75.75 0 0 1 1.06 0ZM5.78 15.22a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 0 1-1.06 0l-.75-.75a.75.75 0 1 1 1.06-1.06l.22.22 1.72-1.72a.75.75 0 0 1 1.06 0Z" fill="#1C4240"/></svg></button>
              <button class="ch-rte-btn" title="Code"><svg width="18" height="12" viewBox="0 0 20 12" fill="none"><path d="M6.53 1.28a.75.75 0 0 0-1.06-1.06L.22 5.47a.75.75 0 0 0 0 1.06l5.25 5.25a.75.75 0 0 0 1.06-1.06L1.81 6l4.72-4.72ZM12.97 1.28a.75.75 0 0 1 1.06-1.06l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 0 1-1.06-1.06L17.69 6l-4.72-4.72Z" fill="#1C4240"/></svg></button>
              <div class="ch-rte-group">
                <button class="ch-rte-btn" title="Export"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 3V7c0 .553.448 1 1 1h4" stroke="#1C4240" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v8M13 19h7M20 19l-3-3M20 19l-3 3" stroke="#1C4240" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <span class="ch-rte-caret"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708Z" fill="#727272"/></svg></span>
              </div>
              <button class="ch-rte-btn" title="Paint"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><g clip-path="url(#b)"><path d="M0 3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3ZM7.5 16.5A1.5 1.5 0 0 1 9 15v-.75A2.25 2.25 0 0 1 11.25 12H18a3 3 0 0 0 3-3V3.258A4.5 4.5 0 0 1 24 7.5V9c0 2.485-2.016 4.5-4.5 4.5H12.75A.75.75 0 0 0 12 14.25V15a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 12 24H9A1.5 1.5 0 0 1 7.5 22.5v-6Z" fill="#1C4240"/></g><defs><clipPath id="b"><rect width="24" height="24" fill="white"/></clipPath></defs></svg></button>
              <button class="ch-rte-btn" title="Link"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              <button class="ch-rte-btn" title="Highlight"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><g clip-path="url(#c)"><path fill-rule="evenodd" clip-rule="evenodd" d="M16.644.967c1.179-1.121 3.037-1.097 4.187.054l2.148 2.148c1.15 1.15 1.174 3.008.054 4.187l-.62.652L10.308 21.5a.75.75 0 0 1-.558.25H5.25a.75.75 0 0 1-.607-.316L4.28 22.28a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 0 1 .22-1.22l2.118-2.118A.75.75 0 0 1 2.25 16.25v-4.5a.75.75 0 0 1 .22-.53L15.99 1.586l.653-.62ZM16.472 3.17L4.09 14.279l5.63 5.63L20.83 7.528 16.472 3.17ZM21.849 6.425l.096-.098c.56-.59.548-1.518-.027-2.093L19.768 2.08c-.575-.575-1.504-.563-2.094.054l-.1.098 4.274 4.274ZM7.94 20.25H3.75l-1.19-1.19 2.188-2.188L7.94 20.25Z" fill="#1C4240"/></g><defs><clipPath id="c"><rect width="24" height="24" fill="white"/></clipPath></defs></svg></button>
              <div class="ch-rte-group">
                <button class="ch-rte-btn" title="Table"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><g clip-path="url(#d)"><path d="M0 3a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3Zm22.5 3H16.5V10.5h6V6Zm0 6H16.5V16.5h6V12Zm0 6H16.5V22.5H21a1.5 1.5 0 0 0 1.5-1.5V18ZM15 22.5V18H9v4.5H15Zm-7.5 0V18H1.5V21A1.5 1.5 0 0 0 3 22.5h4.5Zm-6-7.5h6V10.5H1.5V15Zm0-6H7.5V4.5H3a1.5 1.5 0 0 0-1.5 1.5V9Zm7.5-4.5V9H15V4.5H9ZM15 10.5H9V15h6V10.5Z" fill="#1C4240"/></g><defs><clipPath id="d"><rect width="24" height="24" fill="white"/></clipPath></defs></svg></button>
                <span class="ch-rte-caret"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708Z" fill="#727272"/></svg></span>
              </div>
              <button class="ch-rte-btn" title="Image"><svg width="20" height="18" viewBox="0 0 24 21" fill="none"><path d="M9 6.75A2.25 2.25 0 1 1 4.5 6.75 2.25 2.25 0 0 1 9 6.75Z" fill="#1C4240"/><path d="M3 0a3 3 0 0 0-3 3v15a3 3 0 0 0 3 3h18a3 3 0 0 0 3-3V3a3 3 0 0 0-3-3H3Zm18 1.5A1.5 1.5 0 0 1 22.5 3v9.75l-5.665-2.921a.75.75 0 0 0-.804.073l-5.565 5.565-3.988-2.659a.75.75 0 0 0-.926.073L1.5 16.5V3A1.5 1.5 0 0 1 3 1.5H21Z" fill="#1C4240"/></svg></button>
            </div>
<div class="ch-rte-body" ref="rteBodyRef">
              <textarea v-model="textareaValue" class="ch-rte-textarea" :placeholder="mode === 'edit' ? 'Insert the text area' : 'Add explanation here'"></textarea>
             <span class="ch-rte-resize" @mousedown="startResize">
             <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M11.099 12.356 12.356 11.099c.346-.346.389-.869.095-1.163-.294-.294-.817-.251-1.163.095L10.031 11.288c-.346.346-.388.869-.095 1.163.294.294.817.251 1.163-.095ZM.195 11.509c.294.294.817.251 1.163-.095L11.415 1.358c.346-.346.388-.869.094-1.163-.293-.294-.816-.251-1.162.095L.29 10.346c-.346.346-.388.869-.095 1.163ZM5.914 12.199l6.285-6.285c.346-.346.388-.869.095-1.163-.294-.294-.817-.251-1.163.095L4.846 11.131c-.346.346-.388.869-.095 1.163.294.294.817.251 1.163-.095Z" fill="#1C4240"/></svg></span>
            </div>
          </div>
        </section>
      </div>

      <!-- Footer -->
      <div class="ch-footer">
        <button class="ch-exit-btn" @click="handleExit">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="#1C4240" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Exit
        </button>

        <!-- disabled state  -->
        <button
          class="ch-save-btn"
          :class="{ 'ch-save-btn--disabled': !isFormValid }"
          :disabled="!isFormValid"
          @click="handleSave"
        >
          <svg v-if="mode === 'edit'" width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M9 1.5C4.858 1.5 1.5 4.858 1.5 9S4.858 16.5 9 16.5 16.5 13.142 16.5 9 13.142 1.5 9 1.5Z" stroke="#DADE14" stroke-width="1.5"/>
            <path d="M6 9l2.25 2.25L12 6.75" stroke="#DADE14" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7.5" :stroke="isFormValid ? '#DADE14' : '#9A9A9A'" stroke-width="1.3"/>
            <path d="M9 6v6M6 9h6" :stroke="isFormValid ? '#DADE14' : '#9A9A9A'" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {{ mode === 'edit' ? 'Save changes' : 'Add Characteristics' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
*, *::before, *::after { box-sizing: border-box; }

.ch-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 24px;
}
.ch-modal {
  background: #FFFFFF; border-radius: 12px; width: 100%; max-width: 900px;
  max-height: 90vh; display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  font-family: 'Figtree', 'Segoe UI', Arial, sans-serif; color: #303030; overflow: hidden;
}
.ch-modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 24px 24px 16px; flex-shrink: 0; }
.ch-title { font-size: 20px; font-weight: 700; color: #1C4240; margin: 0 0 4px; }
.ch-subtitle { font-size: 13px; color: #727272; margin: 0; }
.ch-req { color: #D32F2F; }
.ch-close { background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; opacity: 0.7; transition: opacity 0.15s; }
.ch-close:hover { opacity: 1; }
.ch-divider { height: 1px; background: #E2E2E2; flex-shrink: 0; }
.ch-body { overflow-y: auto; flex: 1; padding: 0 24px; }
.ch-body::-webkit-scrollbar { width: 6px; }
.ch-body::-webkit-scrollbar-track { background: transparent; }
.ch-body::-webkit-scrollbar-thumb { background: rgba(28,66,64,0.2); border-radius: 3px; }
.ch-section { padding: 20px 0; border-bottom: 1px solid #F0F0F0; }
.ch-section:last-child { border-bottom: none; }
.ch-section-label { font-size: 14px; font-weight: 500; color: #303030; margin: 0 0 12px; }
.ch-checkboxes { display: flex; align-items: center; gap: 32px; flex-wrap: wrap; }
.ch-checkbox-row { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
.ch-checkbox { width: 20px; height: 20px; border-radius: 4px; border: 1.5px solid #B8B4A4; background: #FFFFFF; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s, border-color 0.15s; }
.ch-checkbox--checked { background: #009A6E; border-color: #009A6E; }
.ch-checkbox-text { font-size: 14px; color: #303030; }
.ch-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; align-items: end; }
.ch-grid-3--with-delete { grid-template-columns: 1fr 1fr 1fr auto; }
.ch-field { display: flex; flex-direction: column; gap: 6px; }
.ch-label { font-size: 13px; font-weight: 500; color: #303030; margin: 0; }
.ch-label--mb { margin-bottom: 12px; }
.ch-input { height: 36px; padding: 0 12px; border: 1px solid #1C4240; border-radius: 4px; font-family: inherit; font-size: 14px; color: #303030; background: #FFFFFF; outline: none; transition: border-width 0.1s, padding 0.1s; }
.ch-input:focus { border-width: 2px; padding: 0 11px; }
.ch-input::placeholder { color: #B8B4A4; }
.ch-select-wrap { position: relative; height: 36px; padding: 0 12px; border: 1px solid #1C4240; border-radius: 4px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; background: #FFFFFF; user-select: none; }
.ch-select-value { font-size: 14px; color: #B8B4A4; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ch-select-value--filled { color: #303030; }
.ch-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #FFFFFF; border: 1px solid #E2E2E2; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); z-index: 100; max-height: 180px; overflow-y: auto; }
.ch-dropdown-item { padding: 8px 12px; font-size: 14px; color: #303030; cursor: pointer; transition: background 0.1s; }
.ch-dropdown-item:hover { background: #F5F5F5; }
.ch-dropdown-item--active { color: #009A6E; font-weight: 600; background: #F0FAF7; }
.ch-methods-row { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
.ch-methods-separator { width: 1px; height: 20px; background: #E2E2E2; }
.ch-plot-selects { display: flex; gap: 12px; margin-top: 12px; }
.ch-plot-selects .ch-select-wrap { width: 140px; }
.ch-state-row { margin-bottom: 12px; }
.ch-field--varieties { position: relative; }
.ch-multiselect { min-height: 36px; padding: 4px 32px 4px 8px; border: 1px solid #1C4240; border-radius: 4px; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; cursor: pointer; background: #FFFFFF; position: relative; }
.ch-multiselect > svg { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); flex-shrink: 0; }
.ch-multiselect-inner { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; flex: 1; min-height: 26px; }
.ch-tag { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; background: #DADE14; border-radius: 4px; font-size: 12px; font-weight: 600; color: #1C4240; cursor: pointer; white-space: nowrap; }
.ch-tag-x { font-weight: 400; opacity: 0.7; }
.ch-tag-x:hover { opacity: 1; }
.ch-delete-state { background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; align-self: center; margin-top: 20px; opacity: 0.6; transition: opacity 0.15s; }
.ch-delete-state:hover { opacity: 1; }
.ch-add-state-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; color: #1C4240; text-decoration: underline; text-decoration-color: #DADE14; text-decoration-thickness: 2px; text-underline-offset: 3px; padding: 0; margin-top: 8px; transition: opacity 0.15s; }
.ch-add-state-btn:hover { opacity: 0.7; }
.ch-rte { display: flex; flex-direction: column; }
.ch-rte-toolbar { display: flex; align-items: center; gap: 16px; padding: 10px 14px; border: 1px solid #1C4240; border-radius: 4px 4px 0 0; background: #FFFFFF; flex-wrap: wrap; }
.ch-rte-btn { display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; padding: 0; width: 22px; height: 22px; flex-shrink: 0; opacity: 0.85; transition: opacity 0.15s; }
.ch-rte-btn:hover { opacity: 1; }
.ch-rte-group { display: flex; align-items: center; gap: 3px; }
.ch-rte-caret { display: flex; align-items: center; cursor: pointer; }
.ch-rte-body { position: relative; border: 1px solid #1C4240; border-top: none; border-radius: 0 0 4px 4px; padding: 12px 16px 16px; min-height: 100px;transition: height 0.05s ease; }
.ch-rte-textarea { width: 100%; min-height: 80px; border: none; outline: none; resize: none; font-family: inherit; font-size: 14px; color: #727272; background: transparent; }
.ch-rte-textarea::placeholder { color: #B8B4A4; }
.ch-rte-resize { position: absolute; bottom: 0px; right: 5px; opacity: 0.5; cursor: nwse-resize; }

/* Footer */
.ch-footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid #E2E2E2; flex-shrink: 0; }

.ch-exit-btn { display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 20px; background: #FFFFFF; border: 1.5px solid #939600; border-radius: 100px; font-family: inherit; font-size: 14px; font-weight: 600; color: #1C4240; cursor: pointer; transition: background 0.15s; }
.ch-exit-btn:hover { background: rgba(147,150,0,0.05); }

.ch-save-btn { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 20px; background: #1C4240; border: none; border-radius: 100px; font-family: inherit; font-size: 14px; font-weight: 600; color: #DADE14; cursor: pointer; transition: background 0.2s, color 0.2s; }
.ch-save-btn:hover:not(.ch-save-btn--disabled) { opacity: 0.88; }

.ch-save-btn--disabled {
  background: #EBEBEB;
  color: #9A9A9A;
  cursor: not-allowed;
  pointer-events: none;
}
</style>