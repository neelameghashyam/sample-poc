<script setup lang="ts">
import { ref, computed,onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CharacteristicsModal from "./Characteristics.vue";
const route  = useRoute();
const router = useRouter();
const tgId   = route.params.id;
console.log('TG ID:', tgId);
const rteFieldRef = ref<HTMLElement | null>(null);
const rteTextareaRef = ref<HTMLTextAreaElement | null>(null);

let isResizing = false;
let startY = 0;
let startHeight = 0;

function startResize(e: MouseEvent) {
  isResizing = true;
  startY = e.clientY;
  startHeight = rteFieldRef.value?.offsetHeight || 0;

  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
}

function onResize(e: MouseEvent) {
  if (!isResizing || !rteFieldRef.value) return;

  const dy = e.clientY - startY;
  const newHeight = Math.max(122, startHeight + dy); // 122 = your min-height
  rteFieldRef.value.style.height = newHeight + 'px';
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
interface ChapterItem {
  number: string;
  sidebarTitle: string;   // short name shown in sidebar
  pageTitle: string;      // long name shown as main heading
  status: 'current' | 'pending' | 'completed' | 'saved' | 'disabled';
}

interface RelatedLink {
  text: string;
  url?: string;
}

withDefaults(defineProps<{
  mainCommonName?: string;
  upovCodes?: string;
  botanicalName?: string;
  relatedLinks?: RelatedLink[];
  documentName?: string;
  savedDate?: string;
}>(), {
  mainCommonName: 'European Pear',
  upovCodes: 'PYRUS_COM; PYRUS_BCO; PYRUS_CPB; PYRUS_CUS',
  botanicalName: 'Pyrus communis L., Pyrus asiae-mediae (Popov) Maleev, Pyrus balansae Decne., Pyrus bourgaeana Decne., Pyrus communis L. subsp. bourgaeana (Decne.) Nyman, Pyrus communis L. var. mariana Willk., Pyrus domestica Medik., Pyrus elata Rubtzov, Pyrus medvedevii Rubtzov; Pyrus × bretschneideri Rehder × Pyrus communis L., Enter Other Botanical Name; Hybrids between Pyrus communis, Pyrus pyrifolia and Pyrus × bretschneideri, Pyrus communis × Pyrus pyrifolia × Pyrus × bretschneideri; Hybrids between Pyrus communis and P. ussuriensis, Pyrus communis L. × P. ussuriensis Maxim. & Rupr.',
  relatedLinks: () => [
    { text: 'Quantity of plant material required (GN7)', url: '#' },
    { text: 'Quantity of plant material required (GN6)', url: '#' },
  ],
  documentName: 'TG/export_test_2',
  savedDate: 'Saved: 02 Dec, 2025 - 31 Dec, 2025',
});

const emit = defineEmits<{
  submit: [];
  export: [];
  previousChapter: [];
  nextChapter: [];
  itemClick: [item: ChapterItem];
}>();

const showDetails          = ref(false);
const textareaValue        = ref('');
const chapterNavCollapsed  = ref(false);
const activeChapterIndex   = ref(0);
const radioAnswers         = ref<Record<string, 'yes' | 'no' | null>>({
  q1: 'no',
  q2: 'no',
});
const navigationLocked     = false;

// ── Material accordion ──────────────────────────────────────────────────────
const materialSections = ref([
  { id: 'mat-2-1', number: '2.1', title: 'Title text',                isOpen: false },
  { id: 'mat-2-2', number: '2.2', title: 'Title text',                isOpen: false },
  { id: 'mat-2-3', number: '2.3', title: 'Seed Quality Requirements', isOpen: true  },
]);
const seedQualityRadio = ref<'seed-only' | 'both' | null>(null);

function toggleMaterialSection(id: string) {
  const s = materialSections.value.find(x => x.id === id);
  if (s) s.isOpen = !s.isOpen;
}

// ── Examination accordion ────────────────────────────────────────────────────
const examinationSections = ref([
  { id: 'ex-3-1', number: '3.1', title: 'Number of Growing Cycles',                  isOpen: false },
  { id: 'ex-3-2', number: '3.2', title: 'Testing Place',                              isOpen: false },
  { id: 'ex-3-3', number: '3.3', title: 'Conditions for Conducting the Examination',  isOpen: false },
  { id: 'ex-3-4', number: '3.4', title: 'Test Design',                                isOpen: false },
  { id: 'ex-3-5', number: '3.5', title: 'Additional Tests',                           isOpen: false },
]);

function toggleExaminationSection(id: string) {
  const s = examinationSections.value.find(x => x.id === id);
  if (s) s.isOpen = !s.isOpen;
}

// 3.1 radios
const growingCycleRadio = ref<'single' | 'two'>('two');
const growingCycleSubRadio = ref<'two-separate' | 'single-planting'>('single-planting');
const satisfactoryFruitRadio = ref<'yes' | 'no' | null>('yes');
const fruitTypeRadio         = ref<'dormant' | 'no-dormant' | 'evergreen' | null>('evergreen');
const inlineTreesInput       = ref('trees');

// 3.3 radios
const condStagesRadio = ref<'yes' | 'no' | null>('no');
const condPlotsRadio  = ref<'yes' | 'no' | null>('no');
const condColorRadio  = ref<'yes' | 'no' | null>('no');

// 3.4 radios
const tdMorePropRadio   = ref<'yes' | 'no' | null>('no');
const tdPlotDesignRadio = ref<'single' | 'one-type' | 'diff-types' | null>('single');
const tdRemovalRadio    = ref<'yes' | 'no' | null>('yes');
const tdPlantCountInput = ref('');
const tdPlantTypeInput  = ref('');

const examinationRelatedLinks: RelatedLink[] = [
  { text: 'Explanation of the growing cycle (GN 8)', url: '#' },
];
const ex33RelatedLinks: RelatedLink[] = [
  { text: 'Guidance on stages (GN 12)', url: '#' },
];
const ex34RelatedLinks: RelatedLink[] = [
  { text: 'Test design guidance (TGP/9)', url: '#' },
];

// ── Table of Characteristics — chapter 07 ──────────────────────────────────
const tocSearchQuery    = ref('');
const tocSearchResults  = ref<TocSearchResult[]>([]);
const tocSearchDone     = ref(false);
const tocCharacteristics = ref<TocCharacteristic[]>([
  {
    id: 'toc-1',
    num: 1,
    type: 'QN',
    method: 'MG/VG',
    asterisk: false,
    title: 'Tree: vigor',
    rows: [
      { english: 'very weak',           exampleVarieties: 'Grenadier, Nield\'s Drooper', notes: 1 },
      { english: 'very weak to weak',   exampleVarieties: 'James Grieve, Redkan',        notes: 2 },
      { english: 'weak',                exampleVarieties: 'Alkmene, Regine',             notes: 3 },
      { english: 'weak to medium',      exampleVarieties: 'Piros, Pomforyou, Renora',    notes: 4 },
      { english: 'medium',              exampleVarieties: 'Gala, Pinova, Trajan',        notes: 5 },
      { english: 'medium to strong',    exampleVarieties: 'Dalili, Pia, Pivita',         notes: 6 },
      { english: 'strong',              exampleVarieties: 'Elstar, Rafzubin, Santana',   notes: 7 },
      { english: 'strong to very strong', exampleVarieties: 'Bay 3484, Collina, Cripps Pink', notes: 8 },
      { english: 'very strong',         exampleVarieties: 'Gloster, Ingrid Marie',       notes: 9 },
    ],
  },
  {
    id: 'toc-2',
    num: 2,
    type: 'QL',
    method: 'VG',
    asterisk: true,
    title: 'Tree: type',
    rows: [
      { english: 'columnar',  exampleVarieties: 'MacExcel, Wijcik',        notes: 1 },
      { english: 'ramified',  exampleVarieties: 'Elstar, Golden Delicious', notes: 2 },
    ],
  },
  {
    id: 'toc-3',
    num: 3,
    type: 'QN',
    method: 'MG/VG',
    asterisk: true,
    title: 'Leaf: length',
    rows: [
      { english: 'very shortstzsr tz', exampleVarieties: 'Kasumi',     notes: 1 },
      { english: 'medium',             exampleVarieties: '',            notes: 2 },
      { english: '5',                  exampleVarieties: 'variety B',  notes: 3 },
    ],
  },
  {
    id: 'toc-4',
    num: 4,
    type: 'QL',
    method: 'MS',
    asterisk: false,
    title: 'restistance test',
    rows: [
      { english: 'absent',  exampleVarieties: '', notes: 1 },
      { english: 'present', exampleVarieties: '', notes: 9 },
    ],
  },
  {
    id: 'toc-5',
    num: 5,
    type: 'QL',
    method: 'MS',
    asterisk: false,
    title: 'Young leaf blade: main color',
    rows: [
      { english: 'absent', exampleVarieties: '', notes: 1 },
    ],
  },
]);

const tocDisplayedCount = ref(4); // Load more pagination
const tocDisplayed = computed(() => tocCharacteristics.value.slice(0, tocDisplayedCount.value));

interface TocSearchResult {
  id: string;
  name: string;
  genus: string;
  methods: string;
  type: string;
  tgRef: string;
  statesOfExpression: string;
}

interface TocCharacteristic {
  id: string;
  num: number;
  type: string;
  method: string;
  asterisk: boolean;
  title: string;
  rows: { english: string; exampleVarieties: string; notes: number }[];
}

const tocAllResults: TocSearchResult[] = [
  { id: 'sr-1', name: 'Young leaf blade: main color', genus: 'ABELIA', methods: 'VG', type: 'PQ', tgRef: 'TG/320/1', statesOfExpression: 'Very short/1, short/2, medium/3, long/4, very long/5' },
  { id: 'sr-2', name: 'Young leaf blade: shape',      genus: 'ABELIA', methods: 'VG', type: 'PQ', tgRef: 'TG/320/1', statesOfExpression: 'Very short/1, short/2, medium/3, long/4, very long/5' },
  { id: 'sr-3', name: 'Young leaf blade: height',     genus: 'ABELIA', methods: 'VG', type: 'PQ', tgRef: 'TG/320/1', statesOfExpression: 'Very short/1, short/2, medium/3, long/4, very long/5' },
];

function tocSearch() {
  if (!tocSearchQuery.value.trim()) return;
  tocSearchResults.value = tocAllResults.filter(r =>
    r.name.toLowerCase().includes(tocSearchQuery.value.toLowerCase())
  );
  tocSearchDone.value = true;
}

function tocClearSearch() {
  tocSearchQuery.value = '';
  tocSearchResults.value = [];
  tocSearchDone.value = false;
}

function tocImport(result: TocSearchResult) {
  // Add to characteristics list
  const newChar: TocCharacteristic = {
    id: `toc-imported-${Date.now()}`,
    num: tocCharacteristics.value.length + 1,
    type: result.type,
    method: result.methods,
    asterisk: false,
    title: result.name,
    rows: result.statesOfExpression.split(',').map((s, i) => ({
      english: s.trim().split('/')[0],
      exampleVarieties: '',
      notes: i + 1,
    })),
  };
  tocCharacteristics.value.push(newChar);
  tocSearchResults.value = tocSearchResults.value.filter(r => r.id !== result.id);
}

function tocDeleteCharacteristic(id: string) {
  tocCharacteristics.value = tocCharacteristics.value.filter(c => c.id !== id);
  // Renumber
  tocCharacteristics.value.forEach((c, i) => { c.num = i + 1; });
}

function tocLoadMore() {
  tocDisplayedCount.value = Math.min(tocDisplayedCount.value + 3, tocCharacteristics.value.length);
}

// ── Drag-to-reorder for characteristics ─────────────────────────────────────
const dragSrcIndex = ref<number | null>(null);

function tocDragStart(index: number) {
  dragSrcIndex.value = index;
}

function tocDragOver(e: DragEvent) {
  e.preventDefault();
}

function tocDrop(targetIndex: number) {
  if (dragSrcIndex.value === null || dragSrcIndex.value === targetIndex) return;
  const items = [...tocCharacteristics.value];
  const [moved] = items.splice(dragSrcIndex.value, 1);
  items.splice(targetIndex, 0, moved);
  items.forEach((c, i) => { c.num = i + 1; });
  tocCharacteristics.value = items;
  dragSrcIndex.value = null;
}

function tocDragEnd() {
  dragSrcIndex.value = null;
}

// ── Characteristics modal state — chapter 07 ───────────────────────────────
const tocShowModal     = ref(false);
const tocModalMode     = ref<'add' | 'edit'>('add');
const tocEditingId     = ref<string | null>(null);
const tocModalInitial  = ref<Partial<CharacteristicForm> | undefined>(undefined);

interface CharacteristicForm {
  asterics: boolean;
  grouping: boolean;
  tq5: boolean;
  name: string;
  typeOfExpression: string;
  growthStage: string;
  methods: { MG: boolean; MS: boolean; VG: boolean; VS: boolean; OTHER: boolean };
  mgPlotType: string;
  msPlotType: string;
  states: { id: string; expression: string; notes: string | null; exampleVarieties: string[] }[];
  explanation: string;
}

function tocOpenAddModal() {
  tocModalMode.value  = 'add';
  tocEditingId.value  = null;
  tocModalInitial.value = undefined;
  tocShowModal.value  = true;
}

function tocOpenEditModal(char: TocCharacteristic) {
  tocModalMode.value  = 'edit';
  tocEditingId.value  = char.id;
  tocModalInitial.value = {
    asterics:         char.asterisk,
    grouping:         false,
    tq5:              false,
    name:             char.title,
    typeOfExpression: char.type,
    growthStage:      '',
    methods: {
      MG:    char.method.includes('MG'),
      MS:    char.method.includes('MS'),
      VG:    char.method.includes('VG'),
      VS:    false,
      OTHER: false,
    },
    mgPlotType: '',
    msPlotType: '',
    states: char.rows.map(r => ({
      id:               Math.random().toString(36).slice(2),
      expression:       r.english,
      notes:            String(r.notes),
      exampleVarieties: r.exampleVarieties
                          ? r.exampleVarieties.split(', ').filter(Boolean)
                          : [],
    })),
    explanation: '',
  };
  tocShowModal.value = true;
}

function tocHandleSave(data: CharacteristicForm) {
  // Build method string like "MG/VG"
  const methodParts = (['MG','MS','VG','VS','OTHER'] as const)
    .filter(k => data.methods[k]);
  const methodStr = methodParts.join('/');

  if (tocModalMode.value === 'edit' && tocEditingId.value) {
    // Update existing
    const idx = tocCharacteristics.value.findIndex(c => c.id === tocEditingId.value);
    if (idx !== -1) {
      tocCharacteristics.value[idx] = {
        ...tocCharacteristics.value[idx],
        asterisk: data.asterics,
        title:    data.name,
        type:     data.typeOfExpression,
        method:   methodStr,
        rows:     data.states.map(s => ({
          english:          s.expression,
          exampleVarieties: s.exampleVarieties.join(', '),
          notes:            Number(s.notes) || 0,
        })),
      };
    }
  } else {
    // Add new
    const newChar: TocCharacteristic = {
      id:       `toc-new-${Date.now()}`,
      num:      tocCharacteristics.value.length + 1,
      type:     data.typeOfExpression,
      method:   methodStr,
      asterisk: data.asterics,
      title:    data.name,
      rows:     data.states.map(s => ({
        english:          s.expression,
        exampleVarieties: s.exampleVarieties.join(', '),
        notes:            Number(s.notes) || 0,
      })),
    };
    tocCharacteristics.value.push(newChar);
  }
  tocShowModal.value = false;
}

function tocHandleExit() {
  tocShowModal.value = false;
}

// ── Chapters — sidebarTitle (short) vs pageTitle (long) ──────────────────────
const chapters: ChapterItem[] = [
  { number: '01', sidebarTitle: 'Subject',                   pageTitle: 'Subject of these Test Guidelines',  status: 'current' },
  { number: '02', sidebarTitle: 'Material',                  pageTitle: 'Material Required',                 status: 'pending' },
  { number: '03', sidebarTitle: 'Examination',               pageTitle: 'Method of Examination',             status: 'pending' },
  { number: '04', sidebarTitle: 'Assessment',                pageTitle: 'Assessment of Distinctness, Uniformity and Stability', status: 'pending' },
  { number: '05', sidebarTitle: 'Grouping',                  pageTitle: 'Grouping of Varieties',             status: 'pending' },
  { number: '06', sidebarTitle: 'Characteristics',           pageTitle: 'Characteristics',                   status: 'pending' },
  { number: '07', sidebarTitle: 'Table of characteristics',  pageTitle: 'Table of Characteristics',          status: 'pending' },
  { number: '08', sidebarTitle: 'Explanations',              pageTitle: 'Explanations',                      status: 'pending' },
  { number: '09', sidebarTitle: 'Literature',                pageTitle: 'Literature',                        status: 'pending' },
  { number: '10', sidebarTitle: 'Technical questionnaire',   pageTitle: 'Technical Questionnaire',           status: 'pending' },
  { number: '11', sidebarTitle: 'Annex',                     pageTitle: 'Annex',                             status: 'pending' },
];

const sectionLinks: RelatedLink[] = [
  { text: 'More than one species (GN3)',                               url: '#' },
  { text: 'Different types or groups within a species or genus (GN4)', url: '#' },
  { text: 'Family name (GN5)',                                         url: '#' },
  { text: 'Guidance for New Types and Species (GN6)',                  url: '#' },
];

const activeChapter = computed(() => chapters[activeChapterIndex.value]);

function toggleDetails()    { showDetails.value = !showDetails.value; }
function toggleChapterNav() { chapterNavCollapsed.value = !chapterNavCollapsed.value; }

function setActiveChapter(index: number) {
  if (navigationLocked) return;
  activeChapterIndex.value = index;
  emit('itemClick', chapters[index]);
}

function setRadio(key: string, value: 'yes' | 'no') {
  radioAnswers.value[key] = value;
}

function goNext() {
  if (navigationLocked) return;
  if (activeChapterIndex.value < chapters.length - 1) {
    activeChapterIndex.value++;
    emit('nextChapter');
  }
}
function goPrevious() {
  if (navigationLocked) return;
  if (activeChapterIndex.value > 0) {
    activeChapterIndex.value--;
    emit('previousChapter');
  }
}

function backToDashboard() {
  router.push({ name: 'dashboard' });
}
</script>

<template>

  <div class="lvd-root">

    <div class="lvd-action-row">
      <button class="lvd-back-btn" @click="backToDashboard">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11.25 13.5L6.75 9L11.25 4.5" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back to TG Dashboard
      </button>
    </div>

    <div class="lvd-header-card">

      <div class="lvd-hc-top">
        <div class="lvd-hc-meta">
          <div class="lvd-hc-name-block">
            <span class="lvd-meta-label">Main Common Name(s):</span>
            <span class="lvd-meta-name">{{ mainCommonName }}</span>
          </div>
          <div class="lvd-hc-code-block">
            <span class="lvd-meta-label">UPOV Code(s):</span>
            <span class="lvd-meta-code">{{ upovCodes }}</span>
          </div>
        </div>
        <button class="lvd-submit-btn" @click="emit('submit')">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1.5C4.858 1.5 1.5 4.858 1.5 9S4.858 16.5 9 16.5 16.5 13.142 16.5 9 13.142 1.5 9 1.5Z" stroke="#DADE14" stroke-width="1.5"/>
            <path d="M6 9l2.25 2.25L12 6.75" stroke="#DADE14" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Submit
        </button>
      </div>

      <Transition name="lvd-slide">
        <div v-if="showDetails" class="lvd-hc-details">

          <div class="lvd-botanical-row">
            <span class="lvd-meta-label">Botanical Name(s):</span>
            <p class="lvd-botanical-text">{{ botanicalName }}</p>
            <div class="lvd-links-row">
              <span class="lvd-links-label">Related links:</span>
              <a v-for="(link, i) in relatedLinks" :key="i" :href="link.url || '#'" target="_blank" class="lvd-link">
                {{ link.text }}
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.875 2.438H2.438A1.063 1.063 0 0 0 1.375 3.5v7.063A1.063 1.063 0 0 0 2.438 11.624H9.5a1.063 1.063 0 0 0 1.063-1.062V8.125M7.813 1.375H11.625M11.625 1.375V5.188M11.625 1.375L4.875 8.125" stroke="#1C4240" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </a>
            </div>
          </div>

          <div class="lvd-docs-row">
            <span class="lvd-meta-label">Please indicate other associated UPOV documents:</span>
            <div class="lvd-rte">
              <div class="lvd-rte-toolbar">
                <div class="lvd-rte-icons">
                  <button class="lvd-rte-btn" title="Help">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#rte-clip-help)"><path d="M12 22.5C6.20101 22.5 1.5 17.799 1.5 12C1.5 6.20101 6.20101 1.5 12 1.5C17.799 1.5 22.5 6.20101 22.5 12C22.5 17.799 17.799 22.5 12 22.5ZM12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#1C4240"/><path d="M7.88267 8.67922C7.87128 8.88355 8.03986 9.04907 8.2445 9.04907H9.48123C9.68834 9.04907 9.85302 8.88019 9.88084 8.67496C10.0143 7.69077 10.6898 6.97339 11.8938 6.97339C12.9221 6.97339 13.8648 7.48755 13.8648 8.72534C13.8648 9.67749 13.303 10.1155 12.4175 10.782C11.4082 11.5151 10.6084 12.3721 10.6656 13.7622L10.67 14.0874C10.6728 14.2925 10.8399 14.4573 11.045 14.4573H12.2615C12.4686 14.4573 12.6365 14.2894 12.6365 14.0823V13.9241C12.6365 12.8481 13.0459 12.5339 14.1504 11.696C15.0645 11.001 16.0166 10.2297 16.0166 8.61108C16.0166 6.34497 14.1028 5.25 12.0081 5.25C10.1075 5.25 8.02446 6.13592 7.88267 8.67922ZM10.218 17.3232C10.218 18.123 10.856 18.7134 11.732 18.7134C12.646 18.7134 13.2744 18.123 13.2744 17.3232C13.2744 16.4949 12.646 15.9141 11.732 15.9141C10.856 15.9141 10.218 16.4949 10.218 17.3232Z" fill="#1C4240"/></g><defs><clipPath id="rte-clip-help"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>
                  </button>
                  <button class="lvd-rte-btn" title="Person">
                    <svg width="21" height="24" viewBox="0 0 21 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.75 2.25C12.75 3.49264 11.7426 4.5 10.5 4.5C9.25736 4.5 8.25 3.49264 8.25 2.25C8.25 1.00736 9.25736 0 10.5 0C11.7426 0 12.75 1.00736 12.75 2.25Z" fill="#1C4240"/><path d="M7.5 8.25L0.697875 7.58723C0.299187 7.5374 0 7.19848 0 6.79669C0 6.35669 0.356692 6 0.796693 6H20.2033C20.6433 6 21 6.35669 21 6.79669C21 7.19848 20.7008 7.5374 20.3021 7.58723L13.5 8.25V13.5L14.1775 23.1301C14.2165 23.5984 13.847 24 13.3771 24C13.0086 24 12.6873 23.7492 12.5979 23.3916L10.8638 14.9552C10.7691 14.5765 10.2309 14.5765 10.1362 14.9552L8.40209 23.3916C8.31271 23.7492 7.99145 24 7.6229 24C7.153 24 6.78347 23.5984 6.82249 23.1301L7.5 13.5V8.25Z" fill="#1C4240"/></svg>
                  </button>
                  <div class="lvd-rte-group">
                    <button class="lvd-rte-btn" title="Text format">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.36621 19.6216L4.78125 15.4175H9.99023L11.4053 19.6216H13.292L8.30859 5.625H6.4834L1.5 19.6216H3.36621ZM7.4165 7.7373L9.5083 13.9717H5.26318L7.36523 7.7373H7.4165Z" fill="#1C4240"/><path d="M21.1362 18.2783H21.1875V19.6216H22.8794V12.1875C22.8794 9.92139 21.208 8.67041 18.9111 8.67041C16.3066 8.67041 15.0249 10.0444 14.9121 11.9312H16.5732C16.6758 10.8545 17.4653 10.147 18.8496 10.147C20.3057 10.147 21.126 10.9263 21.126 12.3413V13.4385H18.2856C15.8145 13.4487 14.502 14.6382 14.502 16.5249C14.502 18.5039 15.9375 19.7959 18.019 19.7959C19.6084 19.7959 20.5928 19.1499 21.1362 18.2783ZM18.4907 18.3296C17.3628 18.3296 16.3066 17.7349 16.3066 16.4634C16.3066 15.4893 16.9424 14.792 18.4189 14.792H21.126V16.043C21.126 17.3862 19.998 18.3296 18.4907 18.3296Z" fill="#1C4240"/></svg>
                    </button>
                    <span class="lvd-rte-dropdown-caret"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.64645 4.64645C1.84171 4.45118 2.15829 4.45118 2.35355 4.64645L8 10.2929L13.6464 4.64645C13.8417 4.45118 14.1583 4.45118 14.3536 4.64645C14.5488 4.84171 14.5488 5.15829 14.3536 5.35355L8.35355 11.3536C8.15829 11.5488 7.84171 11.5488 7.64645 11.3536L1.64645 5.35355C1.45118 5.15829 1.45118 4.84171 1.64645 4.64645Z" fill="#727272"/></svg></span>
                  </div>
                  <button class="lvd-rte-btn" title="List">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 17.25C7.5 16.8358 7.83579 16.5 8.25 16.5H21.75C22.1642 16.5 22.5 16.8358 22.5 17.25C22.5 17.6642 22.1642 18 21.75 18H8.25C7.83579 18 7.5 17.6642 7.5 17.25Z" fill="#1C4240"/><path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 11.25C7.5 10.8358 7.83579 10.5 8.25 10.5H21.75C22.1642 10.5 22.5 10.8358 22.5 11.25C22.5 11.6642 22.1642 12 21.75 12H8.25C7.83579 12 7.5 11.6642 7.5 11.25Z" fill="#1C4240"/><path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 5.25C7.5 4.83579 7.83579 4.5 8.25 4.5H21.75C22.1642 4.5 22.5 4.83579 22.5 5.25C22.5 5.66421 22.1642 6 21.75 6H8.25C7.83579 6 7.5 5.66421 7.5 5.25Z" fill="#1C4240"/><path fill-rule="evenodd" clip-rule="evenodd" d="M5.78033 3.21967C6.07322 3.51256 6.07322 3.98744 5.78033 4.28033L3.53033 6.53033C3.23744 6.82322 2.76256 6.82322 2.46967 6.53033L1.71967 5.78033C1.42678 5.48744 1.42678 5.01256 1.71967 4.71967C2.01256 4.42678 2.48744 4.42678 2.78033 4.71967L3 4.93934L4.71967 3.21967C5.01256 2.92678 5.48744 2.92678 5.78033 3.21967Z" fill="#1C4240"/><path fill-rule="evenodd" clip-rule="evenodd" d="M5.78033 9.21967C6.07322 9.51256 6.07322 9.98744 5.78033 10.2803L3.53033 12.5303C3.23744 12.8232 2.76256 12.8232 2.46967 12.5303L1.71967 11.7803C1.42678 11.4874 1.42678 11.0126 1.71967 10.7197C2.01256 10.4268 2.48744 10.4268 2.78033 10.7197L3 10.9393L4.71967 9.21967C5.01256 8.92678 5.48744 8.92678 5.78033 9.21967Z" fill="#1C4240"/><path fill-rule="evenodd" clip-rule="evenodd" d="M5.78033 15.2197C6.07322 15.5126 6.07322 15.9874 5.78033 16.2803L3.53033 18.5303C3.23744 18.8232 2.76256 18.8232 2.46967 18.5303L1.71967 17.7803C1.42678 17.4874 1.42678 17.0126 1.71967 16.7197C2.01256 16.4268 2.48744 16.4268 2.78033 16.7197L3 16.9393L4.71967 15.2197C5.01256 14.9268 5.48744 14.9268 5.78033 15.2197Z" fill="#1C4240"/></svg>
                  </button>
                  <button class="lvd-rte-btn" title="Code">
                    <svg width="20" height="12" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.53033 1.28033C6.82322 0.987437 6.82322 0.512563 6.53033 0.21967C6.23744 -0.0732233 5.76256 -0.0732233 5.46967 0.21967L0.21967 5.46967C-0.0732233 5.76256 -0.0732233 6.23744 0.21967 6.53033L5.46967 11.7803C5.76256 12.0732 6.23744 12.0732 6.53033 11.7803C6.82322 11.4874 6.82322 11.0126 6.53033 10.7197L1.81066 6L6.53033 1.28033Z" fill="#1C4240"/><path d="M12.9697 1.28033C12.6768 0.987437 12.6768 0.512563 12.9697 0.21967C13.2626 -0.0732233 13.7374 -0.0732233 14.0303 0.21967L19.2803 5.46967C19.5732 5.76256 19.5732 6.23744 19.2803 6.53033L14.0303 11.7803C13.7374 12.0732 13.2626 12.0732 12.9697 11.7803C12.6768 11.4874 12.6768 11.0126 12.9697 10.7197L17.6893 6L12.9697 1.28033Z" fill="#1C4240"/></svg>
                  </button>
                  <div class="lvd-rte-group">
                    <button class="lvd-rte-btn" title="Export">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 3V7C13 7.13132 13.0259 7.26136 13.0761 7.38268C13.1264 7.50401 13.2 7.61425 13.2929 7.70711C13.3858 7.79997 13.496 7.87362 13.6173 7.92388C13.7386 7.97413 13.8687 8 14 8H18" stroke="#1C4240" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5002 21H6.00024C5.46981 21 4.9611 20.7893 4.58603 20.4142C4.21096 20.0391 4.00024 19.5304 4.00024 19V5C4.00024 4.46957 4.21096 3.96086 4.58603 3.58579C4.9611 3.21071 5.46981 3 6.00024 3H13.0002L18.0002 8V13M13.0002 19H20.0002M20.0002 19L17.0002 16M20.0002 19L17.0002 22" stroke="#1C4240" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <span class="lvd-rte-dropdown-caret"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.64645 4.64645C1.84171 4.45118 2.15829 4.45118 2.35355 4.64645L8 10.2929L13.6464 4.64645C13.8417 4.45118 14.1583 4.45118 14.3536 4.64645C14.5488 4.84171 14.5488 5.15829 14.3536 5.35355L8.35355 11.3536C8.15829 11.5488 7.84171 11.5488 7.64645 11.3536L1.64645 5.35355C1.45118 5.15829 1.45118 4.84171 1.64645 4.64645Z" fill="#727272"/></svg></span>
                  </div>
                  <button class="lvd-rte-btn" title="Paint">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#rte-clip-paint)"><path d="M0 3C0 1.34531 1.34531 0 3 0H16.5C18.1547 0 19.5 1.34531 19.5 3V6C19.5 7.65469 18.1547 9 16.5 9H3C1.34531 9 0 7.65469 0 6V3ZM7.5 16.5C7.5 15.6703 8.17031 15 9 15V14.25C9 12.1781 10.6781 10.5 12.75 10.5H19.5C20.3297 10.5 21 9.82969 21 9V3.25781C22.7484 3.87656 24 5.54063 24 7.5V9C24 11.4844 21.9844 13.5 19.5 13.5H12.75C12.3375 13.5 12 13.8375 12 14.25V15C12.8297 15 13.5 15.6703 13.5 16.5V22.5C13.5 23.3297 12.8297 24 12 24H9C8.17031 24 7.5 23.3297 7.5 22.5V16.5Z" fill="#1C4240"/></g><defs><clipPath id="rte-clip-paint"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>
                  </button>
                  <button class="lvd-rte-btn" title="Link">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 13C10.4295 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9403 15.7513 14.6897C16.4231 14.4392 17.0331 14.047 17.54 13.54L20.54 10.54C21.4508 9.59695 21.9548 8.33394 21.9434 7.02296C21.932 5.71198 21.4061 4.45791 20.4791 3.53087C19.5521 2.60383 18.298 2.07799 16.987 2.0666C15.676 2.0552 14.413 2.55918 13.47 3.46997L11.75 5.17997" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11C13.5705 10.4259 13.0226 9.9508 12.3934 9.60704C11.7642 9.26328 11.0684 9.05886 10.3533 9.00765C9.63816 8.95643 8.92037 9.05961 8.24861 9.3102C7.57685 9.56079 6.96684 9.95291 6.45996 10.46L3.45996 13.46C2.54917 14.403 2.04519 15.666 2.05659 16.977C2.06798 18.288 2.59382 19.542 3.52086 20.4691C4.4479 21.3961 5.70197 21.922 7.01295 21.9334C8.32393 21.9447 9.58694 21.4408 10.53 20.53L12.24 18.82" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <button class="lvd-rte-btn" title="Highlight">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#rte-clip-highlight)"><path fill-rule="evenodd" clip-rule="evenodd" d="M16.6435 0.966605C17.823 -0.153921 19.6807 -0.130109 20.8311 1.02028L22.9796 3.16885C24.13 4.31924 24.1538 6.17691 23.0333 7.35641L22.4137 8.00869L10.3083 21.5008C10.166 21.6593 9.96304 21.7499 9.75002 21.7499H5.25002C5.12625 21.7499 5.00563 21.7193 4.89828 21.6623L4.28035 22.2802C4.1397 22.4209 3.94893 22.4999 3.75002 22.4999H0.750022C0.446675 22.4999 0.173198 22.3172 0.0571123 22.0369C-0.0589735 21.7567 0.00519334 21.4341 0.219692 21.2196L2.33762 19.1016C2.28062 18.9943 2.25002 18.8737 2.25002 18.7499V14.2499C2.25002 14.0369 2.3406 13.8339 2.49916 13.6917L15.9912 1.58628L16.6435 0.966605ZM16.4721 3.1701L4.09019 14.2794L9.72052 19.9097L20.8298 7.52785L16.4721 3.1701ZM21.8487 6.42546L21.9458 6.32329C22.5061 5.73354 22.4942 4.8047 21.919 4.22951L19.7704 2.08094C19.1952 1.50575 18.2664 1.49384 17.6766 2.0541L17.5745 2.15117L21.8487 6.42546ZM7.93936 20.2499L3.75002 16.0606V18.4392L5.56068 20.2499H7.93936Z" fill="#1C4240"/></g><defs><clipPath id="rte-clip-highlight"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>
                  </button>
                  <div class="lvd-rte-group">
                    <button class="lvd-rte-btn" title="Table">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#rte-clip-table)"><path d="M0 3C0 1.34315 1.34315 0 3 0H21C22.6569 0 24 1.34315 24 3V21C24 22.6569 22.6569 24 21 24H3C1.34315 24 0 22.6569 0 21V3ZM22.5 6H16.5V10.5H22.5V6ZM22.5 12H16.5V16.5H22.5V12ZM22.5 18H16.5V22.5H21C21.8284 22.5 22.5 21.8284 22.5 21V18ZM15 22.5V18H9V22.5H15ZM7.5 22.5V18H1.5V21C1.5 21.8284 2.17157 22.5 3 22.5H7.5ZM1.5 16.5H7.5V12H1.5V16.5ZM1.5 10.5H7.5V6H1.5V10.5ZM9 6V10.5H15V6H9ZM15 12H9V16.5H15V12Z" fill="#1C4240"/></g><defs><clipPath id="rte-clip-table"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>
                    </button>
                    <span class="lvd-rte-dropdown-caret"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.64645 4.64645C1.84171 4.45118 2.15829 4.45118 2.35355 4.64645L8 10.2929L13.6464 4.64645C13.8417 4.45118 14.1583 4.45118 14.3536 4.64645C14.5488 4.84171 14.5488 5.15829 14.3536 5.35355L8.35355 11.3536C8.15829 11.5488 7.84171 11.5488 7.64645 11.3536L1.64645 5.35355C1.45118 5.15829 1.45118 4.84171 1.64645 4.64645Z" fill="#727272"/></svg></span>
                  </div>
                  <button class="lvd-rte-btn" title="Image">
                    <svg width="24" height="21" viewBox="0 0 24 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6.75C9 7.99264 7.99264 9 6.75 9C5.50736 9 4.5 7.99264 4.5 6.75C4.5 5.50736 5.50736 4.5 6.75 4.5C7.99264 4.5 9 5.50736 9 6.75Z" fill="#1C4240"/><path d="M3 0C1.34315 0 0 1.34315 0 3V18C0 19.6569 1.34315 21 3 21H21C22.6569 21 24 19.6569 24 18V3C24 1.34315 22.6569 0 21 0H3ZM21 1.5C21.8284 1.5 22.5 2.17157 22.5 3V12.75L16.8354 9.8292C16.5467 9.68483 16.1979 9.74142 15.9697 9.96969L10.4044 15.5349L6.41603 12.876C6.11856 12.6777 5.72247 12.7169 5.46967 12.9697L1.5 16.5V3C1.5 2.17157 2.17157 1.5 3 1.5H21Z" fill="#1C4240"/></svg>
                  </button>
                </div>
              </div>
<div class="lvd-rte-field" ref="rteFieldRef">
<textarea
  ref="rteTextareaRef"
  v-model="textareaValue"
  class="lvd-rte-textarea"
  placeholder="Add explanation here">
</textarea>              
<span class="lvd-rte-resize" @mousedown="startResize">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.0988 12.3558L12.3559 11.0987C12.7016 10.753 12.7441 10.2298 12.4503 9.93604C12.1565 9.64228 11.6334 9.68478 11.2877 10.0305L10.0306 11.2876C9.68489 11.6332 9.64239 12.1564 9.93615 12.4502C10.2299 12.7439 10.7531 12.7015 11.0988 12.3558ZM0.195356 11.509C0.489112 11.8027 1.0123 11.7602 1.358 11.4145L11.4146 1.35789C11.7603 1.01219 11.8028 0.489002 11.5091 0.195247C11.2153 -0.0985092 10.6921 -0.0560124 10.3464 0.289684L0.289794 10.3463C-0.0559024 10.692 -0.0983995 11.2152 0.195356 11.509ZM5.91412 12.1994L12.1995 5.91401C12.5452 5.56832 12.5877 5.04513 12.294 4.75137C12.0002 4.45762 11.477 4.50011 11.1313 4.84581L4.84592 11.1312C4.50022 11.4769 4.45773 12.0001 4.75148 12.2938C5.04524 12.5876 5.56842 12.5451 5.91412 12.1994Z" fill="#1C4240"/></svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <div class="lvd-hc-bottom">
        <button class="lvd-toggle-btn" @click="toggleDetails">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path v-if="showDetails" d="M4.5 11.25L9 6.75L13.5 11.25" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path v-else d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ showDetails ? 'Less details' : 'More details' }}
        </button>
        <div class="lvd-save-info">
          <span class="lvd-save-doc">{{ documentName }}</span>
          <span class="lvd-save-date">{{ savedDate }}</span>
        </div>
      </div>
    </div>

    <div class="lvd-content-area">

      <aside class="lvd-stepper" :class="{ 'lvd-stepper--collapsed': chapterNavCollapsed }">
        <span v-show="!chapterNavCollapsed" class="lvd-stepper-heading">Chapters</span>
        <ul class="lvd-stepper-list">
          <li
            v-for="(ch, idx) in chapters"
            :key="ch.number"
            class="lvd-step"
            :class="{
              'lvd-step--current': idx === activeChapterIndex,
              'lvd-step--pending': idx !== activeChapterIndex,
            }"
            @click="setActiveChapter(idx)"
          >
            <span class="lvd-step-num" :class="{ 'lvd-step-num--active': idx === activeChapterIndex }">
              {{ ch.number }}
            </span>
            <!-- sidebar uses the SHORT title -->
            <span v-show="!chapterNavCollapsed" class="lvd-step-title">{{ ch.sidebarTitle }}</span>
          </li>
        </ul>
        <button class="lvd-collapse-btn" @click="toggleChapterNav">
          <svg v-if="chapterNavCollapsed" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.47 16.28a.75.75 0 0 1 0-1.06L11.69 9 5.47 2.78a.75.75 0 1 1 1.06-1.06l6.75 6.75a.75.75 0 0 1 0 1.06l-6.75 6.75a.75.75 0 0 1-1.06 0Z" fill="#1C4240"/>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12.53 1.72a.75.75 0 0 1 0 1.06L6.31 9l6.22 6.22a.75.75 0 1 1-1.06 1.06l-6.75-6.75a.75.75 0 0 1 0-1.06l6.75-6.75a.75.75 0 0 1 1.06 0Z" fill="#1C4240"/>
          </svg>
          <span v-show="!chapterNavCollapsed" class="lvd-collapse-label">Collapse</span>
        </button>
      </aside>

      <main class="lvd-main">
        <!-- main heading uses the LONG title -->
        <h1 class="lvd-section-heading">
          {{ Number(activeChapter.number) }}. {{ activeChapter.pageTitle }}
        </h1>

        <!-- ── Material accordion — chapter 02 ─────────────────────────────── -->
        <template v-if="activeChapterIndex === 1">
          <div class="lvd-mat-accordion">

            <div class="lvd-mat-card">
              <button class="lvd-mat-header" @click="toggleMaterialSection('mat-2-1')">
                <span class="lvd-mat-chevron">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path v-if="materialSections[0].isOpen" d="M4.5 11.25L9 6.75L13.5 11.25" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path v-else d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <h4 class="lvd-mat-title">{{ materialSections[0].number }} {{ materialSections[0].title }}</h4>
              </button>
              <Transition name="lvd-mat-body">
                <div v-if="materialSections[0].isOpen" class="lvd-mat-body">
                  <p class="lvd-mat-empty">No content available.</p>
                </div>
              </Transition>
            </div>

            <div class="lvd-mat-card">
              <button class="lvd-mat-header" @click="toggleMaterialSection('mat-2-2')">
                <span class="lvd-mat-chevron">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path v-if="materialSections[1].isOpen" d="M4.5 11.25L9 6.75L13.5 11.25" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path v-else d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <h4 class="lvd-mat-title">{{ materialSections[1].number }} {{ materialSections[1].title }}</h4>
              </button>
              <Transition name="lvd-mat-body">
                <div v-if="materialSections[1].isOpen" class="lvd-mat-body">
                  <p class="lvd-mat-empty">No content available.</p>
                </div>
              </Transition>
            </div>

            <div class="lvd-mat-card">
              <button class="lvd-mat-header" @click="toggleMaterialSection('mat-2-3')">
                <span class="lvd-mat-chevron">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path v-if="materialSections[2].isOpen" d="M4.5 11.25L9 6.75L13.5 11.25" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path v-else d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <h4 class="lvd-mat-title">{{ materialSections[2].number }} {{ materialSections[2].title }}</h4>
              </button>
              <Transition name="lvd-mat-body">
                <div v-if="materialSections[2].isOpen" class="lvd-mat-body lvd-mat-body--seed">
                  <p class="lvd-mat-instruction">Please select one of the options (if applicable).</p>
                  <div class="lvd-mat-radios">
                    <label class="lvd-mat-radio-row" @click.prevent="seedQualityRadio = 'seed-only'">
                      <span class="lvd-mat-radio-circle" :class="{ 'lvd-mat-radio-circle--on': seedQualityRadio === 'seed-only' }"></span>
                      <span class="lvd-mat-radio-text">Test Guidelines which only apply to seed-propagated varieties:</span>
                    </label>
                    <label class="lvd-mat-radio-row" @click.prevent="seedQualityRadio = 'both'">
                      <span class="lvd-mat-radio-circle" :class="{ 'lvd-mat-radio-circle--on': seedQualityRadio === 'both' }"></span>
                      <span class="lvd-mat-radio-text">Test Guidelines which apply to seed-propagated varieties as well as other types of varieties:</span>
                    </label>
                  </div>
                  <div class="lvd-mat-preview">
                    <div class="lvd-mat-preview-hd">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M8.5 1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V5.5L8.5 1ZM8.5 1v4.5H13" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M5 9.5h5M5 11.5h3" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round"/>
                      </svg>
                      <span class="lvd-mat-preview-tag">PREVIEW</span>
                    </div>
                    <div class="lvd-mat-info-row">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <circle cx="7.5" cy="7.5" r="6.5" stroke="#303030" stroke-width="1.1"/>
                        <path d="M7.5 6.5V10.5" stroke="#303030" stroke-width="1.3" stroke-linecap="round"/>
                        <circle cx="7.5" cy="4.5" r="0.8" fill="#303030"/>
                      </svg>
                      <span class="lvd-mat-info-text">There is currently no information to fill in.</span>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

          </div>
        </template>

        <!-- ── Examination accordion — chapter 03 ──────────────────────────── -->
        <template v-else-if="activeChapterIndex === 2">
          <div class="lvd-mat-accordion">

            <!-- 3.1 Number of Growing Cycles -->
            <div class="lvd-mat-card">
              <button class="lvd-mat-header" @click="toggleExaminationSection('ex-3-1')">
                <span class="lvd-mat-chevron">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path v-if="examinationSections[0].isOpen" d="M4.5 11.25L9 6.75L13.5 11.25" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path v-else d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <h4 class="lvd-mat-title">{{ examinationSections[0].number }} {{ examinationSections[0].title }}</h4>
              </button>
              <Transition name="lvd-mat-body">
                <div v-if="examinationSections[0].isOpen" class="lvd-mat-body lvd-ex-body">

                  <div class="lvd-section-links">
                    <span class="lvd-links-label">Related links:</span>
                    <div class="lvd-section-links-items">
                      <a v-for="(lnk, i) in examinationRelatedLinks" :key="i" :href="lnk.url || '#'" target="_blank" class="lvd-link">
                        {{ lnk.text }}
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.875 2.438H2.438A1.063 1.063 0 0 0 1.375 3.5v7.063A1.063 1.063 0 0 0 2.438 11.624H9.5a1.063 1.063 0 0 0 1.063-1.062V8.125M7.813 1.375H11.625M11.625 1.375V5.188M11.625 1.375L4.875 8.125" stroke="#1C4240" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </a>
                    </div>
                  </div>

                  <div class="lvd-question">
                    <h3 class="lvd-q-label">3.1.1 Title text</h3>
                    <div class="lvd-ex-radios">
                      <label class="lvd-ex-radio-row" @click.prevent="growingCycleRadio = 'single'; growingCycleSubRadio = null">
                        <span class="lvd-ex-radio-circle" :class="{ 'lvd-ex-radio-circle--on': growingCycleRadio === 'single' }"></span>
                        <span class="lvd-ex-radio-text">Single growing cycle</span>
                      </label>
                      <label class="lvd-ex-radio-row" @click.prevent="growingCycleRadio = 'two'">
                        <span class="lvd-ex-radio-circle lvd-ex-radio-circle--green" :class="{ 'lvd-ex-radio-circle--on': growingCycleRadio === 'two' }"></span>
                        <span class="lvd-ex-radio-text">Two independent growing cycles</span>
                      </label>
                      <template v-if="growingCycleRadio === 'two'">
                        <label class="lvd-ex-radio-row lvd-ex-radio-row--indented" @click.prevent="growingCycleSubRadio = 'two-separate'">
                          <span class="lvd-ex-radio-circle" :class="{ 'lvd-ex-radio-circle--on': growingCycleSubRadio === 'two-separate' }"></span>
                          <span class="lvd-ex-radio-text">Two independent cycles in the form of two separate plantings</span>
                        </label>
                        <label class="lvd-ex-radio-row lvd-ex-radio-row--indented" @click.prevent="growingCycleSubRadio = 'single-planting'">
                          <span class="lvd-ex-radio-circle lvd-ex-radio-circle--green" :class="{ 'lvd-ex-radio-circle--on': growingCycleSubRadio === 'single-planting' }"></span>
                          <span class="lvd-ex-radio-text">Two independent cycles from a single planting</span>
                        </label>
                      </template>
                    </div>
                  </div>

                  <h3 class="lvd-q-label">3.1.2 Standard items are configured by default</h3>

                  <div class="lvd-question">
                    <h3 class="lvd-q-label">3.1.3 Title text</h3>
                    <p class="lvd-q-text">Is a satisfactory crop of fruit required?</p>
                    <div class="lvd-radio-group">
                      <label class="lvd-radio-opt" @click.prevent="satisfactoryFruitRadio = 'yes'">
                        <span class="lvd-radio-circle lvd-radio-circle--green" :class="{ 'lvd-radio-circle--on': satisfactoryFruitRadio === 'yes' }"></span>
                        <span class="lvd-radio-text">Yes</span>
                      </label>
                      <label class="lvd-radio-opt" @click.prevent="satisfactoryFruitRadio = 'no'">
                        <span class="lvd-radio-circle" :class="{ 'lvd-radio-circle--on': satisfactoryFruitRadio === 'no' }"></span>
                        <span class="lvd-radio-text">No</span>
                      </label>
                    </div>
                    <div v-if="satisfactoryFruitRadio === 'yes'" class="lvd-ex-radios lvd-ex-radios--indented">
                      <label class="lvd-ex-radio-row" @click.prevent="fruitTypeRadio = 'dormant'">
                        <span class="lvd-ex-radio-circle" :class="{ 'lvd-ex-radio-circle--on': fruitTypeRadio === 'dormant' }"></span>
                        <span class="lvd-ex-radio-text">Fruit species with clearly defined dormant period. <strong>(ASW3(a))</strong></span>
                      </label>
                      <label class="lvd-ex-radio-row" @click.prevent="fruitTypeRadio = 'no-dormant'">
                        <span class="lvd-ex-radio-circle" :class="{ 'lvd-ex-radio-circle--on': fruitTypeRadio === 'no-dormant' }"></span>
                        <span class="lvd-ex-radio-text">Fruit species with no clearly defined dormant period. <strong>(ASW3(b))</strong></span>
                      </label>
                      <label class="lvd-ex-radio-row" @click.prevent="fruitTypeRadio = 'evergreen'">
                        <span class="lvd-ex-radio-circle lvd-ex-radio-circle--green" :class="{ 'lvd-ex-radio-circle--on': fruitTypeRadio === 'evergreen' }"></span>
                        <span class="lvd-ex-radio-text">Evergreen species with indeterminate growth. <strong>(ASW3(c))</strong></span>
                      </label>
                    </div>
                  </div>

                  <h3 class="lvd-q-label">3.1.4 Standard items are configured by default</h3>

                  <div class="lvd-preview-box">
                    <div class="lvd-preview-header">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M8.5 1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V5.5L8.5 1ZM8.5 1v4.5H13" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 9.5h5M5 11.5h3" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round"/></svg>
                      <span class="lvd-preview-label">PREVIEW</span>
                    </div>
                    <p class="lvd-preview-text">3.1.1 The minimum duration of tests should normally be two independent growing cycles.</p>
                    <p class="lvd-preview-text">3.1.2 The two independent growing cycles may be observed from a single planting, examined in two separate growing cycles.</p>
                    <div class="lvd-ex-inline-row">
                      <span class="lvd-preview-text">3.1.3 In particular, it is essential that the</span>
                      <div class="lvd-ex-input-wrap">
                        <input v-model="inlineTreesInput" class="lvd-ex-input" type="text" placeholder="trees" />
                      </div>
                      <span class="lvd-preview-text">produce a satisfactory crop of fruit in each of the two growing cycles.</span>
                    </div>
                    <p class="lvd-preview-text">3.1.4 The testing of a ....</p>
                  </div>

                </div>
              </Transition>
            </div>

            <!-- 3.2 Testing Place -->
            <div class="lvd-mat-card">
              <button class="lvd-mat-header" @click="toggleExaminationSection('ex-3-2')">
                <span class="lvd-mat-chevron">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path v-if="examinationSections[1].isOpen" d="M4.5 11.25L9 6.75L13.5 11.25" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path v-else d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <h4 class="lvd-mat-title">{{ examinationSections[1].number }} {{ examinationSections[1].title }}</h4>
              </button>
              <Transition name="lvd-mat-body">
                <div v-if="examinationSections[1].isOpen" class="lvd-mat-body lvd-ex-body">
                  <h3 class="lvd-q-label">3.2.1 Standard items are configured by default</h3>
                  <div class="lvd-preview-box">
                    <div class="lvd-preview-header">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M8.5 1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V5.5L8.5 1ZM8.5 1v4.5H13" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 9.5h5M5 11.5h3" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round"/></svg>
                      <span class="lvd-preview-label">PREVIEW</span>
                    </div>
                    <p class="lvd-preview-text">3.2.1 Tests are normally conducted at one place. In the case of tests conducted at more than one place, guidance is provided in TGP/9 "Examining Distinctness".</p>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- 3.3 Conditions for Conducting the Examination -->
            <div class="lvd-mat-card">
              <button class="lvd-mat-header" @click="toggleExaminationSection('ex-3-3')">
                <span class="lvd-mat-chevron">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path v-if="examinationSections[2].isOpen" d="M4.5 11.25L9 6.75L13.5 11.25" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path v-else d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <h4 class="lvd-mat-title">{{ examinationSections[2].number }} {{ examinationSections[2].title }}</h4>
              </button>
              <Transition name="lvd-mat-body">
                <div v-if="examinationSections[2].isOpen" class="lvd-mat-body lvd-ex-body">

                  <div class="lvd-section-links">
                    <span class="lvd-links-label">Related links:</span>
                    <div class="lvd-section-links-items">
                      <a v-for="(lnk, i) in ex33RelatedLinks" :key="i" :href="lnk.url || '#'" target="_blank" class="lvd-link">
                        {{ lnk.text }}
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.875 2.438H2.438A1.063 1.063 0 0 0 1.375 3.5v7.063A1.063 1.063 0 0 0 2.438 11.624H9.5a1.063 1.063 0 0 0 1.063-1.062V8.125M7.813 1.375H11.625M11.625 1.375V5.188M11.625 1.375L4.875 8.125" stroke="#1C4240" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </a>
                    </div>
                  </div>

                  <div class="lvd-question">
                    <h3 class="lvd-q-label">3.3.1 Title text</h3>
                    <p class="lvd-q-text">Indicate if there are stages of development in the Table of Characteristics</p>
                    <div class="lvd-radio-group">
                      <label class="lvd-radio-opt" @click.prevent="condStagesRadio = 'yes'">
                        <span class="lvd-radio-circle" :class="{ 'lvd-radio-circle--on': condStagesRadio === 'yes' }"></span>
                        <span class="lvd-radio-text">Yes</span>
                      </label>
                      <label class="lvd-radio-opt" @click.prevent="condStagesRadio = 'no'">
                        <span class="lvd-radio-circle lvd-radio-circle--green" :class="{ 'lvd-radio-circle--on': condStagesRadio === 'no' }"></span>
                        <span class="lvd-radio-text">No</span>
                      </label>
                    </div>
                  </div>

                  <div class="lvd-question">
                    <h3 class="lvd-q-label">3.3.2 Title text</h3>
                    <p class="lvd-q-text">Are there different types of plots for observation?</p>
                    <div class="lvd-radio-group">
                      <label class="lvd-radio-opt" @click.prevent="condPlotsRadio = 'yes'">
                        <span class="lvd-radio-circle" :class="{ 'lvd-radio-circle--on': condPlotsRadio === 'yes' }"></span>
                        <span class="lvd-radio-text">Yes</span>
                      </label>
                      <label class="lvd-radio-opt" @click.prevent="condPlotsRadio = 'no'">
                        <span class="lvd-radio-circle lvd-radio-circle--green" :class="{ 'lvd-radio-circle--on': condPlotsRadio === 'no' }"></span>
                        <span class="lvd-radio-text">No</span>
                      </label>
                    </div>
                  </div>

                  <div class="lvd-question">
                    <h3 class="lvd-q-label">3.3.3 Title text</h3>
                    <p class="lvd-q-text">Indicate if the observation of color by eye applies:</p>
                    <div class="lvd-radio-group">
                      <label class="lvd-radio-opt" @click.prevent="condColorRadio = 'yes'">
                        <span class="lvd-radio-circle" :class="{ 'lvd-radio-circle--on': condColorRadio === 'yes' }"></span>
                        <span class="lvd-radio-text">Yes</span>
                      </label>
                      <label class="lvd-radio-opt" @click.prevent="condColorRadio = 'no'">
                        <span class="lvd-radio-circle lvd-radio-circle--green" :class="{ 'lvd-radio-circle--on': condColorRadio === 'no' }"></span>
                        <span class="lvd-radio-text">No</span>
                      </label>
                    </div>
                  </div>

                  <div class="lvd-preview-box">
                    <div class="lvd-preview-header">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M8.5 1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V5.5L8.5 1ZM8.5 1v4.5H13" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 9.5h5M5 11.5h3" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round"/></svg>
                      <span class="lvd-preview-label">PREVIEW</span>
                    </div>
                    <div class="lvd-mat-info-row">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" stroke="#303030" stroke-width="1.1"/><path d="M7.5 6.5V10.5" stroke="#303030" stroke-width="1.3" stroke-linecap="round"/><circle cx="7.5" cy="4.5" r="0.8" fill="#303030"/></svg>
                      <span class="lvd-mat-info-text">There is currently no information to fill in.</span>
                    </div>
                  </div>

                </div>
              </Transition>
            </div>

            <!-- 3.4 Test Design -->
            <div class="lvd-mat-card">
              <button class="lvd-mat-header" @click="toggleExaminationSection('ex-3-4')">
                <span class="lvd-mat-chevron">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path v-if="examinationSections[3].isOpen" d="M4.5 11.25L9 6.75L13.5 11.25" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path v-else d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <h4 class="lvd-mat-title">{{ examinationSections[3].number }} {{ examinationSections[3].title }}</h4>
              </button>
              <Transition name="lvd-mat-body">
                <div v-if="examinationSections[3].isOpen" class="lvd-mat-body lvd-ex-body">

                  <div class="lvd-section-links">
                    <span class="lvd-links-label">Related links:</span>
                    <div class="lvd-section-links-items">
                      <a v-for="(lnk, i) in ex34RelatedLinks" :key="i" :href="lnk.url || '#'" target="_blank" class="lvd-link">
                        {{ lnk.text }}
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.875 2.438H2.438A1.063 1.063 0 0 0 1.375 3.5v7.063A1.063 1.063 0 0 0 2.438 11.624H9.5a1.063 1.063 0 0 0 1.063-1.062V8.125M7.813 1.375H11.625M11.625 1.375V5.188M11.625 1.375L4.875 8.125" stroke="#1C4240" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </a>
                    </div>
                  </div>

                  <div class="lvd-question">
                    <h3 class="lvd-q-label">3.4.1 Title text</h3>
                    <p class="lvd-q-text">Is there more than one method of propagation: <span class="lvd-required">*</span></p>
                    <div class="lvd-radio-group">
                      <label class="lvd-radio-opt" @click.prevent="tdMorePropRadio = 'yes'">
                        <span class="lvd-radio-circle" :class="{ 'lvd-radio-circle--on': tdMorePropRadio === 'yes' }"></span>
                        <span class="lvd-radio-text">Yes</span>
                      </label>
                      <label class="lvd-radio-opt" @click.prevent="tdMorePropRadio = 'no'">
                        <span class="lvd-radio-circle lvd-radio-circle--green" :class="{ 'lvd-radio-circle--on': tdMorePropRadio === 'no' }"></span>
                        <span class="lvd-radio-text">No</span>
                      </label>
                    </div>
                  </div>

                  <div class="lvd-question">
                    <h3 class="lvd-q-label">3.4.2 Plot design</h3>
                    <div class="lvd-ex-radios">
                      <label class="lvd-ex-radio-row" @click.prevent="tdPlotDesignRadio = 'single'">
                        <span class="lvd-ex-radio-circle lvd-ex-radio-circle--green" :class="{ 'lvd-ex-radio-circle--on': tdPlotDesignRadio === 'single' }"></span>
                        <span class="lvd-ex-radio-text">Single plot</span>
                      </label>
                      <label class="lvd-ex-radio-row" @click.prevent="tdPlotDesignRadio = 'one-type'">
                        <span class="lvd-ex-radio-circle" :class="{ 'lvd-ex-radio-circle--on': tdPlotDesignRadio === 'one-type' }"></span>
                        <span class="lvd-ex-radio-text">One type of plot, but replicated</span>
                      </label>
                      <label class="lvd-ex-radio-row" @click.prevent="tdPlotDesignRadio = 'diff-types'">
                        <span class="lvd-ex-radio-circle" :class="{ 'lvd-ex-radio-circle--on': tdPlotDesignRadio === 'diff-types' }"></span>
                        <span class="lvd-ex-radio-text">If different types of plots</span>
                      </label>
                    </div>
                  </div>

                  <div class="lvd-question">
                    <h3 class="lvd-q-label">3.4.3 Title text</h3>
                    <p class="lvd-q-text">Is it necessary to state that the design of the tests should be such that plants or parts of plants may be removed for measurement or counting without prejudice to the observations which must be made up to the end of growing cycle?</p>
                    <div class="lvd-radio-group">
                      <label class="lvd-radio-opt" @click.prevent="tdRemovalRadio = 'yes'">
                        <span class="lvd-radio-circle lvd-radio-circle--green" :class="{ 'lvd-radio-circle--on': tdRemovalRadio === 'yes' }"></span>
                        <span class="lvd-radio-text">Yes</span>
                      </label>
                      <label class="lvd-radio-opt" @click.prevent="tdRemovalRadio = 'no'">
                        <span class="lvd-radio-circle" :class="{ 'lvd-radio-circle--on': tdRemovalRadio === 'no' }"></span>
                        <span class="lvd-radio-text">No</span>
                      </label>
                    </div>
                  </div>

                  <div class="lvd-preview-box">
                    <div class="lvd-preview-header">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M8.5 1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V5.5L8.5 1ZM8.5 1v4.5H13" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 9.5h5M5 11.5h3" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round"/></svg>
                      <span class="lvd-preview-label">PREVIEW</span>
                    </div>
                    <div class="lvd-ex-inline-row">
                      <span class="lvd-preview-text">3.4.2 Each test should be designed to result in a total of at least</span>
                      <div class="lvd-ex-input-wrap lvd-ex-input-wrap--sm">
                        <input v-model="tdPlantCountInput" class="lvd-ex-input" type="text" placeholder="3" />
                      </div>
                      <span class="lvd-preview-text">(number)</span>
                      <div class="lvd-ex-input-wrap">
                        <input v-model="tdPlantTypeInput" class="lvd-ex-input" type="text" placeholder="plants" />
                      </div>
                    </div>
                    <p class="lvd-preview-text">3.4.3 The design of the tests should be such that plants or parts of plants may be removed for measurement or counting without prejudice to the observations which must be made up to the end of the growing cycle.</p>
                  </div>

                </div>
              </Transition>
            </div>

            <!-- 3.5 Additional Tests -->
            <div class="lvd-mat-card">
              <button class="lvd-mat-header" @click="toggleExaminationSection('ex-3-5')">
                <span class="lvd-mat-chevron">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path v-if="examinationSections[4].isOpen" d="M4.5 11.25L9 6.75L13.5 11.25" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path v-else d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <h4 class="lvd-mat-title">{{ examinationSections[4].number }} {{ examinationSections[4].title }}</h4>
              </button>
              <Transition name="lvd-mat-body">
                <div v-if="examinationSections[4].isOpen" class="lvd-mat-body">
                  <p class="lvd-mat-empty">No content available.</p>
                </div>
              </Transition>
            </div>

          </div>
         
        </template>
<!-- ── Table of Characteristics — chapter 07 ──────────────────────────────── -->
<template v-else-if="activeChapterIndex === 6">
  <p class="lvd-toc-intro">Search or add new characteristics to describe your variety.</p>

  <!-- Search card -->
  <div class="lvd-toc-search-card">
    <h2 class="lvd-block-title">Search adopted characteristics</h2>

    <div class="lvd-toc-search-row">
      <!-- Search input -->
      <div class="lvd-toc-input-wrap" :class="{ 'lvd-toc-input-wrap--filled': tocSearchQuery }">
        <svg class="lvd-toc-input-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="8" cy="8" r="5.5" stroke="#547F71" stroke-width="1.5"/>
          <path d="M12.5 12.5L16 16" stroke="#547F71" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input
          v-model="tocSearchQuery"
          class="lvd-toc-input"
          type="text"
          placeholder="Search ..."
          @keyup.enter="tocSearch"
        />
        <button v-if="tocSearchQuery" class="lvd-toc-clear-btn" @click="tocClearSearch">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="#1C4240" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Clear
        </button>
      </div>

      <button class="lvd-toc-search-btn" @click="tocSearch">Search</button>

      <button class="lvd-toc-add-btn" @click="tocOpenAddModal">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="#1C4240" stroke-width="1.3"/>
          <path d="M8 5v6M5 8h6" stroke="#1C4240" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Add new characteristics
      </button>
    </div>

    <!-- Related links -->
    <div class="lvd-section-links">
      <span class="lvd-links-label">Related links:</span>
      <div class="lvd-section-links-items">
        <a href="#" target="_blank" class="lvd-link">
          Quantity of plant material required (GN7)
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.875 2.438H2.438A1.063 1.063 0 0 0 1.375 3.5v7.063A1.063 1.063 0 0 0 2.438 11.624H9.5a1.063 1.063 0 0 0 1.063-1.062V8.125M7.813 1.375H11.625M11.625 1.375V5.188M11.625 1.375L4.875 8.125" stroke="#1C4240" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </div>
    </div>

    <!-- Search results -->
    <template v-if="tocSearchDone">
      <p class="lvd-toc-results-label">
        Found {{ tocSearchResults.length }} results for <strong>"{{ tocSearchQuery }}"</strong>
      </p>
      <div v-if="tocSearchResults.length" class="lvd-toc-results-list">
        <div v-for="result in tocSearchResults" :key="result.id" class="lvd-toc-result-row">
  <div class="lvd-toc-result-main">
    <div class="lvd-toc-result-top">
      <span class="lvd-toc-result-name">{{ result.name }}</span>
      <span class="lvd-toc-result-col">{{ result.genus }}</span>
      <span class="lvd-toc-result-col">Methods: {{ result.methods }}</span>
      <span class="lvd-toc-result-col">Type: {{ result.type }}</span>
      <a href="#" target="_blank" class="lvd-toc-result-tg">
        {{ result.tgRef }}
        <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M4.875 2.438H2.438A1.063 1.063 0 0 0 1.375 3.5v7.063A1.063 1.063 0 0 0 2.438 11.624H9.5a1.063 1.063 0 0 0 1.063-1.062V8.125M7.813 1.375H11.625M11.625 1.375V5.188M11.625 1.375L4.875 8.125" stroke="#1C4240" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
    </div>
    <div class="lvd-toc-result-states">
      <span class="lvd-toc-result-states-label">States of Expression:</span>
      <span class="lvd-toc-result-states-val">{{ result.statesOfExpression }}</span>
    </div>
  </div>
  <button class="lvd-toc-import-btn" @click="tocImport(result)">Import</button>
</div>
      </div>
    </template>
  </div>

  <!-- Preview table -->
  <div class="lvd-toc-preview-section">
    <div class="lvd-toc-preview-header-row">
      <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
        <path d="M8.5 1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V5.5L8.5 1ZM8.5 1v4.5H13" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 9.5h5M5 11.5h3" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      <span class="lvd-toc-preview-tag">PREVIEW</span>
    </div>

    <h3 class="lvd-toc-preview-title">List of Characteristics ({{ tocCharacteristics.length }})</h3>

    <template v-if="tocCharacteristics.length === 0">
      <p class="lvd-toc-empty">There are currently no characteristics.</p>
    </template>

    <template v-else>
      <div class="lvd-toc-table-wrap">
        <!-- Header -->
        <div class="lvd-toc-table-header">
          <div class="lvd-toc-col lvd-toc-col--handle"></div>
          <div class="lvd-toc-col lvd-toc-col--num"></div>
          <div class="lvd-toc-col lvd-toc-col--english">English</div>
          <div class="lvd-toc-col lvd-toc-col--examples">Example Varieties</div>
          <div class="lvd-toc-col lvd-toc-col--notes">Notes</div>
          <div class="lvd-toc-col lvd-toc-col--delete">Delete</div>
        </div>

        <!-- Groups -->
<div
  v-for="(char, charIdx) in tocDisplayed"
  :key="char.id"
  class="lvd-toc-group"
  :class="{ 'lvd-toc-group--dragging': dragSrcIndex === charIdx }"
  draggable="true"
  @dragstart="tocDragStart(charIdx)"
  @dragover="tocDragOver"
  @drop="tocDrop(charIdx)"
  @dragend="tocDragEnd"
>

          <!-- Type/method row -->
         <!-- Type/method row -->
  <div class="lvd-toc-group-header">
    <div class="lvd-toc-col lvd-toc-col--handle" style="cursor: grab;">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <g clip-path="url(#clip0)">
          <path fill-rule="evenodd" clip-rule="evenodd"
            d="M1.25 10.0001C1.25 9.83438 1.31585 9.67541 1.43306 9.5582C1.55027 9.44099 1.70924 9.37514 1.875 9.37514H18.125C18.2908 9.37514 18.4497 9.44099 18.5669 9.5582C18.6842 9.67541 18.75 9.83438 18.75 10.0001C18.75 10.1659 18.6842 10.3249 18.5669 10.4421C18.4497 10.5593 18.2908 10.6251 18.125 10.6251H1.875C1.70924 10.6251 1.55027 10.5593 1.43306 10.4421C1.31585 10.3249 1.25 10.1659 1.25 10.0001ZM9.5575 0.182641C9.61556 0.124437 9.68453 0.0782581 9.76046 0.04675C9.83639 0.0152419 9.91779 -0.000976563 10 -0.000976562C10.0822 -0.000976563 10.1636 0.0152419 10.2395 0.04675C10.3155 0.0782581 10.3844 0.124437 10.4425 0.182641L12.9425 2.68264C13.0006 2.74075 13.0467 2.80974 13.0782 2.88566C13.1096 2.96159 13.1258 3.04296 13.1258 3.12514C13.1258 3.20732 13.1096 3.2887 13.0782 3.36462C13.0467 3.44054 13.0006 3.50953 12.9425 3.56764C12.8844 3.62575 12.8154 3.67185 12.7395 3.70329C12.6636 3.73474 12.5822 3.75093 12.5 3.75093C12.4178 3.75093 12.3364 3.73474 12.2605 3.70329C12.1846 3.67185 12.1156 3.62575 12.0575 3.56764L10.625 2.13389V6.87514C10.625 7.0409 10.5592 7.19987 10.4419 7.31708C10.3247 7.43429 10.1658 7.50014 10 7.50014C9.83424 7.50014 9.67527 7.43429 9.55806 7.31708C9.44085 7.19987 9.375 7.0409 9.375 6.87514V2.13389L7.9425 3.56764C7.82514 3.685 7.66597 3.75093 7.5 3.75093C7.33403 3.75093 7.17486 3.685 7.0575 3.56764C6.94014 3.45028 6.87421 3.29111 6.87421 3.12514C6.87421 2.95917 6.94014 2.8 7.0575 2.68264L9.5575 0.182641ZM10 12.5001C10.1658 12.5001 10.3247 12.566 10.4419 12.6832C10.5592 12.8004 10.625 12.9594 10.625 13.1251V17.8664L12.0575 16.4326C12.1749 16.3153 12.334 16.2494 12.5 16.2494C12.666 16.2494 12.8251 16.3153 12.9425 16.4326C13.0599 16.55 13.1258 16.7092 13.1258 16.8751C13.1258 17.0411 13.0599 17.2003 12.9425 17.3176L10.4425 19.8176C10.3844 19.8758 10.3155 19.922 10.2395 19.9535C10.1636 19.985 10.0822 20.0013 10 20.0013C9.91779 20.0013 9.83639 19.985 9.76046 19.9535C9.68453 19.922 9.61556 19.8758 9.5575 19.8176L7.0575 17.3176C6.99939 17.2595 6.95329 17.1905 6.92185 17.1146C6.8904 17.0387 6.87421 16.9573 6.87421 16.8751C6.87421 16.793 6.8904 16.7116 6.92185 16.6357C6.95329 16.5597 6.99939 16.4907 7.0575 16.4326C7.17486 16.3153 7.33403 16.2494 7.5 16.2494C7.58218 16.2494 7.66356 16.2655 7.73948 16.297C7.8154 16.3284 7.88439 16.3745 7.9425 16.4326L9.375 17.8664V13.1251C9.375 12.9594 9.44085 12.8004 9.55806 12.6832C9.67527 12.566 9.83424 12.5001 10 12.5001Z"
            fill="#1C4240"/>
        </g>
        <defs>
          <clipPath id="clip0">
            <rect width="20" height="20" fill="white"/>
          </clipPath>
        </defs>
      </svg>
    </div>
    <div class="lvd-toc-col lvd-toc-col--num">
      <span class="lvd-toc-group-num">{{ char.num }}</span>
      <span v-if="char.asterisk" class="lvd-toc-asterisk">(*)</span>
    </div>
    <div class="lvd-toc-col lvd-toc-col--english lvd-toc-type-method">
      {{ char.type }} &nbsp; {{ char.method }}
    </div>
    <div class="lvd-toc-col lvd-toc-col--examples"></div>
    <div class="lvd-toc-col lvd-toc-col--notes"></div>
    <div class="lvd-toc-col lvd-toc-col--delete">
      <button class="lvd-toc-delete-btn" @click="tocDeleteCharacteristic(char.id)" title="Delete">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M5 4V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V4M6 7v5M10 7v5M3 4l1 9.5A.5.5 0 0 0 4.5 14h7a.5.5 0 0 0 .5-.5L13 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Characteristic title row -->
  <div class="lvd-toc-group-title-row">
    <div class="lvd-toc-col lvd-toc-col--handle"></div>
    <div class="lvd-toc-col lvd-toc-col--num"></div>
    <div
      class="lvd-toc-col lvd-toc-col--english lvd-toc-char-title lvd-toc-char-title--clickable"
      @click="tocOpenEditModal(char)"
    >
      {{ char.title }}
    </div>
    <div class="lvd-toc-col lvd-toc-col--examples"></div>
    <div class="lvd-toc-col lvd-toc-col--notes"></div>
    <div class="lvd-toc-col lvd-toc-col--delete"></div>
  </div>

  <!-- Data rows -->
  <div v-for="(row, rIdx) in char.rows" :key="rIdx" class="lvd-toc-row">
    <div class="lvd-toc-col lvd-toc-col--handle"></div>
    <div class="lvd-toc-col lvd-toc-col--num"></div>
    <div class="lvd-toc-col lvd-toc-col--english">{{ row.english }}</div>
    <div class="lvd-toc-col lvd-toc-col--examples">{{ row.exampleVarieties }}</div>
    <div class="lvd-toc-col lvd-toc-col--notes">{{ row.notes }}</div>
    <div class="lvd-toc-col lvd-toc-col--delete"></div>
  </div>

        </div>
      </div>

      <!-- Load more -->
      <div v-if="tocDisplayedCount < tocCharacteristics.length" class="lvd-toc-load-more">
        <button class="lvd-toc-load-more-btn" @click="tocLoadMore">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M15 9A6 6 0 1 1 9 3c1.657 0 3.156.672 4.243 1.757L15 6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M15 3v3.5h-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Load more
        </button>
      </div>
    </template>
  </div>
</template>
        <!-- ── original section card for all other chapters ──────────────────── -->
        <template v-else>
          <div class="lvd-section-card">
            <div class="lvd-block">

              <h2 class="lvd-block-title">1.1 Standard items are configured by default</h2>

              <div class="lvd-section-links">
                <span class="lvd-links-label">Related links:</span>
                <div class="lvd-section-links-items">
                  <a v-for="(lnk, i) in sectionLinks" :key="i" :href="lnk.url || '#'" target="_blank" class="lvd-link">
                    {{ lnk.text }}
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.875 2.438H2.438A1.063 1.063 0 0 0 1.375 3.5v7.063A1.063 1.063 0 0 0 2.438 11.624H9.5a1.063 1.063 0 0 0 1.063-1.062V8.125M7.813 1.375H11.625M11.625 1.375V5.188M11.625 1.375L4.875 8.125" stroke="#1C4240" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </a>
                </div>
              </div>

              <div class="lvd-question">
                <h3 class="lvd-q-label">1.1.1 Title text</h3>
                <p class="lvd-q-text">
                  Should clarification be provided that any other species or hybrids not explicitly
                  covered by these Test Guidelines should be treated according to the provisions of
                  document TGP/12 "Guidance for New Types and Species"
                  <span class="lvd-required">*</span>
                </p>
                <div class="lvd-radio-group">
                  <label class="lvd-radio-opt" @click.prevent="setRadio('q1', 'yes')">
                    <span class="lvd-radio-circle" :class="{ 'lvd-radio-circle--on': radioAnswers.q1 === 'yes' }"></span>
                    <span class="lvd-radio-text">Yes</span>
                  </label>
                  <label class="lvd-radio-opt" @click.prevent="setRadio('q1', 'no')">
                    <span class="lvd-radio-circle lvd-radio-circle--green" :class="{ 'lvd-radio-circle--on': radioAnswers.q1 === 'no' }"></span>
                    <span class="lvd-radio-text">No</span>
                  </label>
                </div>
                <button class="lvd-add-para-btn">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="#1C4240" stroke-width="1.3"/><path d="M9 6v6M6 9h6" stroke="#1C4240" stroke-width="1.5" stroke-linecap="round"/></svg>
                  Add Paragraph
                </button>
              </div>

              <div class="lvd-question">
                <h3 class="lvd-q-label">1.1.2 Title text</h3>
                <p class="lvd-q-text">
                  Might it be necessary to add additional characteristics or additional states of
                  expressions for ornamental, fruit, industrial, vegetable, agricultural or other varieties?
                  <span class="lvd-required">*</span>
                </p>
                <div class="lvd-radio-group">
                  <label class="lvd-radio-opt" @click.prevent="setRadio('q2', 'yes')">
                    <span class="lvd-radio-circle" :class="{ 'lvd-radio-circle--on': radioAnswers.q2 === 'yes' }"></span>
                    <span class="lvd-radio-text">Yes</span>
                  </label>
                  <label class="lvd-radio-opt" @click.prevent="setRadio('q2', 'no')">
                    <span class="lvd-radio-circle lvd-radio-circle--green" :class="{ 'lvd-radio-circle--on': radioAnswers.q2 === 'no' }"></span>
                    <span class="lvd-radio-text">No</span>
                  </label>
                </div>
              </div>

              <div class="lvd-preview-box">
                <div class="lvd-preview-header">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M8.5 1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V5.5L8.5 1ZM8.5 1v4.5H13" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 9.5h5M5 11.5h3" stroke="#AD4E02" stroke-width="1.2" stroke-linecap="round"/></svg>
                  <span class="lvd-preview-label">PREVIEW</span>
                </div>
                <p class="lvd-preview-text">
                  1.1 These Test Guidelines apply to all varieties of Argania spinosa (L.) Skeels.
                  Continue Sentence
                </p>
              </div>

            </div>
          </div>
        </template>

      </main>
    </div>

    <footer class="lvd-footer">
      <button class="lvd-footer-btn" @click="emit('export')">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1.5 12.75V14.25C1.5 15.075 2.175 15.75 3 15.75H15C15.825 15.75 16.5 15.075 16.5 14.25V12.75M12.75 9L9 12.75M9 12.75L5.25 9M9 12.75V2.25" stroke="#1C4240" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="lvd-footer-btn-text">Export</span>
      </button>
      <div class="lvd-footer-nav">
        <button v-if="activeChapterIndex > 0" class="lvd-footer-btn" @click="goPrevious">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11.25 13.5L6.75 9L11.25 4.5" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="lvd-footer-btn-text">Previous chapter</span>
        </button>
        <button v-if="activeChapterIndex < chapters.length - 1" class="lvd-footer-btn" @click="goNext">
          <span class="lvd-footer-btn-text">Next chapter</span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6.75 13.5L11.25 9L6.75 4.5" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </footer>
 <!-- Characteristics modal -->
<CharacteristicsModal
  v-if="tocShowModal"
  :mode="tocModalMode"
  :initial-data="tocModalInitial"
  @exit="tocHandleExit"
  @save="tocHandleSave"
/>
  </div>
</template>

<style scoped>
.lvd-root *, .lvd-root *::before, .lvd-root *::after { box-sizing: border-box; }
.lvd-root h1, .lvd-root h2, .lvd-root h3, .lvd-root p, .lvd-root ul { margin: 0; padding: 0; }
.lvd-root ul     { list-style: none; }
.lvd-root a      { color: inherit; }
.lvd-root button { font-family: 'Figtree', 'Segoe UI', Arial, sans-serif; cursor: pointer; }

.lvd-root {
  font-family: 'Figtree',sans-serif;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: #303030;
}

.lvd-action-row { display: flex; align-items: center; justify-content: space-between; }
.lvd-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #1C4240;
  text-decoration: underline;
  text-decoration-color: #DADE14;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
  padding: 4px 0;
  transition: opacity 0.15s;
}
.lvd-back-btn:hover { opacity: 0.7; }

.lvd-header-card {
  width: 100%;
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.lvd-hc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  gap: 24px;
  border-bottom: 1px solid #E2E2E2;
}
.lvd-hc-meta { display: flex; align-items: flex-start; gap: 48px; flex: 1; flex-wrap: wrap; }
.lvd-hc-name-block, .lvd-hc-code-block { display: flex; flex-direction: column; gap: 4px; }
.lvd-meta-label { font-size: 14px; font-weight: 400; color: #727272; line-height: 18px; }
.lvd-meta-name  { font-size: 22px; font-weight: 700; color: #1C4240; line-height: 27px; }
.lvd-meta-code  { font-size: 16px; font-weight: 600; color: #1C4240; line-height: 20px; }

.lvd-submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 20px;
  background: #1C4240;
  color: #DADE14;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 100px;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s, transform 0.1s;
}
.lvd-submit-btn:hover  { opacity: 0.88; }
.lvd-submit-btn:active { transform: scale(0.97); }

.lvd-hc-details {
  padding: 16px 20px;
  border-bottom: 1px solid #E2E2E2;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.lvd-botanical-row  { display: flex; flex-direction: column; gap: 6px; }
.lvd-botanical-text { font-weight: 700; font-size: 15px; line-height: 20px; color: #1C4240; }
.lvd-links-row  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.lvd-links-label { font-size: 13px; font-weight: 400; color: #303030; white-space: nowrap; }
.lvd-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #1C4240;
  text-decoration: underline;
  text-decoration-color: #DADE14;
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.lvd-link:hover { opacity: 0.7; }

.lvd-docs-row { display: flex; flex-direction: column; gap: 6px; }
.lvd-rte      { display: flex; flex-direction: column; }

.lvd-rte-toolbar {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 8px;
  background: #FFFFFF;
  border: 1px solid #1C4240;
  border-radius: 4px 4px 0 0;
}
.lvd-rte-icons { display: flex; flex-direction: row; align-items: center; padding: 8px 16px; gap: 24px; width: 100%; }
.lvd-rte-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  transition: opacity 0.15s;
}
.lvd-rte-btn:hover { opacity: 0.7; }
.lvd-rte-group { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.lvd-rte-dropdown-caret { display: flex; align-items: center; width: 16px; height: 16px; cursor: pointer; }
.lvd-rte-dropdown-caret:hover { opacity: 0.7; }
.lvd-rte-field {
  position: relative;
  background: #FFFFFF;
  border: 1px solid #1C4240;
  border-top: none;
  border-radius: 0 0 4px 4px;
  padding: 16px 20px 16px 16px;
  min-height: 122px;
  resize: none;
}
.lvd-rte-textarea {
  flex: 1;
  width: 100%;
  min-height: 80px;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Figtree', 'Segoe UI', Arial, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 19px;
  color: #727272;
  background: transparent;
  display: block;
  overflow-y: auto;
}
.lvd-rte-textarea::placeholder { color: #727272; }
.lvd-rte-textarea::-webkit-scrollbar { width: 14px; }
.lvd-rte-textarea::-webkit-scrollbar-track { background: transparent; }
.lvd-rte-textarea::-webkit-scrollbar-thumb { background: rgba(28, 66, 64, 0.2); border-radius: 7px; }
.lvd-rte-textarea::-webkit-scrollbar-thumb:hover { background: rgba(28, 66, 64, 0.3); }
.lvd-rte-resize {
  position: absolute;
  right: 0px;
  bottom: 0px;
  width: 16px;
  height: 16px;
  opacity: 0.6;
  cursor: nwse-resize;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lvd-rte-resize:hover { opacity: 1; }

.lvd-hc-bottom { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; }
.lvd-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #1C4240;
  text-decoration: underline;
  text-decoration-color: #DADE14;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
  padding: 0;
  transition: opacity 0.15s;
}
.lvd-toggle-btn:hover { opacity: 0.7; }
.lvd-save-info { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.lvd-save-doc  { font-size: 13px; font-weight: 600; color: #727272; }
.lvd-save-date { font-size: 12px; font-weight: 400; color: #727272; }

.lvd-content-area { display: flex; align-items: flex-start; gap: 24px; }

.lvd-stepper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 160px;
  flex-shrink: 0;
  border-right: 1px solid #E2E2E2;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.lvd-stepper--collapsed { width: 52px; }
.lvd-stepper-heading {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #303030;
  padding: 0 8px 4px;
  white-space: nowrap;
  transition: opacity 0.15s ease;
}
.lvd-stepper--collapsed .lvd-stepper-heading { opacity: 0; }
.lvd-stepper-list { display: flex; flex-direction: column; }

.lvd-step {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 6px 8px;
  cursor: pointer;
  position: relative;
  transition: background 0.12s;
  border-radius: 4px 0 0 4px;
}
.lvd-step:hover { background: rgba(226, 238, 235, 0.6); }
.lvd-step--current { background: #E2EEEB; }
.lvd-step--current::after {
  content: '';
  position: absolute;
  right: 0;
  top: 5px;
  bottom: 5px;
  width: 2px;
  background: #009A6E;
  border-radius: 2px;
}
.lvd-step--current .lvd-step-title { color: #009A6E; font-weight: 700; }

.lvd-step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: #1C4240;
  background: #FFFFFF;
  border: 1.5px solid #939600;
}
.lvd-step-num--active { background: #009A6E; border-color: #009A6E; color: #FFFFFF; font-weight: 700; }
.lvd-step-title {
  font-size: 13px;
  font-weight: 500;
  color: #1C4240;
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
  word-break: break-word;
  flex: 1;
  min-width: 0;
  transition: opacity 0.15s ease;
}
.lvd-stepper--collapsed .lvd-step-title { opacity: 0; }

.lvd-collapse-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px; background: none; border: none; cursor: pointer; transition: opacity 0.15s; }
.lvd-collapse-btn:hover { opacity: 0.7; }
.lvd-collapse-label {
  font-size: 13px;
  font-weight: 600;
  color: #1C4240;
  text-decoration: underline;
  text-decoration-color: #DADE14;
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
  white-space: nowrap;
  transition: opacity 0.15s ease;
}
.lvd-stepper--collapsed .lvd-collapse-label { opacity: 0; }

.lvd-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 20px; }
.lvd-section-heading { font-size: 22px; font-weight: 700; color: #1C4240; line-height: 27px; }
.lvd-section-card {
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(70, 70, 70, 0.06);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.lvd-block { display: flex; flex-direction: column; gap: 12px; }
.lvd-block-title { font-size: 18px; font-weight: 700; color: #303030; line-height: 22px; }
.lvd-section-links { display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
.lvd-section-links-items { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.lvd-question { display: flex; flex-direction: column; gap: 10px; }
.lvd-q-label  { font-size: 16px; font-weight: 700; color: #303030; line-height: 20px; }
.lvd-q-text   { font-size: 14px; font-weight: 400; color: #303030; line-height: 20px; }
.lvd-required { color: #D32F2F; margin-left: 2px; }

.lvd-radio-group { display: flex; align-items: center; gap: 24px; }
.lvd-radio-opt { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
.lvd-radio-text { font-size: 14px; font-weight: 400; color: #000; }
.lvd-radio-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #1C4240;
  background: #FFFFFF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.15s;
}
.lvd-radio-circle::after {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
  transition: background 0.15s;
}
.lvd-radio-circle.lvd-radio-circle--on::after { background: #1C4240; }
.lvd-radio-circle.lvd-radio-circle--green { border-color: #009A6E; }
.lvd-radio-circle.lvd-radio-circle--green.lvd-radio-circle--on::after { background: #009A6E; }

.lvd-add-para-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 16px;
  background: #FFFFFF;
  border: 1px solid #939600;
  border-radius: 100px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #1C4240;
  align-self: flex-start;
  transition: background 0.15s;
}
.lvd-add-para-btn:hover { background: rgba(147, 150, 0, 0.06); }

.lvd-preview-box { background: rgba(184, 180, 164, 0.14); border-radius: 6px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.lvd-preview-header { display: flex; align-items: center; gap: 5px; }
.lvd-preview-label  { font-size: 12px; font-weight: 600; color: #AD4E02; letter-spacing: 0.5px; }
.lvd-preview-text   { font-size: 14px; font-weight: 400; color: #303030; line-height: 18px; }

.lvd-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 0 0; border-top: 1px solid #D0D0D0; margin-top: auto; }
.lvd-footer-nav { display: flex; align-items: center; gap: 16px; }
.lvd-footer-btn { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; background: transparent; border: none; border-radius: 100px; cursor: pointer; transition: background 0.15s; }
.lvd-footer-btn:hover { background: rgba(28, 66, 64, 0.06); }
.lvd-footer-btn-text {
  font-size: 14px;
  font-weight: 600;
  color: #1C4240;
  text-decoration: underline;
  text-decoration-color: #DADE14;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}

.lvd-slide-enter-active, .lvd-slide-leave-active { transition: max-height 0.3s ease, opacity 0.25s ease; overflow: hidden; max-height: 700px; }
.lvd-slide-enter-from, .lvd-slide-leave-to { max-height: 0; opacity: 0; }

/* ── Material accordion ─────────────────────────────────────────────────────── */
.lvd-mat-accordion { display: flex; flex-direction: column; gap: 12px; }
.lvd-mat-card { background: #FFFFFF; border-radius: 8px; box-shadow: 0px 2px 8px rgba(70, 70, 70, 0.04); overflow: hidden; }
.lvd-mat-header { width: 100%; display: flex; align-items: center; gap: 12px; padding: 16px; background: none; border: none; cursor: pointer; text-align: left; font-family: 'Figtree', sans-serif; transition: background 0.12s; }
.lvd-mat-header:hover { background: rgba(0, 0, 0, 0.02); }
.lvd-mat-chevron { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; flex-shrink: 0; }

.lvd-mat-title {
  font-family: 'Figtree', sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 22px;
  color: #303030;
  margin: 0;
}

.lvd-mat-body { padding: 0 16px 20px; }
.lvd-mat-body--seed { display: flex; flex-direction: column; gap: 16px; padding: 0 16px 20px; }
.lvd-mat-empty { font-size: 14px; color: #727272; }
.lvd-mat-instruction { font-size: 15px; font-weight: 400; color: #303030; line-height: 19px; }
.lvd-mat-radios { display: flex; flex-direction: column; gap: 12px; }
.lvd-mat-radio-row { display: flex; align-items: center; gap: 12px; cursor: pointer; user-select: none; }

.lvd-mat-radio-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #1C4240;
  background: #FFFFFF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.15s;
}
.lvd-mat-radio-circle::after {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
  transition: background 0.15s;
}
.lvd-mat-radio-circle.lvd-mat-radio-circle--on { border-color: #009A6E; }
.lvd-mat-radio-circle.lvd-mat-radio-circle--on::after { background: #009A6E; }
.lvd-mat-radio-text { font-size: 16px; font-weight: 400; color: #303030; line-height: 1; }

.lvd-mat-preview { background: rgba(184, 180, 164, 0.14); border-radius: 6px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.lvd-mat-preview-hd { display: flex; align-items: center; gap: 5px; }
.lvd-mat-preview-tag { font-size: 12px; font-weight: 600; color: #AD4E02; letter-spacing: 0.5px; }
.lvd-mat-info-row { display: flex; align-items: center; gap: 8px; }
.lvd-mat-info-text { font-size: 14px; font-weight: 400; color: #303030; line-height: 18px; }

.lvd-mat-body-enter-active, .lvd-mat-body-leave-active { transition: max-height 0.28s ease, opacity 0.2s ease; overflow: hidden; max-height: 500px; }
.lvd-mat-body-enter-from, .lvd-mat-body-leave-to { max-height: 0; opacity: 0; }

/* ── Examination accordion ──────────────────────────────────────────────────── */
.lvd-ex-body { display: flex; flex-direction: column; gap: 20px; padding: 0 16px 20px; }

.lvd-ex-radios { display: flex; flex-direction: column; gap: 12px; }

.lvd-ex-radio-row {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}
.lvd-ex-radio-row--indented { padding-left: 32px; }

.lvd-ex-radio-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #1C4240;
  background: #FFFFFF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.15s;
}
.lvd-ex-radio-circle::after {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: transparent;
  transition: background 0.15s;
}
.lvd-ex-radio-circle.lvd-ex-radio-circle--green { border-color: #009A6E; }
.lvd-ex-radio-circle.lvd-ex-radio-circle--on { border-color: #009A6E; }
.lvd-ex-radio-circle.lvd-ex-radio-circle--on::after { background: #009A6E; }

.lvd-ex-radio-text { font-size: 16px; font-weight: 400; color: #303030; line-height: 19px; }

.lvd-ex-radios--indented { padding-left: 16px; }

/* Inline input row inside PREVIEW — matches design system input-atom */
.lvd-ex-inline-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.lvd-ex-input-wrap { display: inline-flex; }
.lvd-ex-input-wrap--sm .lvd-ex-input { width: 48px; text-align: center; }

.lvd-ex-input {
  height: 36px;
  width: 220px;
  padding: 0 12px;
  border: 1px solid #1C4240;
  border-radius: 4px;
  background: #FFFFFF;
  font-family: 'Figtree', 'Segoe UI', Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #303030;
  outline: none;
  transition: border-color 0.15s, border-width 0.15s, padding 0.15s;
}
.lvd-ex-input:focus {
  border-width: 2px;
  border-color: #1C4240;
  padding: 0 11px;
}
.lvd-ex-input::placeholder { color: #727272; }
/* ════════════════════════════════════════════════════════════════════════════
   TABLE OF CHARACTERISTICS — Chapter 07
   ════════════════════════════════════════════════════════════════════════════ */

.lvd-toc-intro {
  font-size: 14px;
  font-weight: 400;
  color: #303030;
  line-height: 20px;
}

/* ── Search card ─────────────────────────────────────────────────────────── */
.lvd-toc-search-card {
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0px 2px 8px rgba(70, 70, 70, 0.04);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lvd-toc-search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.lvd-toc-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #1C4240;
  border-radius: 4px;
  background: #FFFFFF;
  flex: 1;
  min-width: 180px;
  max-width: 420px;
  transition: border-width 0.12s, padding 0.12s;
}
.lvd-toc-input-wrap:focus-within {
  border-width: 2px;
  padding: 0 11px;
}

.lvd-toc-input {
  flex: 1;
  border: none;
  outline: none;
  font-family: 'Figtree', sans-serif;
  font-size: 14px;
  color: #303030;
  background: transparent;
  min-width: 0;
}
.lvd-toc-input::placeholder { color: #727272; }

.lvd-toc-clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Figtree', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #1C4240;
  padding: 0;
  white-space: nowrap;
  text-decoration: underline;
  text-decoration-color: #DADE14;
  text-underline-offset: 2px;
  transition: opacity 0.15s;
}
.lvd-toc-clear-btn:hover { opacity: 0.7; }

.lvd-toc-search-btn {
  height: 40px;
  padding: 0 28px;
  background: #1C4240;
  color: #DADE14;
  font-family: 'Figtree', sans-serif;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 100px;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s, transform 0.1s;
}
.lvd-toc-search-btn:hover  { opacity: 0.88; }
.lvd-toc-search-btn:active { transform: scale(0.97); }

.lvd-toc-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 20px;
  background: #FFFFFF;
  color: #1C4240;
  font-family: 'Figtree', sans-serif;
  font-size: 14px;
  font-weight: 600;
  border: 1.5px solid #939600;
  border-radius: 100px;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: auto;
  transition: background 0.15s;
}
.lvd-toc-add-btn:hover { background: rgba(147, 150, 0, 0.06); }

/* ── Search results ──────────────────────────────────────────────────────── */
.lvd-toc-results-label {
  font-size: 18px;
  font-weight: 400;
  color: #1C4240;
  line-height: 22px;
}

.lvd-toc-results-list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid #B8B4A4;
}

.lvd-toc-result-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 24px;
  padding: 20px 0;
  border-bottom: 1px solid #B8B4A4;
}

.lvd-toc-result-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.lvd-toc-result-top {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.lvd-toc-result-name {
  font-size: 16px;
  font-weight: 700;
  color: #1C4240;
}

/* NEW: replaces lvd-toc-result-meta */
.lvd-toc-result-col {
  font-size: 14px;
  font-weight: 600;
  color: #303030;
}

.lvd-toc-result-tg {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #1C4240;
  text-decoration: underline;
  text-decoration-color: #DADE14;
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
  cursor: pointer;
}
.lvd-toc-result-tg:hover { opacity: 0.7; }

.lvd-toc-result-states {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}
.lvd-toc-result-states-label {
  font-size: 13px;
  font-weight: 400;
  color: #303030;
  white-space: nowrap;
}
.lvd-toc-result-states-val {
  font-size: 13px;
  font-weight: 700;
  color: #303030;
}

.lvd-toc-import-btn {
  height: 36px;
  padding: 0 24px;
  background: #FFFFFF;
  color: #1C4240;
  font-family: 'Figtree', sans-serif;
  font-size: 14px;
  font-weight: 600;
  border: 1.5px solid #939600;
  border-radius: 100px;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
  transition: background 0.15s;
}
.lvd-toc-import-btn:hover { background: rgba(147, 150, 0, 0.06); }

/* ── Preview section ─────────────────────────────────────────────────────── */
.lvd-toc-preview-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: rgba(184, 180, 164, 0.16);
  border-radius: 6px;
  padding: 16px;
}
.lvd-toc-preview-header-row { display: flex; align-items: center; gap: 5px; }
.lvd-toc-preview-tag { font-size: 12px; font-weight: 600; color: #AD4E02; letter-spacing: 0.5px; }
.lvd-toc-preview-title { font-size: 15px; font-weight: 700; color: #303030; line-height: 19px; }
.lvd-toc-empty { font-size: 14px; color: #303030; }

/* ── Table ───────────────────────────────────────────────────────────────── */
.lvd-toc-table-wrap { border-radius: 4px; overflow: hidden; }

.lvd-toc-table-header {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-bottom: 1.5px solid #B8B4A4;
  padding: 8px 0;
  font-size: 13px;
  font-weight: 700;
  color: #303030;
}

.lvd-toc-col           { padding: 4px 8px; min-width: 0; }
.lvd-toc-col--handle   { flex: 0 0 36px; display: flex; align-items: center; justify-content: center; cursor: grab; }
.lvd-toc-col--num      { flex: 0 0 58px; display: flex; align-items: center; gap: 3px; }
.lvd-toc-col--english  { flex: 3; min-width: 0; }
.lvd-toc-col--examples { flex: 3; min-width: 0; }
.lvd-toc-col--notes    { flex: 0 0 80px; text-align: center; }
.lvd-toc-col--delete   { flex: 0 0 70px; display: flex; align-items: center; justify-content: center; }

.lvd-toc-group { border-bottom: 1px solid #B8B4A4; }
.lvd-toc-group:last-child { border-bottom: none; }

.lvd-toc-group-header {
  display: flex;
  align-items: center;
  min-height: 36px;
  background: #F9F9F9;
  border-bottom: 1px solid #E2E2E2;
}
.lvd-toc-type-method {
  font-size: 14px;
  font-weight: 700;
  color: #303030;
}
.lvd-toc-group-num { font-size: 13px; font-weight: 700; color: #303030; }
.lvd-toc-asterisk  { font-size: 12px; font-weight: 500; color: #303030; }



.lvd-toc-delete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  color: #9E9E9E;
  transition: color 0.15s, background 0.12s;
}
.lvd-toc-delete-btn:hover { color: #C62828; background: rgba(198, 40, 40, 0.07); }

.lvd-toc-group-title-row {
  display: flex;
  align-items: center;
  min-height: 32px;
  background: #FFFFFF;
  border-bottom: 1px solid #F0EDE6;
}

.lvd-toc-char-title {
  font-size: 14px;
  font-weight: 700;
  color: #303030;

  text-decoration-line: underline;
  text-decoration-color: #DADE14;
  text-decoration-thickness: 2px;   
  text-decoration-skip-ink: auto;      
}
.lvd-toc-char-title--clickable {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.lvd-toc-char-title--clickable:hover { opacity: 0.8; }
.lvd-toc-edit-icon { opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
.lvd-toc-char-title--clickable:hover .lvd-toc-edit-icon { opacity: 1; }

.lvd-toc-row {
  display: flex;
  align-items: center;
  min-height: 28px;
  background: #FFFFFF;
  font-size: 13px;
  font-weight: 400;
  color: #303030;
  border-bottom: 1px solid #F5F3EE;
  transition: background 0.1s;
}
.lvd-toc-row:last-child { border-bottom: none; }
.lvd-toc-row:hover { background: #FAFAF8; }

/* ── Load more ───────────────────────────────────────────────────────────── */
.lvd-toc-load-more { display: flex; justify-content: center; padding: 16px 0 8px; }

.lvd-toc-load-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 28px;
  background: #FFFFFF;
  border: 1.5px solid #DADE14;
  border-radius: 100px;
  cursor: pointer;
  font-family: 'Figtree', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #303030;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
}
.lvd-toc-load-more-btn:hover  { background: #F5F3EE; border-color: #DADE14; }
.lvd-toc-load-more-btn:active { transform: scale(0.97); }
/* Edit trigger on char title */
.lvd-toc-char-title--clickable {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.lvd-toc-char-title--clickable:hover { text-decoration: underline; text-decoration-color: #DADE14; }
.lvd-toc-edit-icon { opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
.lvd-toc-char-title--clickable:hover .lvd-toc-edit-icon { opacity: 1; }
.lvd-toc-group { border-bottom: 1px solid #B8B4A4; transition: opacity 0.15s; }
.lvd-toc-group--dragging { opacity: 0.4; }
</style>