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
const showDetails          = ref(false);
const textareaValue        = ref('');
const chapterNavCollapsed  = ref(false);
const activeChapterIndex   = ref(0);
const radioAnswers         = ref<Record<string, 'yes' | 'no' | null>>({
  q1: 'no',
  q2: 'no',
});
const navigationLocked     = false;

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
const activeChapter = computed(() => chapters[activeChapterIndex.value]);

// ─── Methods ──────────────────────────────────────────────────────────────────
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

          <!-- UPOV documents RTE — icons ported from Angular component -->
          <div class="lvd-docs-row">
            <span class="lvd-meta-label">Please indicate other associated UPOV documents:</span>
            <div class="lvd-rte">

              <!-- Toolbar -->
              <div class="lvd-rte-toolbar">
                <div class="lvd-rte-icons">

                  <!-- Help -->
                  <button class="lvd-rte-btn" title="Help">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clip-path="url(#rte-clip-help)">
                        <path d="M12 22.5C6.20101 22.5 1.5 17.799 1.5 12C1.5 6.20101 6.20101 1.5 12 1.5C17.799 1.5 22.5 6.20101 22.5 12C22.5 17.799 17.799 22.5 12 22.5ZM12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#1C4240"/>
                        <path d="M7.88267 8.67922C7.87128 8.88355 8.03986 9.04907 8.2445 9.04907H9.48123C9.68834 9.04907 9.85302 8.88019 9.88084 8.67496C10.0143 7.69077 10.6898 6.97339 11.8938 6.97339C12.9221 6.97339 13.8648 7.48755 13.8648 8.72534C13.8648 9.67749 13.303 10.1155 12.4175 10.782C11.4082 11.5151 10.6084 12.3721 10.6656 13.7622L10.67 14.0874C10.6728 14.2925 10.8399 14.4573 11.045 14.4573H12.2615C12.4686 14.4573 12.6365 14.2894 12.6365 14.0823V13.9241C12.6365 12.8481 13.0459 12.5339 14.1504 11.696C15.0645 11.001 16.0166 10.2297 16.0166 8.61108C16.0166 6.34497 14.1028 5.25 12.0081 5.25C10.1075 5.25 8.02446 6.13592 7.88267 8.67922ZM10.218 17.3232C10.218 18.123 10.856 18.7134 11.732 18.7134C12.646 18.7134 13.2744 18.123 13.2744 17.3232C13.2744 16.4949 12.646 15.9141 11.732 15.9141C10.856 15.9141 10.218 16.4949 10.218 17.3232Z" fill="#1C4240"/>
                      </g>
                      <defs><clipPath id="rte-clip-help"><rect width="24" height="24" fill="white"/></clipPath></defs>
                    </svg>
                  </button>

                  <!-- Person -->
                  <button class="lvd-rte-btn" title="Person">
                    <svg width="21" height="24" viewBox="0 0 21 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.75 2.25C12.75 3.49264 11.7426 4.5 10.5 4.5C9.25736 4.5 8.25 3.49264 8.25 2.25C8.25 1.00736 9.25736 0 10.5 0C11.7426 0 12.75 1.00736 12.75 2.25Z" fill="#1C4240"/>
                      <path d="M7.5 8.25L0.697875 7.58723C0.299187 7.5374 0 7.19848 0 6.79669C0 6.35669 0.356692 6 0.796693 6H20.2033C20.6433 6 21 6.35669 21 6.79669C21 7.19848 20.7008 7.5374 20.3021 7.58723L13.5 8.25V13.5L14.1775 23.1301C14.2165 23.5984 13.847 24 13.3771 24C13.0086 24 12.6873 23.7492 12.5979 23.3916L10.8638 14.9552C10.7691 14.5765 10.2309 14.5765 10.1362 14.9552L8.40209 23.3916C8.31271 23.7492 7.99145 24 7.6229 24C7.153 24 6.78347 23.5984 6.82249 23.1301L7.5 13.5V8.25Z" fill="#1C4240"/>
                    </svg>
                  </button>

                  <!-- Text Format with dropdown -->
                  <div class="lvd-rte-group">
                    <button class="lvd-rte-btn" title="Text format">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.36621 19.6216L4.78125 15.4175H9.99023L11.4053 19.6216H13.292L8.30859 5.625H6.4834L1.5 19.6216H3.36621ZM7.4165 7.7373L9.5083 13.9717H5.26318L7.36523 7.7373H7.4165Z" fill="#1C4240"/>
                        <path d="M21.1362 18.2783H21.1875V19.6216H22.8794V12.1875C22.8794 9.92139 21.208 8.67041 18.9111 8.67041C16.3066 8.67041 15.0249 10.0444 14.9121 11.9312H16.5732C16.6758 10.8545 17.4653 10.147 18.8496 10.147C20.3057 10.147 21.126 10.9263 21.126 12.3413V13.4385H18.2856C15.8145 13.4487 14.502 14.6382 14.502 16.5249C14.502 18.5039 15.9375 19.7959 18.019 19.7959C19.6084 19.7959 20.5928 19.1499 21.1362 18.2783ZM18.4907 18.3296C17.3628 18.3296 16.3066 17.7349 16.3066 16.4634C16.3066 15.4893 16.9424 14.792 18.4189 14.792H21.126V16.043C21.126 17.3862 19.998 18.3296 18.4907 18.3296Z" fill="#1C4240"/>
                      </svg>
                    </button>
                    <span class="lvd-rte-dropdown-caret">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.64645 4.64645C1.84171 4.45118 2.15829 4.45118 2.35355 4.64645L8 10.2929L13.6464 4.64645C13.8417 4.45118 14.1583 4.45118 14.3536 4.64645C14.5488 4.84171 14.5488 5.15829 14.3536 5.35355L8.35355 11.3536C8.15829 11.5488 7.84171 11.5488 7.64645 11.3536L1.64645 5.35355C1.45118 5.15829 1.45118 4.84171 1.64645 4.64645Z" fill="#727272"/></svg>
                    </span>
                  </div>

                  <!-- List -->
                  <button class="lvd-rte-btn" title="List">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 17.25C7.5 16.8358 7.83579 16.5 8.25 16.5H21.75C22.1642 16.5 22.5 16.8358 22.5 17.25C22.5 17.6642 22.1642 18 21.75 18H8.25C7.83579 18 7.5 17.6642 7.5 17.25Z" fill="#1C4240"/>
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 11.25C7.5 10.8358 7.83579 10.5 8.25 10.5H21.75C22.1642 10.5 22.5 10.8358 22.5 11.25C22.5 11.6642 22.1642 12 21.75 12H8.25C7.83579 12 7.5 11.6642 7.5 11.25Z" fill="#1C4240"/>
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 5.25C7.5 4.83579 7.83579 4.5 8.25 4.5H21.75C22.1642 4.5 22.5 4.83579 22.5 5.25C22.5 5.66421 22.1642 6 21.75 6H8.25C7.83579 6 7.5 5.66421 7.5 5.25Z" fill="#1C4240"/>
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M5.78033 3.21967C6.07322 3.51256 6.07322 3.98744 5.78033 4.28033L3.53033 6.53033C3.23744 6.82322 2.76256 6.82322 2.46967 6.53033L1.71967 5.78033C1.42678 5.48744 1.42678 5.01256 1.71967 4.71967C2.01256 4.42678 2.48744 4.42678 2.78033 4.71967L3 4.93934L4.71967 3.21967C5.01256 2.92678 5.48744 2.92678 5.78033 3.21967Z" fill="#1C4240"/>
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M5.78033 9.21967C6.07322 9.51256 6.07322 9.98744 5.78033 10.2803L3.53033 12.5303C3.23744 12.8232 2.76256 12.8232 2.46967 12.5303L1.71967 11.7803C1.42678 11.4874 1.42678 11.0126 1.71967 10.7197C2.01256 10.4268 2.48744 10.4268 2.78033 10.7197L3 10.9393L4.71967 9.21967C5.01256 8.92678 5.48744 8.92678 5.78033 9.21967Z" fill="#1C4240"/>
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M5.78033 15.2197C6.07322 15.5126 6.07322 15.9874 5.78033 16.2803L3.53033 18.5303C3.23744 18.8232 2.76256 18.8232 2.46967 18.5303L1.71967 17.7803C1.42678 17.4874 1.42678 17.0126 1.71967 16.7197C2.01256 16.4268 2.48744 16.4268 2.78033 16.7197L3 16.9393L4.71967 15.2197C5.01256 14.9268 5.48744 14.9268 5.78033 15.2197Z" fill="#1C4240"/>
                    </svg>
                  </button>

                  <!-- Code -->
                  <button class="lvd-rte-btn" title="Code">
                    <svg width="20" height="12" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.53033 1.28033C6.82322 0.987437 6.82322 0.512563 6.53033 0.21967C6.23744 -0.0732233 5.76256 -0.0732233 5.46967 0.21967L0.21967 5.46967C-0.0732233 5.76256 -0.0732233 6.23744 0.21967 6.53033L5.46967 11.7803C5.76256 12.0732 6.23744 12.0732 6.53033 11.7803C6.82322 11.4874 6.82322 11.0126 6.53033 10.7197L1.81066 6L6.53033 1.28033Z" fill="#1C4240"/>
                      <path d="M12.9697 1.28033C12.6768 0.987437 12.6768 0.512563 12.9697 0.21967C13.2626 -0.0732233 13.7374 -0.0732233 14.0303 0.21967L19.2803 5.46967C19.5732 5.76256 19.5732 6.23744 19.2803 6.53033L14.0303 11.7803C13.7374 12.0732 13.2626 12.0732 12.9697 11.7803C12.6768 11.4874 12.6768 11.0126 12.9697 10.7197L17.6893 6L12.9697 1.28033Z" fill="#1C4240"/>
                    </svg>
                  </button>

                  <!-- Export with dropdown -->
                  <div class="lvd-rte-group">
                    <button class="lvd-rte-btn" title="Export">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 3V7C13 7.13132 13.0259 7.26136 13.0761 7.38268C13.1264 7.50401 13.2 7.61425 13.2929 7.70711C13.3858 7.79997 13.496 7.87362 13.6173 7.92388C13.7386 7.97413 13.8687 8 14 8H18" stroke="#1C4240" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10.5002 21H6.00024C5.46981 21 4.9611 20.7893 4.58603 20.4142C4.21096 20.0391 4.00024 19.5304 4.00024 19V5C4.00024 4.46957 4.21096 3.96086 4.58603 3.58579C4.9611 3.21071 5.46981 3 6.00024 3H13.0002L18.0002 8V13M13.0002 19H20.0002M20.0002 19L17.0002 16M20.0002 19L17.0002 22" stroke="#1C4240" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <span class="lvd-rte-dropdown-caret">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.64645 4.64645C1.84171 4.45118 2.15829 4.45118 2.35355 4.64645L8 10.2929L13.6464 4.64645C13.8417 4.45118 14.1583 4.45118 14.3536 4.64645C14.5488 4.84171 14.5488 5.15829 14.3536 5.35355L8.35355 11.3536C8.15829 11.5488 7.84171 11.5488 7.64645 11.3536L1.64645 5.35355C1.45118 5.15829 1.45118 4.84171 1.64645 4.64645Z" fill="#727272"/></svg>
                    </span>
                  </div>

                  <!-- Paint Roller -->
                  <button class="lvd-rte-btn" title="Paint">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clip-path="url(#rte-clip-paint)">
                        <path d="M0 3C0 1.34531 1.34531 0 3 0H16.5C18.1547 0 19.5 1.34531 19.5 3V6C19.5 7.65469 18.1547 9 16.5 9H3C1.34531 9 0 7.65469 0 6V3ZM7.5 16.5C7.5 15.6703 8.17031 15 9 15V14.25C9 12.1781 10.6781 10.5 12.75 10.5H19.5C20.3297 10.5 21 9.82969 21 9V3.25781C22.7484 3.87656 24 5.54063 24 7.5V9C24 11.4844 21.9844 13.5 19.5 13.5H12.75C12.3375 13.5 12 13.8375 12 14.25V15C12.8297 15 13.5 15.6703 13.5 16.5V22.5C13.5 23.3297 12.8297 24 12 24H9C8.17031 24 7.5 23.3297 7.5 22.5V16.5Z" fill="#1C4240"/>
                      </g>
                      <defs><clipPath id="rte-clip-paint"><rect width="24" height="24" fill="white"/></clipPath></defs>
                    </svg>
                  </button>

                  <!-- Link -->
                  <button class="lvd-rte-btn" title="Link">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 13C10.4295 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9403 15.7513 14.6897C16.4231 14.4392 17.0331 14.047 17.54 13.54L20.54 10.54C21.4508 9.59695 21.9548 8.33394 21.9434 7.02296C21.932 5.71198 21.4061 4.45791 20.4791 3.53087C19.5521 2.60383 18.298 2.07799 16.987 2.0666C15.676 2.0552 14.413 2.55918 13.47 3.46997L11.75 5.17997" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M14 11C13.5705 10.4259 13.0226 9.9508 12.3934 9.60704C11.7642 9.26328 11.0684 9.05886 10.3533 9.00765C9.63816 8.95643 8.92037 9.05961 8.24861 9.3102C7.57685 9.56079 6.96684 9.95291 6.45996 10.46L3.45996 13.46C2.54917 14.403 2.04519 15.666 2.05659 16.977C2.06798 18.288 2.59382 19.542 3.52086 20.4691C4.4479 21.3961 5.70197 21.922 7.01295 21.9334C8.32393 21.9447 9.58694 21.4408 10.53 20.53L12.24 18.82" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>

                  <!-- Highlighter -->
                  <button class="lvd-rte-btn" title="Highlight">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clip-path="url(#rte-clip-highlight)">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M16.6435 0.966605C17.823 -0.153921 19.6807 -0.130109 20.8311 1.02028L22.9796 3.16885C24.13 4.31924 24.1538 6.17691 23.0333 7.35641L22.4137 8.00869L10.3083 21.5008C10.166 21.6593 9.96304 21.7499 9.75002 21.7499H5.25002C5.12625 21.7499 5.00563 21.7193 4.89828 21.6623L4.28035 22.2802C4.1397 22.4209 3.94893 22.4999 3.75002 22.4999H0.750022C0.446675 22.4999 0.173198 22.3172 0.0571123 22.0369C-0.0589735 21.7567 0.00519334 21.4341 0.219692 21.2196L2.33762 19.1016C2.28062 18.9943 2.25002 18.8737 2.25002 18.7499V14.2499C2.25002 14.0369 2.3406 13.8339 2.49916 13.6917L15.9912 1.58628L16.6435 0.966605ZM16.4721 3.1701L4.09019 14.2794L9.72052 19.9097L20.8298 7.52785L16.4721 3.1701ZM21.8487 6.42546L21.9458 6.32329C22.5061 5.73354 22.4942 4.8047 21.919 4.22951L19.7704 2.08094C19.1952 1.50575 18.2664 1.49384 17.6766 2.0541L17.5745 2.15117L21.8487 6.42546ZM7.93936 20.2499L3.75002 16.0606V18.4392L5.56068 20.2499H7.93936Z" fill="#1C4240"/>
                      </g>
                      <defs><clipPath id="rte-clip-highlight"><rect width="24" height="24" fill="white"/></clipPath></defs>
                    </svg>
                  </button>

                  <!-- Table with dropdown -->
                  <div class="lvd-rte-group">
                    <button class="lvd-rte-btn" title="Table">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clip-path="url(#rte-clip-table)">
                          <path d="M0 3C0 1.34315 1.34315 0 3 0H21C22.6569 0 24 1.34315 24 3V21C24 22.6569 22.6569 24 21 24H3C1.34315 24 0 22.6569 0 21V3ZM22.5 6H16.5V10.5H22.5V6ZM22.5 12H16.5V16.5H22.5V12ZM22.5 18H16.5V22.5H21C21.8284 22.5 22.5 21.8284 22.5 21V18ZM15 22.5V18H9V22.5H15ZM7.5 22.5V18H1.5V21C1.5 21.8284 2.17157 22.5 3 22.5H7.5ZM1.5 16.5H7.5V12H1.5V16.5ZM1.5 10.5H7.5V6H1.5V10.5ZM9 6V10.5H15V6H9ZM15 12H9V16.5H15V12Z" fill="#1C4240"/>
                        </g>
                        <defs><clipPath id="rte-clip-table"><rect width="24" height="24" fill="white"/></clipPath></defs>
                      </svg>
                    </button>
                    <span class="lvd-rte-dropdown-caret">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.64645 4.64645C1.84171 4.45118 2.15829 4.45118 2.35355 4.64645L8 10.2929L13.6464 4.64645C13.8417 4.45118 14.1583 4.45118 14.3536 4.64645C14.5488 4.84171 14.5488 5.15829 14.3536 5.35355L8.35355 11.3536C8.15829 11.5488 7.84171 11.5488 7.64645 11.3536L1.64645 5.35355C1.45118 5.15829 1.45118 4.84171 1.64645 4.64645Z" fill="#727272"/></svg>
                    </span>
                  </div>

                  <!-- Image -->
                  <button class="lvd-rte-btn" title="Image">
                    <svg width="24" height="21" viewBox="0 0 24 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 6.75C9 7.99264 7.99264 9 6.75 9C5.50736 9 4.5 7.99264 4.5 6.75C4.5 5.50736 5.50736 4.5 6.75 4.5C7.99264 4.5 9 5.50736 9 6.75Z" fill="#1C4240"/>
                      <path d="M3 0C1.34315 0 0 1.34315 0 3V18C0 19.6569 1.34315 21 3 21H21C22.6569 21 24 19.6569 24 18V3C24 1.34315 22.6569 0 21 0H3ZM21 1.5C21.8284 1.5 22.5 2.17157 22.5 3V12.75L16.8354 9.8292C16.5467 9.68483 16.1979 9.74142 15.9697 9.96969L10.4044 15.5349L6.41603 12.876C6.11856 12.6777 5.72247 12.7169 5.46967 12.9697L1.5 16.5V3C1.5 2.17157 2.17157 1.5 3 1.5H21Z" fill="#1C4240"/>
                    </svg>
                  </button>

                </div>
              </div>

              <!-- Textarea + resize handle -->
              <div class="lvd-rte-field">
                <textarea v-model="textareaValue" class="lvd-rte-textarea" placeholder="Add explanation here"></textarea>
                <span class="lvd-rte-resize">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.0988 12.3558L12.3559 11.0987C12.7016 10.753 12.7441 10.2298 12.4503 9.93604C12.1565 9.64228 11.6334 9.68478 11.2877 10.0305L10.0306 11.2876C9.68489 11.6332 9.64239 12.1564 9.93615 12.4502C10.2299 12.7439 10.7531 12.7015 11.0988 12.3558ZM0.195356 11.509C0.489112 11.8027 1.0123 11.7602 1.358 11.4145L11.4146 1.35789C11.7603 1.01219 11.8028 0.489002 11.5091 0.195247C11.2153 -0.0985092 10.6921 -0.0560124 10.3464 0.289684L0.289794 10.3463C-0.0559024 10.692 -0.0983995 11.2152 0.195356 11.509ZM5.91412 12.1994L12.1995 5.91401C12.5452 5.56832 12.5877 5.04513 12.294 4.75137C12.0002 4.45762 11.477 4.50011 11.1313 4.84581L4.84592 11.1312C4.50022 11.4769 4.45773 12.0001 4.75148 12.2938C5.04524 12.5876 5.56842 12.5451 5.91412 12.1994Z" fill="#1C4240"/>
                  </svg>
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
            <span v-show="!chapterNavCollapsed" class="lvd-step-title">{{ ch.title }}</span>
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

      <!-- Right: Main content -->
      <main class="lvd-main">
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
        <button
          v-if="activeChapterIndex > 0"
          class="lvd-footer-btn"
          @click="goPrevious"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11.25 13.5L6.75 9L11.25 4.5" stroke="#1C4240" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="lvd-footer-btn-text">Previous chapter</span>
        </button>

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
.lvd-botanical-row { display: flex; flex-direction: column; gap: 6px; }
.lvd-botanical-text {
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

/* ── RTE ── */
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
.lvd-rte-icons {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 16px;
  gap: 24px;
  width: 100%;
}

/* Individual toolbar button */
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

/* Toolbar group = button + dropdown caret inline */
.lvd-rte-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.lvd-rte-dropdown-caret {
  display: flex;
  align-items: center;
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.lvd-rte-dropdown-caret:hover { opacity: 0.7; }

/* Textarea area */
.lvd-rte-field {
  position: relative;
  background: #FFFFFF;
  border: 1px solid #1C4240;
  border-top: none;
  border-radius: 0 0 4px 4px;
  padding: 16px 20px 16px 16px;
  min-height: 122px;
  max-height: 216px;
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
  right: -1px;
  bottom: 9px;
  width: 16px;
  height: 16px;
  opacity: 0.6;
  cursor: nwse-resize;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lvd-rte-resize:hover { opacity: 1; }

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

.lvd-content-area {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

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
  transition: opacity 0.15s ease;
}
.lvd-stepper--collapsed .lvd-step-title { opacity: 0; }

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
  white-space: nowrap;
  transition: opacity 0.15s ease;
}
.lvd-stepper--collapsed .lvd-collapse-label { opacity: 0; }

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

.lvd-question { display: flex; flex-direction: column; gap: 10px; }
.lvd-q-label  { font-size: 16px; font-weight: 700; color: #303030; line-height: 20px; }
.lvd-q-text   { font-size: 14px; font-weight: 400; color: #303030; line-height: 20px; }
.lvd-required { color: #D32F2F; margin-left: 2px; }

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