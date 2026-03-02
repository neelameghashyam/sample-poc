<script setup lang="ts">
import { ref, computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';

const tinymceApiKey = 'YOUR_LICENSE_KEY_HERE';

const tinymceInit = {
  height: 200,
  menubar: false,
  plugins: ['lists', 'link', 'image', 'table', 'code', 'help'],
  toolbar: 'help | fontfamily fontsize | bullist numlist | code | forecolor | link | penicon | table | image',
  skin: 'oxide',
  content_css: 'default',
  placeholder: 'Add explanation here',
  resize: true,
  statusbar: true,
  branding: false,
};

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

        <!-- ✅ TinyMCE Section replacing custom RTE -->
        <section class="ch-section">
          <h3 class="ch-label ch-label--mb">Add explanation for this characteristic</h3>
          <div class="ch-rte-tinymce">
            <Editor
              v-model="textareaValue"
              :api-key="tinymceApiKey"
              :init="tinymceInit"
            />
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

/* TinyMCE wrapper styles */
.ch-rte-tinymce :deep(.tox-tinymce) {
  border: 1px solid #1C4240 !important;
  border-radius: 4px !important;
  font-family: 'Figtree', 'Segoe UI', Arial, sans-serif;
}
.ch-rte-tinymce :deep(.tox-toolbar__primary) {
  background: #FFFFFF !important;
  border-bottom: 1px solid #E2E2E2 !important;
}
.ch-rte-tinymce :deep(.tox-toolbar-overlord) {
  background: #FFFFFF !important;
}
.ch-rte-tinymce :deep(.tox .tox-tbtn svg) {
  fill: #1C4240 !important;
}
.ch-rte-tinymce :deep(.tox .tox-tbtn:hover) {
  background: rgba(28, 66, 64, 0.06) !important;
}
.ch-rte-tinymce :deep(.tox .tox-statusbar) {
  border-top: 1px solid #E2E2E2 !important;
}
.ch-rte-tinymce :deep(.tox-statusbar__branding) {
  display: none;
}

/* Footer */
.ch-footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid #E2E2E2; flex-shrink: 0; }
.ch-exit-btn { display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 20px; background: #FFFFFF; border: 1.5px solid #939600; border-radius: 100px; font-family: inherit; font-size: 14px; font-weight: 600; color: #1C4240; cursor: pointer; transition: background 0.15s; }
.ch-exit-btn:hover { background: rgba(147,150,0,0.05); }
.ch-save-btn { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 20px; background: #1C4240; border: none; border-radius: 100px; font-family: inherit; font-size: 14px; font-weight: 600; color: #DADE14; cursor: pointer; transition: background 0.2s, color 0.2s; }
.ch-save-btn:hover:not(.ch-save-btn--disabled) { opacity: 0.88; }
.ch-save-btn--disabled { background: #EBEBEB; color: #9A9A9A; cursor: not-allowed; pointer-events: none; }
</style>