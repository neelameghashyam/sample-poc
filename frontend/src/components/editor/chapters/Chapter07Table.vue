<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Button, Card, Input, Table, ReorderTable } from 'upov-ui';
import type { ReorderTableColumn, ReorderTableGroup } from 'upov-ui';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';
import { useEditorStore } from '@/stores/editor';
import { editorApi } from '@/services/editor-api';
import type { Characteristic, AdoptedSearchResult } from '@/types/editor';

const store = useEditorStore();

const data = computed(() => store.chapters['07']);
const characteristics = computed<Characteristic[]>(() => data.value?.characteristics ?? []);

// ── Search adopted ────────────────────────────────────────────────────────────
const searchQuery = ref('');
const searchResults = ref<AdoptedSearchResult[]>([]);
const searchDone = ref(false);
const searching = ref(false);

async function doSearch() {
  if (!searchQuery.value.trim()) return;
  searching.value = true;
  try {
    searchResults.value = await editorApi.searchAdopted(store.tgId!, searchQuery.value);
    searchDone.value = true;
  } catch (err) {
    console.error('Search error:', err);
  } finally {
    searching.value = false;
  }
}

function clearSearch() {
  searchQuery.value = '';
  searchResults.value = [];
  searchDone.value = false;
}

async function importAdopted(result: AdoptedSearchResult) {
  await editorApi.createCharacteristic(store.tgId!, {
    TOC_Name: result.name,
    Expression_Type: result.type,
    ObservationM_PlotT: result.methods,
    IsAdoptedTG: 'Y',
  });
  // Refresh characteristics
  const chars = await editorApi.searchAdopted(store.tgId!, '');
  await refreshCharacteristics();
  searchResults.value = searchResults.value.filter((r) => r.id !== result.id);
}

async function refreshCharacteristics() {
  const res = await editorApi.open(store.tgId!);
  store.chapters['07'] = res.chapters['07'];
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
const editingChar = ref<Characteristic | null>(null);
const showModal = ref(false);

function openAddModal() {
  editingChar.value = null;
  showModal.value = true;
}

function openEditModal(char: Characteristic) {
  editingChar.value = char;
  showModal.value = true;
}

async function onDelete(group: ReorderTableGroup) {
  await editorApi.deleteCharacteristic(store.tgId!, group.id as number);
  await refreshCharacteristics();
}

// ── ReorderTable ─────────────────────────────────────────────────────────────
const columns: ReorderTableColumn[] = [
  { key: 'english', label: 'English' },
  { key: 'example', label: 'Example Varieties' },
  { key: 'notes', label: 'Notes', width: '80px', align: 'center' },
];

const groups = computed<ReorderTableGroup[]>(() =>
  characteristics.value.map((c) => ({
    id: c.TOC_ID,
    badges: [c.Expression_Type, c.ObservationM_PlotT].filter(Boolean),
    title: c.TOC_Name,
    asterisk: c.Asterisk === 'Y',
    rows: c.expressions.map((e) => ({
      english: e.State_of_Expression,
      example: e.Example_Varieties,
      notes: e.Expression_Notes,
    })),
  }))
);

async function onReorder(newGroups: ReorderTableGroup[]) {
  const order = newGroups.map((g, i) => ({ TOC_ID: g.id as number, CharacteristicOrder: i + 1 }));
  await editorApi.reorderCharacteristics(store.tgId!, order);
  await refreshCharacteristics();
}

function onTitleClick(group: ReorderTableGroup) {
  const char = characteristics.value.find((c) => c.TOC_ID === group.id);
  if (char) openEditModal(char);
}

const previewHtml = ref<string | null>(null);
const previewLoading = ref(false);
const previewError = ref<string | null>(null);

async function loadPreview(lang: string) {
  if (!store.tgId) return;
  previewLoading.value = true;
  previewError.value = null;
  try {
    previewHtml.value = await editorApi.docPreview(store.tgId, '07', lang);
  } catch (err: any) {
    previewError.value = err?.response?.data?.error?.message || 'Failed to load preview';
  } finally {
    previewLoading.value = false;
  }
}

async function handleRefresh(lang: string) {
  await loadPreview(lang);
}

onMounted(() => {
  loadPreview('en');
});
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 24px">
    <!-- Search adopted -->
    <Card elevation="low">
      <h2 style="font-size: 18px; font-weight: 700; color: var(--color-neutral-800); line-height: 22px">Search adopted characteristics</h2>
      <div style="display: flex; gap: 8px; align-items: center">
        <Input
          v-model="searchQuery"
          type="search"
          placeholder="Search by name..."
          style="flex: 1; min-width: 0"
          @keyup.enter="doSearch"
        />
        <Button type="primary" :disabled="searching" @click="doSearch">
          {{ searching ? 'Searching...' : 'Search' }}
        </Button>
        <Button v-if="searchDone" type="secondary" @click="clearSearch">Clear</Button>
      </div>

      <!-- Search results -->
      <div v-if="searchDone && searchResults.length > 0">
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Genus</th>
              <th>Type</th>
              <th>Methods</th>
              <th>TG Ref</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in searchResults" :key="r.id">
              <td>{{ r.name }}</td>
              <td>{{ r.genus }}</td>
              <td>{{ r.type }}</td>
              <td>{{ r.methods }}</td>
              <td>{{ r.tgRef }}</td>
              <td>
                <Button type="primary" size="small" @click="importAdopted(r)">Import</Button>
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
      <p v-else-if="searchDone" style="font-size: 14px; color: var(--color-neutral-500)">No results found.</p>
    </Card>

    <!-- Characteristics + Expressions -->
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px">
        <h2 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">
          List of Characteristics ({{ characteristics.length }})
        </h2>
        <Button v-if="store.canEdit" type="primary" size="small" @click="openAddModal">+ Add characteristic</Button>
      </div>
      <ReorderTable
        v-if="characteristics.length > 0"
        :columns="columns"
        :groups="groups"
        :reorderable="store.canEdit"
        :deletable="store.canEdit"
        @update:groups="onReorder"
        @delete="onDelete"
        @titleClick="onTitleClick"
      />
      <p v-else style="font-size: 14px; color: var(--color-neutral-500)">No characteristics added yet.</p>
    </div>
  </div>

  <!-- Chapter-level Preview -->
  <ChapterPreview :loading="previewLoading" @refresh="handleRefresh">
    <div v-if="previewError" style="color: #D32F2F; font-size: 13px">⚠ {{ previewError }}</div>
    <div v-else-if="previewHtml" v-html="previewHtml" />
  </ChapterPreview>
</template>