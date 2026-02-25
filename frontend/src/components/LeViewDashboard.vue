<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ─── Route / Router ───────────────────────────────────────────────────────────
const route  = useRoute();
const router = useRouter();
const tgId   = route.params.id;
console.log('TG ID:', tgId);

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChapterItem {
  number: string;
  title: string;
  subtitle?: string;
  status: 'current' | 'pending' | 'completed' | 'saved' | 'disabled';
}

interface RelatedLink {
  text: string;
  url?: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────
// No `const props =` — Vue <script setup> exposes props directly in template
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

// ─── Emits ────────────────────────────────────────────────────────────────────
const emit = defineEmits<{
  submit: [];
  export: [];
  previousChapter: [];
  nextChapter: [];
  itemClick: [item: ChapterItem];
}>();

// ─── State ────────────────────────────────────────────────────────────────────
const showDetails          = ref(true);
const textareaValue        = ref('');
const chapterNavCollapsed  = ref(false);
const activeChapterIndex   = ref(0);
const radioAnswers         = ref<Record<string, 'yes' | 'no' | null>>({
  q1: 'no',
  q2: 'no',
});

// ─── Data ─────────────────────────────────────────────────────────────────────
const chapters: ChapterItem[] = [
  { number: '01', title: 'Title',                    status: 'current' },
  { number: '02', title: 'Material',                 status: 'pending' },
  { number: '03', title: 'Examination',              status: 'pending' },
  { number: '04', title: 'Assessment',               status: 'pending' },
  { number: '05', title: 'Grouping',                 status: 'pending' },
  { number: '06', title: 'Characteristics',          status: 'pending' },
  { number: '07', title: 'Table of characteristics', status: 'pending' },
  { number: '08', title: 'Explanations',             status: 'pending' },
  { number: '09', title: 'Literature',               status: 'pending' },
  { number: '10', title: 'Technical questionnaire',  status: 'pending' },
  { number: '11', title: 'Annex',                    status: 'pending' },
];

const sectionLinks: RelatedLink[] = [
  { text: 'More than one species (GN3)',                               url: '#' },
  { text: 'Different types or groups within a species or genus (GN4)', url: '#' },
  { text: 'Family name (GN5)',                                         url: '#' },
  { text: 'Guidance for New Types and Species (GN6)',                  url: '#' },
];

// ─── Computed ─────────────────────────────────────────────────────────────────
// Powers the dynamic section heading
const activeChapter = computed(() => chapters[activeChapterIndex.value]);

// ─── Methods ──────────────────────────────────────────────────────────────────
function toggleDetails()    { showDetails.value = !showDetails.value; }
function toggleChapterNav() { chapterNavCollapsed.value = !chapterNavCollapsed.value; }

function setActiveChapter(index: number) {
  activeChapterIndex.value = index;
  emit('itemClick', chapters[index]);
}

function setRadio(key: string, value: 'yes' | 'no') {
  radioAnswers.value[key] = value;
}

// Navigate chapters — no props needed, driven by internal index
function goNext() {
  if (activeChapterIndex.value < chapters.length - 1) {
    activeChapterIndex.value++;
    emit('nextChapter');
  }
}
function goPrevious() {
  if (activeChapterIndex.value > 0) {
    activeChapterIndex.value--;
    emit('previousChapter');
  }
}

// Back to Dashboard — uses vue-router, matches route name in router/index.ts
function backToDashboard() {
  router.push({ name: 'dashboard' });
}
</script>

<template>
  <!--
    NOTE: This component is rendered INSIDE App.vue which already provides
    AppHeader (top nav) and AppSidebar. Do NOT add another top nav or breadcrumb
    here — that caused the double-header gap seen in the screenshot.
  -->
  <div class="lvd-root">

    <!-- ── Action Row: Back + Logout ───────────────────────────────────────── -->
    <div class="lvd-action-row">
      <button class="lvd-back-btn" @click="backToDashboard">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11.25 13.5L6.75 9L11.25 4.5" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back to TG Dashboard
      </button>
      <button class="lvd-logout-btn">
        Logout
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M6.75 12.75L3 9M3 9L6.75 5.25M3 9H12M9 3.75H13.5C14.328 3.75 15 4.422 15 5.25V12.75C15 13.578 14.328 14.25 13.5 14.25H9" stroke="#1C4240" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- ── Header Card ──────────────────────────────────────────────────────── -->
    <div class="lvd-header-card">

      <!-- Top: name + codes + submit -->
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

      <!-- Collapsible details -->
      <Transition name="lvd-slide">
        <div v-if="showDetails" class="lvd-hc-details">

          <!-- Botanical name + related links -->
          <div class="lvd-botanical-row">
            <span class="lvd-meta-label">Botanical Name(s):</span>
            <p class="lvd-botanical-text">{{ botanicalName }}</p>
            <div class="lvd-links-row">
              <span class="lvd-links-label">Related links:</span>
              <a
                v-for="(link, i) in relatedLinks"
                :key="i"
                :href="link.url || '#'"
                target="_blank"
                class="lvd-link"
              >
                {{ link.text }}
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.875 2.438H2.438A1.063 1.063 0 0 0 1.375 3.5v7.063A1.063 1.063 0 0 0 2.438 11.624H9.5a1.063 1.063 0 0 0 1.063-1.062V8.125M7.813 1.375H11.625M11.625 1.375V5.188M11.625 1.375L4.875 8.125" stroke="#1C4240" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </a>
            </div>
          </div>

          <!-- UPOV documents RTE -->
          <div class="lvd-docs-row">
            <span class="lvd-meta-label">Please indicate other associated UPOV documents:</span>
            <div class="lvd-rte">
              <!-- Toolbar -->
              <div class="lvd-rte-toolbar">
                <div class="lvd-rte-icons">
                  <button class="lvd-rte-btn" title="Help">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8.25" stroke="#1C4240" stroke-width="1.25"/><path d="M7.75 7.75a2.25 2.25 0 0 1 4.5 0c0 1.5-2.25 1.875-2.25 3M10 14v.25" stroke="#1C4240" stroke-width="1.25" stroke-linecap="round"/></svg>
                  </button>
                  <button class="lvd-rte-btn lvd-rte-btn--dropdown" title="Text">
                    <svg width="22" height="18" viewBox="0 0 22 18" fill="none"><text x="1" y="14" font-family="Figtree,sans-serif" font-size="13" font-weight="600" fill="#1C4240">Aa</text></svg>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#727272" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <button class="lvd-rte-btn" title="List">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3.5 5h.5M3.5 10h.5M3.5 15h.5M7 5h10M7 10h10M7 15h10" stroke="#1C4240" stroke-width="1.4" stroke-linecap="round"/></svg>
                  </button>
                  <button class="lvd-rte-btn" title="Code">
                    <svg width="20" height="14" viewBox="0 0 20 14" fill="none"><path d="M5.5 1.5L1 7l4.5 5.5M14.5 1.5L19 7l-4.5 5.5" stroke="#1C4240" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <button class="lvd-rte-btn lvd-rte-btn--dropdown" title="Export">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3.5 12.5v2a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-2M10 3.5v9M7.5 9.5l2.5 3 2.5-3" stroke="#1C4240" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#727272" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <button class="lvd-rte-btn" title="Paint">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 13a2 2 0 1 0 4 0c0-1.5-2-4-2-4s-2 2.5-2 4ZM6.5 9.5l7-7a1.5 1.5 0 0 1 2.12 2.12l-7 7" stroke="#1C4240" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <button class="lvd-rte-btn" title="Link">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M8.5 11.5a4 4 0 0 0 5.66 0l2-2a4 4 0 0 0-5.66-5.66l-1 1M11.5 8.5a4 4 0 0 0-5.66 0l-2 2a4 4 0 0 0 5.66 5.66l1-1" stroke="#1C4240" stroke-width="1.3" stroke-linecap="round"/></svg>
                  </button>
                  <button class="lvd-rte-btn" title="Highlight">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 3l4.5 4.5-8 8H5v-4.5l7.5-8Z" stroke="#1C4240" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <button class="lvd-rte-btn lvd-rte-btn--dropdown" title="Table">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="2.5" width="15" height="15" rx="1" stroke="#1C4240" stroke-width="1.3"/><path d="M2.5 7.5h15M2.5 12.5h15M7.5 2.5v15M12.5 2.5v15" stroke="#1C4240" stroke-width="1.3"/></svg>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#727272" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <button class="lvd-rte-btn" title="Image">
                    <svg width="20" height="18" viewBox="0 0 20 18" fill="none"><rect x="1.5" y="1.5" width="17" height="15" rx="1.5" stroke="#1C4240" stroke-width="1.3"/><circle cx="6.5" cy="6.5" r="1.75" stroke="#1C4240" stroke-width="1.2"/><path d="M1.5 12.5l4.5-4.5 3 3 2.5-2.5 5 5" stroke="#1C4240" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                </div>
              </div>
              <!-- Textarea -->
              <div class="lvd-rte-field">
                <textarea v-model="textareaValue" class="lvd-rte-textarea" placeholder="Add explanation here"></textarea>
                <span class="lvd-rte-resize">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M11 11L5 11M11 11L11 5M11 11L7 7" stroke="#1C4240" stroke-width="1.2" stroke-linecap="round"/></svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Bottom: toggle + save info -->
      <div class="lvd-hc-bottom">
        <button class="lvd-toggle-btn" @click="toggleDetails">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              v-if="showDetails"
              d="M4.5 11.25L9 6.75L13.5 11.25"
              stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            />
            <path
              v-else
              d="M4.5 6.75L9 11.25L13.5 6.75"
              stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            />
          </svg>
          {{ showDetails ? 'Less details' : 'More details' }}
        </button>
        <div class="lvd-save-info">
          <span class="lvd-save-doc">{{ documentName }}</span>
          <span class="lvd-save-date">{{ savedDate }}</span>
        </div>
      </div>
    </div>

    <!-- ── Content Area ─────────────────────────────────────────────────────── -->
    <div class="lvd-content-area">

      <!-- Left: Chapter Stepper -->
      <aside class="lvd-stepper" :class="{ 'lvd-stepper--collapsed': chapterNavCollapsed }">
        <span v-if="!chapterNavCollapsed" class="lvd-stepper-heading">Chapters</span>
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
            <span v-if="!chapterNavCollapsed" class="lvd-step-title">{{ ch.title }}</span>
          </li>
        </ul>
        <button class="lvd-collapse-btn" @click="toggleChapterNav">
          <svg v-if="chapterNavCollapsed" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.47 16.28a.75.75 0 0 1 0-1.06L11.69 9 5.47 2.78a.75.75 0 1 1 1.06-1.06l6.75 6.75a.75.75 0 0 1 0 1.06l-6.75 6.75a.75.75 0 0 1-1.06 0Z" fill="#1C4240"/>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12.53 1.72a.75.75 0 0 1 0 1.06L6.31 9l6.22 6.22a.75.75 0 1 1-1.06 1.06l-6.75-6.75a.75.75 0 0 1 0-1.06l6.75-6.75a.75.75 0 0 1 1.06 0Z" fill="#1C4240"/>
          </svg>
          <span v-if="!chapterNavCollapsed" class="lvd-collapse-label">Collapse</span>
        </button>
      </aside>

      <!-- Right: Main content -->
      <main class="lvd-main">
        <!-- Dynamic heading from activeChapter computed -->
        <h1 class="lvd-section-heading">
          {{ activeChapter.number }}. {{ activeChapter.title }}
        </h1>

        <div class="lvd-section-card">
          <div class="lvd-block">

            <h2 class="lvd-block-title">1.1 Standard items are configured by default</h2>

            <!-- Section related links -->
            <div class="lvd-section-links">
              <span class="lvd-links-label">Related links:</span>
              <div class="lvd-section-links-items">
                <a
                  v-for="(lnk, i) in sectionLinks"
                  :key="i"
                  :href="lnk.url || '#'"
                  target="_blank"
                  class="lvd-link"
                >
                  {{ lnk.text }}
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.875 2.438H2.438A1.063 1.063 0 0 0 1.375 3.5v7.063A1.063 1.063 0 0 0 2.438 11.624H9.5a1.063 1.063 0 0 0 1.063-1.062V8.125M7.813 1.375H11.625M11.625 1.375V5.188M11.625 1.375L4.875 8.125" stroke="#1C4240" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </a>
              </div>
            </div>

            <!-- Q 1.1.1 -->
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

            <!-- Q 1.1.2 -->
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

            <!-- Preview callout -->
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
      </main>
    </div>

    <!-- ── Footer ───────────────────────────────────────────────────────────── -->
    <footer class="lvd-footer">
      <button class="lvd-footer-btn" @click="emit('export')">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1.5 12.75V14.25C1.5 15.075 2.175 15.75 3 15.75H15C15.825 15.75 16.5 15.075 16.5 14.25V12.75M12.75 9L9 12.75M9 12.75L5.25 9M9 12.75V2.25" stroke="#1C4240" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="lvd-footer-btn-text">Export</span>
      </button>

      <div class="lvd-footer-nav">
        <!-- Previous: hidden on first chapter -->
        <button
          v-if="activeChapterIndex > 0"
          class="lvd-footer-btn"
          @click="goPrevious"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11.25 13.5L6.75 9L11.25 4.5" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="lvd-footer-btn-text">Previous chapter</span>
        </button>

        <!-- Next: hidden on last chapter -->
        <button
          v-if="activeChapterIndex < chapters.length - 1"
          class="lvd-footer-btn"
          @click="goNext"
        >
          <span class="lvd-footer-btn-text">Next chapter</span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6.75 13.5L11.25 9L6.75 4.5" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </footer>

  </div>
</template>

<style scoped>
/*
  SCOPED RESET
  Resets only inside this component so it's immune to global CSS conflicts.
*/
.lvd-root *, .lvd-root *::before, .lvd-root *::after { box-sizing: border-box; }
.lvd-root h1, .lvd-root h2, .lvd-root h3, .lvd-root p, .lvd-root ul { margin: 0; padding: 0; }
.lvd-root ul     { list-style: none; }
.lvd-root a      { text-decoration: none; color: inherit; }
.lvd-root button { font-family: 'Figtree', 'Segoe UI', Arial, sans-serif; cursor: pointer; }

/* ────────────────────────────────────────────────────────────
   ROOT WRAPPER
   No top nav / breadcrumb — those live in App.vue shell.
   Just a flex column that fills the content area.
──────────────────────────────────────────────────────────── */
.lvd-root {
  font-family: 'Figtree', 'Segoe UI', Arial, sans-serif;
  background: #F5F5F0;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  color: #303030;
}

/* ────────────────────────────────────────────────────────────
   ACTION ROW  (Back + Logout)
──────────────────────────────────────────────────────────── */
.lvd-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.lvd-back-btn,
.lvd-logout-btn {
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
.lvd-back-btn:hover,
.lvd-logout-btn:hover { opacity: 0.7; }

/* ────────────────────────────────────────────────────────────
   HEADER CARD
──────────────────────────────────────────────────────────── */
.lvd-header-card {
  width: 100%;
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* Top row */
.lvd-hc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  gap: 24px;
  border-bottom: 1px solid #E2E2E2;
}
.lvd-hc-meta {
  display: flex;
  align-items: flex-start;
  gap: 48px;
  flex: 1;
  flex-wrap: wrap;
}
.lvd-hc-name-block,
.lvd-hc-code-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.lvd-meta-label {
  font-size: 14px;
  font-weight: 400;
  color: #727272;
  line-height: 18px;
}
.lvd-meta-name {
  font-size: 22px;
  font-weight: 700;
  color: #1C4240;
  line-height: 27px;
}
.lvd-meta-code {
  font-size: 16px;
  font-weight: 600;
  color: #1C4240;
  line-height: 20px;
}

/* Submit button */
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

/* Collapsible details */
.lvd-hc-details {
  padding: 16px 20px;
  border-bottom: 1px solid #E2E2E2;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.lvd-botanical-row { display: flex; flex-direction: column; gap: 6px; }
.lvd-botanical-text {
  font-style: italic;
  font-weight: 700;
  font-size: 15px;
  line-height: 20px;
  color: #1C4240;
}
.lvd-links-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.lvd-links-label {
  font-size: 13px;
  font-weight: 400;
  color: #303030;
  white-space: nowrap;
}
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

/* RTE */
.lvd-docs-row { display: flex; flex-direction: column; gap: 6px; }
.lvd-rte      { display: flex; flex-direction: column; }
.lvd-rte-toolbar {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 8px;
  background: #FFFFFF;
  border: 1px solid #1C4240;
  border-radius: 4px 4px 0 0;
}
.lvd-rte-icons {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 8px;
}
.lvd-rte-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 3px;
  border-radius: 3px;
  flex-shrink: 0;
  transition: background 0.12s;
}
.lvd-rte-btn:hover { background: rgba(28, 66, 64, 0.08); }
.lvd-rte-field {
  position: relative;
  background: #FFFFFF;
  border: 1px solid #1C4240;
  border-top: none;
  border-radius: 0 0 4px 4px;
  padding: 12px 16px;
  min-height: 110px;
}
.lvd-rte-textarea {
  width: 100%;
  min-height: 80px;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Figtree', 'Segoe UI', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #727272;
  background: transparent;
  display: block;
}
.lvd-rte-textarea::placeholder { color: #A0A0A0; }
.lvd-rte-resize {
  position: absolute;
  right: 4px;
  bottom: 4px;
  opacity: 0.35;
  cursor: nwse-resize;
}

/* Bottom bar */
.lvd-hc-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
}
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

/* ────────────────────────────────────────────────────────────
   CONTENT AREA  (stepper + main)
──────────────────────────────────────────────────────────── */
.lvd-content-area {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

/* ────────────────────────────────────────────────────────────
   CHAPTER STEPPER
──────────────────────────────────────────────────────────── */
.lvd-stepper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 160px;
  flex-shrink: 0;
  border-right: 1px solid #E2E2E2;
  transition: width 0.2s ease;
}
.lvd-stepper--collapsed { width: 52px; }

.lvd-stepper-heading {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #303030;
  padding: 0 8px 4px;
}
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
.lvd-step-num--active {
  background: #009A6E;
  border-color: #009A6E;
  color: #FFFFFF;
  font-weight: 700;
}
.lvd-step-title {
  font-size: 13px;
  font-weight: 500;
  color: #1C4240;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.lvd-collapse-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: none;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
}
.lvd-collapse-btn:hover { opacity: 0.7; }
.lvd-collapse-label {
  font-size: 13px;
  font-weight: 600;
  color: #1C4240;
  text-decoration: underline;
  text-decoration-color: #DADE14;
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
}

/* ────────────────────────────────────────────────────────────
   MAIN CONTENT
──────────────────────────────────────────────────────────── */
.lvd-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.lvd-section-heading {
  font-size: 22px;
  font-weight: 700;
  color: #1C4240;
  line-height: 27px;
}
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
.lvd-block-title {
  font-size: 18px;
  font-weight: 700;
  color: #303030;
  line-height: 22px;
}
.lvd-section-links {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}
.lvd-section-links-items {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Question */
.lvd-question { display: flex; flex-direction: column; gap: 10px; }
.lvd-q-label  { font-size: 16px; font-weight: 700; color: #303030; line-height: 20px; }
.lvd-q-text   { font-size: 14px; font-weight: 400; color: #303030; line-height: 20px; }
.lvd-required { color: #D32F2F; margin-left: 2px; }

/* Radio */
.lvd-radio-group { display: flex; align-items: center; gap: 24px; }
.lvd-radio-opt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
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

/* Add paragraph */
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

/* Preview */
.lvd-preview-box {
  background: rgba(184, 180, 164, 0.14);
  border-radius: 6px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.lvd-preview-header { display: flex; align-items: center; gap: 5px; }
.lvd-preview-label  { font-size: 12px; font-weight: 600; color: #AD4E02; letter-spacing: 0.5px; }
.lvd-preview-text   { font-size: 14px; font-weight: 400; color: #303030; line-height: 18px; }

/* ────────────────────────────────────────────────────────────
   FOOTER
──────────────────────────────────────────────────────────── */
.lvd-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0 0;
  border-top: 1px solid #D0D0D0;
  margin-top: auto;
}
.lvd-footer-nav { display: flex; align-items: center; gap: 16px; }
.lvd-footer-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  background: transparent;
  border: none;
  border-radius: 100px;
  cursor: pointer;
  transition: background 0.15s;
}
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

/* ────────────────────────────────────────────────────────────
   SLIDE TRANSITION
──────────────────────────────────────────────────────────── */
.lvd-slide-enter-active,
.lvd-slide-leave-active {
  transition: max-height 0.3s ease, opacity 0.25s ease;
  overflow: hidden;
  max-height: 700px;
}
.lvd-slide-enter-from,
.lvd-slide-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>