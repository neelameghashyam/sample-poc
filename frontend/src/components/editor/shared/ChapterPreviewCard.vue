<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';

const store = useEditorStore();

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
];

const selectedLanguage = ref('en');
const refreshKey = ref(0);

function refresh() {
  refreshKey.value++;
}

const chapterNum = computed(() => {
  const idx = store.activeChapterIndex;
  const list = store.chapterList;
  return list[idx]?.number ?? '01';
});

const chapterData = computed(() => {
  // eslint-disable-next-line no-unused-expressions
  refreshKey.value; // reactivity trigger
  return store.chapters[chapterNum.value];
});

// Build a rich preview based on chapter number
const previewContent = computed(() => {
  // eslint-disable-next-line no-unused-expressions
  refreshKey.value;
  const num = chapterNum.value;
  const d = store.chapters[num];
  if (!d) return null;

  switch (num) {
    case '01': {
      const parts: string[] = [];
      if (d.SubjectClarificationIndicator) parts.push(`<p><strong>Subject clarification:</strong> ${d.SubjectClarificationIndicator === 'Y' ? 'Yes' : 'No'}</p>`);
      if (d.Sub_check) parts.push(`<p><strong>Additional characteristics:</strong> ${d.Sub_check === 'Y' ? 'Yes' : 'No'}</p>`);
      if (d.Sub_Add_Info) parts.push(`<div>${d.Sub_Add_Info}</div>`);
      if (d.Sub_OtherInfo) parts.push(`<div>${d.Sub_OtherInfo}</div>`);
      return parts.length ? parts.join('') : null;
    }
    case '02': {
      const parts: string[] = [];
      if (d.Material_Supplied) parts.push(`<div><strong>Form of material:</strong><br>${d.Material_Supplied}</div>`);
      if (d.Min_Plant_Material) parts.push(`<div><strong>Minimum quantity:</strong><br>${d.Min_Plant_Material}</div>`);
      if (d.SeedQualityReq) parts.push(`<p><strong>Seed quality requirement:</strong> ${d.SeedQualityReq}</p>`);
      if (d.Material_AddInfo) parts.push(`<div><strong>Additional info:</strong><br>${d.Material_AddInfo}</div>`);
      return parts.length ? parts.join('') : null;
    }
    case '03': {
      const parts: string[] = [];
      if (d.GrowingCycle) parts.push(`<p><strong>Growing cycle:</strong> ${d.GrowingCycle}</p>`);
      if (d.PlantingForm) parts.push(`<p><strong>Planting form:</strong> ${d.PlantingForm}</p>`);
      if (d.IsFruitCrop) parts.push(`<p><strong>Fruit crop required:</strong> ${d.IsFruitCrop === 'Y' ? 'Yes' : 'No'}</p>`);
      if (d.GrowingCycleAddInfo) parts.push(`<div>${d.GrowingCycleAddInfo}</div>`);
      parts.push(`<p>3.2.1 Tests are normally conducted at one place. In the case of tests conducted at more than one place, guidance is provided in TGP/9 "Examining Distinctness".</p>`);
      if (d.IsOneMethodOfPropogation) parts.push(`<p><strong>Multiple propagation methods:</strong> ${d.IsOneMethodOfPropogation === 'Y' ? 'Yes' : 'No'}</p>`);
      if (d.PlotDesign) parts.push(`<p><strong>Plot design:</strong> ${d.PlotDesign}</p>`);
      if (d.PlantNumber || d.PlantType) parts.push(`<p><strong>Plants:</strong> ${[d.PlantNumber, d.PlantType].filter(Boolean).join(' ')}</p>`);
      if (d.TestDesignAddInfo) parts.push(`<div>${d.TestDesignAddInfo}</div>`);
      return parts.length ? parts.join('') : null;
    }
    case '04': {
      const parts: string[] = [];
      if (d.IsHybridParentFormula) parts.push(`<p><strong>Hybrid parent formula:</strong> ${d.IsHybridParentFormula === 'Y' ? 'Yes' : 'No'}</p>`);
      if (d.IsHybridVariety) parts.push(`<p><strong>Hybrid variety:</strong> ${d.IsHybridVariety === 'Y' ? 'Yes' : 'No'}</p>`);
      if (d.DistinctnessAddInfo) parts.push(`<div>${d.DistinctnessAddInfo}</div>`);
      if (d.typeOfPropagation) parts.push(`<p><strong>Type of propagation:</strong> ${d.typeOfPropagation}</p>`);
      if (d.StabilityAddInfo) parts.push(`<div><strong>Stability:</strong><br>${d.StabilityAddInfo}</div>`);
      return parts.length ? parts.join('') : null;
    }
    case '05':
      return d.GroupingSummaryText || null;
    case '07': {
      const chars = d.characteristics ?? [];
      if (!chars.length) return null;
      return `<p><strong>Characteristics (${chars.length}):</strong></p><ul style="padding-left:16px; margin:4px 0">${chars.map((c: any) => `<li>${c.TOC_Name}${c.Expression_Type ? ` <em>(${c.Expression_Type})</em>` : ''}</li>`).join('')}</ul>`;
    }
    case '09':
      return d.LiteratureReferences || null;
    case '11':
      return d.annexRefData || null;
    default:
      return null;
  }
});

const isEmpty = computed(() => !previewContent.value);
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 0">
    <!-- Preview Card -->
    <div style="background: #fff; border: 1px solid var(--color-neutral-200, #e8e5d8); border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06)">

      <!-- Card Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(184, 180, 164, 0.10); border-bottom: 1px solid rgba(184, 180, 164, 0.3)">

        <!-- Left: Icon + Label -->
        <div style="display: flex; align-items: center; gap: 6px">
          <Icon icon="file-earmark-text" size="small" style="color: #AD4E02" />
          <span style="font-size: 13px; font-weight: 700; color: #AD4E02; letter-spacing: 0.6px; text-transform: uppercase">Chapter Preview</span>
        </div>

        <!-- Right: Refresh + Language -->
        <div style="display: flex; align-items: center; gap: 10px">
          <!-- Language Dropdown -->
          <div style="position: relative; display: flex; align-items: center; gap: 6px">
            <Icon icon="translate" size="small" style="color: var(--color-neutral-500, #7a7a7a)" />
            <select
              v-model="selectedLanguage"
              style="
                appearance: none;
                background: #fff;
                border: 1px solid var(--color-neutral-200, #e0ddd0);
                border-radius: 6px;
                padding: 5px 28px 5px 10px;
                font-size: 13px;
                font-family: inherit;
                color: var(--color-neutral-800, #333);
                cursor: pointer;
                outline: none;
                min-width: 110px;
              "
            >
              <option v-for="lang in languages" :key="lang.code" :value="lang.code">
                {{ lang.label }}
              </option>
            </select>
            <!-- Dropdown arrow -->
            <div style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); pointer-events: none">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="#7a7a7a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <!-- Refresh Button -->
          <button
            title="Refresh preview"
            style="
              display: flex; align-items: center; gap: 5px;
              padding: 5px 12px;
              background: #fff;
              border: 1px solid var(--color-neutral-200, #e0ddd0);
              border-radius: 6px;
              cursor: pointer;
              font-size: 13px;
              font-family: inherit;
              font-weight: 500;
              color: var(--color-neutral-700, #444);
              transition: background 0.15s, border-color 0.15s;
            "
            @click="refresh"
            @mouseenter="($event.target as HTMLElement).style.background = 'rgba(173, 78, 2, 0.06)'; ($event.target as HTMLElement).style.borderColor = '#AD4E02'"
            @mouseleave="($event.target as HTMLElement).style.background = '#fff'; ($event.target as HTMLElement).style.borderColor = 'var(--color-neutral-200, #e0ddd0)'"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="flex-shrink:0">
              <path d="M1.5 7A5.5 5.5 0 1 0 7 1.5a5.5 5.5 0 0 0-4.1 1.84" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M1.5 4.5V3h1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Divider -->
      <div style="height: 1px; background: rgba(184, 180, 164, 0.3)" />

      <!-- Preview Body -->
      <div style="padding: 16px 20px; min-height: 80px">
        <div
          v-if="!isEmpty"
          style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800, #333); line-height: 22px"
          v-html="previewContent"
        />
        <div
          v-else
          style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--color-neutral-500, #7a7a7a); font-style: italic"
        >
          <Icon icon="info-circle" size="small" />
          <span>No content to preview yet. Fill in the chapter fields above.</span>
        </div>
      </div>
    </div>
  </div>
</template>
