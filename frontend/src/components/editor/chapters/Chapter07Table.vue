<script setup lang="ts">
import { ref, computed } from 'vue';
import { Button, Card, Input, Table } from 'upov-ui';
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

async function handleDelete(charId: number) {
  await editorApi.deleteCharacteristic(store.tgId!, charId);
  await refreshCharacteristics();
}

// ── Drag reorder ──────────────────────────────────────────────────────────────
let dragIndex = -1;

function onDragStart(index: number) {
  dragIndex = index;
}

async function onDrop(targetIndex: number) {
  if (dragIndex === targetIndex || dragIndex < 0) return;
  const chars = [...characteristics.value];
  const [moved] = chars.splice(dragIndex, 1);
  chars.splice(targetIndex, 0, moved);

  const order = chars.map((c, i) => ({ TOC_ID: c.TOC_ID, CharacteristicOrder: i + 1 }));
  await editorApi.reorderCharacteristics(store.tgId!, order);
  await refreshCharacteristics();
  dragIndex = -1;
}
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

    <!-- Characteristics table -->
    <Card elevation="low">
      <div style="display: flex; align-items: center; justify-content: space-between">
        <h2 style="font-size: 18px; font-weight: 700; color: var(--color-neutral-800); line-height: 22px">Characteristics ({{ characteristics.length }})</h2>
        <Button type="primary" @click="openAddModal">+ Add characteristic</Button>
      </div>

      <Table v-if="characteristics.length > 0" class="chars-table">
        <thead>
          <tr>
            <th class="col-drag"></th>
            <th class="col-num">#</th>
            <th class="col-ast">*</th>
            <th>Characteristic</th>
            <th class="col-type">Type</th>
            <th class="col-method">Method</th>
            <th class="col-stage">Growth Stage</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(char, idx) in characteristics"
            :key="char.TOC_ID"
            draggable="true"
            @dragstart="onDragStart(idx)"
            @dragover.prevent
            @drop="onDrop(idx)"
          >
            <td class="col-drag">
              <span style="font-size: 16px; color: #999; user-select: none">&#x2630;</span>
            </td>
            <td class="col-num">{{ char.CharacteristicOrder }}</td>
            <td class="col-ast">{{ char.Asterisk === 'Y' ? '*' : '' }}</td>
            <td>
              <button class="char-link" @click="openEditModal(char)">{{ char.TOC_Name }}</button>
            </td>
            <td class="col-type">{{ char.Expression_Type }}</td>
            <td class="col-method">{{ char.ObservationM_PlotT }}</td>
            <td class="col-stage">{{ char.GROWTH_STAGES }}</td>
            <td class="col-actions">
              <Button type="danger" size="small" icon-left="x-lg" @click="handleDelete(char.TOC_ID)" />
            </td>
          </tr>
        </tbody>
      </Table>
      <p v-else style="font-size: 14px; color: var(--color-neutral-500)">No characteristics added yet.</p>
    </Card>

    <!-- Expressions preview per characteristic -->
    <Card v-if="characteristics.length > 0" elevation="low">
      <h2 style="font-size: 18px; font-weight: 700; color: var(--color-neutral-800); line-height: 22px">States of Expression</h2>
      <div v-for="char in characteristics" :key="'expr-' + char.TOC_ID" style="display: flex; flex-direction: column; gap: 8px">
        <h3 style="font-size: 15px; font-weight: 600; color: var(--color-neutral-800)">{{ char.CharacteristicOrder }}. {{ char.TOC_Name }}</h3>
        <Table v-if="char.expressions.length > 0" size="compact">
          <thead>
            <tr><th>Note</th><th>State</th><th>Example Varieties</th></tr>
          </thead>
          <tbody>
            <tr v-for="expr in char.expressions" :key="expr.TOC_Expression_Notes_ID">
              <td>{{ expr.Expression_Notes }}</td>
              <td>{{ expr.State_of_Expression }}</td>
              <td>{{ expr.Example_Varieties }}</td>
            </tr>
          </tbody>
        </Table>
        <p v-else style="font-size: 13px; color: #999">No expressions defined.</p>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.chars-table tr[draggable="true"] { cursor: grab; }
.chars-table tr[draggable="true"]:active { cursor: grabbing; }
.col-drag { width: 30px; }
.col-num { width: 40px; text-align: center; }
.col-ast { width: 30px; text-align: center; color: #D32F2F; font-weight: 700; }
.col-type { width: 60px; }
.col-method { width: 80px; }
.col-stage { width: 120px; }
.col-actions { width: 40px; }
.char-link { background: none; border: none; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--color-primary-green-dark); text-decoration: underline; text-decoration-color: var(--color-primary-green-light); text-decoration-thickness: 2px; text-underline-offset: 2px; text-align: left; padding: 0; }
.char-link:hover { opacity: 0.7; }
</style>
