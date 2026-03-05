<script setup lang="ts">
import { ref, computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Radiobutton, Input, Button } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { editorApi } from '@/services/editor-api';
import { useTinymce } from '@/composables/useTinymce';
import SectionAccordion from '@/components/editor/shared/SectionAccordion.vue';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 200 });

const data = computed(() => store.chapters['03']);
const refreshing = ref(false);

function onFieldChange(field: string, value: any) {
  store.autosave('03', field, value);
}

const plotDesigns = computed(() => store.lookups?.plotDesigns ?? []);

async function refreshPreview() {
  refreshing.value = true;
  try {
    const res = await editorApi.open(store.tgId!);
    store.chapters['03'] = res.chapters['03'];
  } finally {
    refreshing.value = false;
  }
}
</script>

<template>
  <div v-if="data" style="display: flex; flex-direction: column; gap: 12px">

    <!-- 3.1 Number of Growing Cycles -->
    <SectionAccordion number="3.1" title="Number of Growing Cycles">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <!-- Growing cycle radio -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">3.1.1 Growing cycle duration</h3>
          <div style="display: flex; flex-direction: column; gap: 12px">
            <span style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 16px; color: var(--color-neutral-800)" @click="onFieldChange('GrowingCycle', 'Single')">
              <Radiobutton :model-value="data.GrowingCycle === 'Single'" />
              <span>Single growing cycle</span>
            </span>
            <span style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 16px; color: var(--color-neutral-800)" @click="onFieldChange('GrowingCycle', 'Two')">
              <Radiobutton :model-value="data.GrowingCycle === 'Two'" />
              <span>Two independent growing cycles</span>
            </span>
          </div>

          <!-- Sub-options for Two cycles -->
          <div v-if="data.GrowingCycle === 'Two'" style="display: flex; flex-direction: column; gap: 12px; padding-left: 32px">
            <span style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 16px; color: var(--color-neutral-800)" @click="onFieldChange('PlantingForm', 'from two separate plantings')">
              <Radiobutton :model-value="data.PlantingForm === 'from two separate plantings'" />
              <span>Two separate plantings</span>
            </span>
            <span style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 16px; color: var(--color-neutral-800)" @click="onFieldChange('PlantingForm', 'from a single planting')">
              <Radiobutton :model-value="data.PlantingForm === 'from a single planting'" />
              <span>From a single planting</span>
            </span>
          </div>
        </div>

        <!-- Fruit crop -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">3.1.3 Fruit crop</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Is a satisfactory crop of fruit required?</p>
          <div style="display: flex; align-items: center; gap: 24px">
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('IsFruitCrop', 'Y')">
              <Radiobutton :model-value="data.IsFruitCrop === 'Y'" />
              <span>Yes</span>
            </span>
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('IsFruitCrop', 'N')">
              <Radiobutton :model-value="data.IsFruitCrop === 'N'" />
              <span>No</span>
            </span>
          </div>

          <div v-if="data.IsFruitCrop === 'Y'" style="display: flex; flex-direction: column; gap: 12px; padding-left: 32px">
            <span style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 16px; color: var(--color-neutral-800)" @click="onFieldChange('FruitDormantPeriod', 'Defined')">
              <Radiobutton :model-value="data.FruitDormantPeriod === 'Defined'" />
              <span>Clearly defined dormant period</span>
            </span>
            <span style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 16px; color: var(--color-neutral-800)" @click="onFieldChange('FruitDormantPeriod', 'NotDefined')">
              <Radiobutton :model-value="data.FruitDormantPeriod === 'NotDefined'" />
              <span>No clearly defined dormant period</span>
            </span>
            <span style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 16px; color: var(--color-neutral-800)" @click="onFieldChange('FruitDormantPeriod', 'Evergreen')">
              <Radiobutton :model-value="data.FruitDormantPeriod === 'Evergreen'" />
              <span>Evergreen species with indeterminate growth</span>
            </span>
          </div>
        </div>

        <!-- Additional growing cycle info -->
        <div style="display: flex; flex-direction: column; gap: 6px">
          <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">Additional growing cycle information</label>
          <Editor
            :model-value="data.GrowingCycleAddInfo || ''"
            :api-key="apiKey"
            :init="init"
            @update:model-value="onFieldChange('GrowingCycleAddInfo', $event)"
          />
        </div>
      </div>
    </SectionAccordion>

    <!-- 3.2 Testing Place -->
    <SectionAccordion number="3.2" title="Testing Place">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">3.2.1 Standard items are configured by default</h3>
      </div>
    </SectionAccordion>

    <!-- 3.3 Conditions for Conducting the Examination -->
    <SectionAccordion number="3.3" title="Conditions for Conducting the Examination">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <!-- 3.3.1 Development stages -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">3.3.1 Development stages</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Indicate if there are stages of development in the Table of Characteristics</p>
          <div style="display: flex; align-items: center; gap: 24px">
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('Devlopmentstage', 'Y')">
              <Radiobutton :model-value="data.Devlopmentstage === 'Y'" />
              <span>Yes</span>
            </span>
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('Devlopmentstage', 'N')">
              <Radiobutton :model-value="data.Devlopmentstage === 'N'" />
              <span>No</span>
            </span>
          </div>
        </div>

        <!-- 3.3.2 Different plots -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">3.3.2 Plot types</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Are there different types of plots for observation?</p>
          <div style="display: flex; align-items: center; gap: 24px">
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('DifferentPlotsForObservation', 'Y')">
              <Radiobutton :model-value="data.DifferentPlotsForObservation === 'Y'" />
              <span>Yes</span>
            </span>
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('DifferentPlotsForObservation', 'N')">
              <Radiobutton :model-value="data.DifferentPlotsForObservation === 'N'" />
              <span>No</span>
            </span>
          </div>
        </div>

        <!-- 3.3.3 Eye color observation -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">3.3.3 Color observation</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Indicate if the observation of color by eye applies</p>
          <div style="display: flex; align-items: center; gap: 24px">
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('EyeColorObservation', 'Y')">
              <Radiobutton :model-value="data.EyeColorObservation === 'Y'" />
              <span>Yes</span>
            </span>
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('EyeColorObservation', 'N')">
              <Radiobutton :model-value="data.EyeColorObservation === 'N'" />
              <span>No</span>
            </span>
          </div>
        </div>

        <!-- Additional conditions info -->
        <div style="display: flex; flex-direction: column; gap: 6px">
          <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">Additional conditions information</label>
          <Editor
            :model-value="data.ConditionAddInfo || ''"
            :api-key="apiKey"
            :init="init"
            @update:model-value="onFieldChange('ConditionAddInfo', $event)"
          />
        </div>
      </div>
    </SectionAccordion>

    <!-- 3.4 Test Design -->
    <SectionAccordion number="3.4" title="Test Design">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <!-- 3.4.1 More than one propagation method -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">3.4.1 Propagation methods</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Is there more than one method of propagation? <span style="color: #D32F2F; margin-left: 2px">*</span></p>
          <div style="display: flex; align-items: center; gap: 24px">
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('IsOneMethodOfPropogation', 'Y')">
              <Radiobutton :model-value="data.IsOneMethodOfPropogation === 'Y'" />
              <span>Yes</span>
            </span>
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('IsOneMethodOfPropogation', 'N')">
              <Radiobutton :model-value="data.IsOneMethodOfPropogation === 'N'" />
              <span>No</span>
            </span>
          </div>
        </div>

        <!-- 3.4.2 Plot design -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">3.4.2 Plot design</h3>
          <div style="display: flex; flex-direction: column; gap: 12px">
            <span
              v-for="opt in plotDesigns"
              :key="opt.code"
              style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; font-size: 16px; color: var(--color-neutral-800)"
              @click="onFieldChange('PlotDesign', opt.code)"
            >
              <Radiobutton :model-value="data.PlotDesign === opt.code" />
              <span>{{ opt.label }}</span>
            </span>
          </div>
        </div>

        <!-- 3.4.3 Plant removal -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">3.4.3 Plant removal</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Is it necessary to state that the design should allow plant removal without prejudice to observations?</p>
          <div style="display: flex; align-items: center; gap: 24px">
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('PlantRemoval', 'Y')">
              <Radiobutton :model-value="data.PlantRemoval === 'Y'" />
              <span>Yes</span>
            </span>
            <span style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; color: var(--color-neutral-800)" @click="onFieldChange('PlantRemoval', 'N')">
              <Radiobutton :model-value="data.PlantRemoval === 'N'" />
              <span>No</span>
            </span>
          </div>
        </div>

        <!-- Plant count and type inline inputs -->
        <div style="display: flex; gap: 16px; flex-wrap: wrap">
          <div style="width: 180px">
            <Input :model-value="data.PlantNumber || ''" placeholder="60" label="Plant number"
              @update:model-value="onFieldChange('PlantNumber', $event)" />
          </div>
          <div style="width: 180px">
            <Input :model-value="data.PlantType || ''" placeholder="trees" label="Plant type"
              @update:model-value="onFieldChange('PlantType', $event)" />
          </div>
        </div>

        <!-- Additional test design info -->
        <div style="display: flex; flex-direction: column; gap: 6px">
          <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">Additional test design information</label>
          <Editor
            :model-value="data.TestDesignAddInfo || ''"
            :api-key="apiKey"
            :init="init"
            @update:model-value="onFieldChange('TestDesignAddInfo', $event)"
          />
        </div>
      </div>
    </SectionAccordion>

    <!-- 3.5 Additional Tests -->
    <SectionAccordion number="3.5" title="Additional Tests">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <div style="display: flex; flex-direction: column; gap: 6px">
          <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">Additional test information</label>
          <Editor
            :model-value="data.OtherGrowingCycleInfo || ''"
            :api-key="apiKey"
            :init="init"
            @update:model-value="onFieldChange('OtherGrowingCycleInfo', $event)"
          />
        </div>
      </div>
    </SectionAccordion>

    <!-- ── Chapter-level Preview (end of chapter) ── -->
    <ChapterPreview>
      <div style="display: flex; flex-direction: column; gap: 14px">
        <div>
          <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px">3.1 Number of Growing Cycles</p>
          <p v-if="data.GrowingCycle">Growing cycle: <strong>{{ data.GrowingCycle }}</strong><span v-if="data.PlantingForm"> — {{ data.PlantingForm }}</span></p>
          <p v-if="data.IsFruitCrop">Fruit crop required: <strong>{{ data.IsFruitCrop === 'Y' ? 'Yes' : 'No' }}</strong><span v-if="data.FruitDormantPeriod"> ({{ data.FruitDormantPeriod }})</span></p>
          <div v-if="data.GrowingCycleAddInfo" v-html="data.GrowingCycleAddInfo"></div>
          <em v-if="!data.GrowingCycle && !data.GrowingCycleAddInfo" style="color: var(--color-neutral-500)">No content yet</em>
        </div>
        <div>
          <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px">3.2 Testing Place</p>
          <p>3.2.1 Tests are normally conducted at one place. In the case of tests conducted at more than one place, guidance is provided in TGP/9 "Examining Distinctness".</p>
        </div>
        <div>
          <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px">3.3 Conditions for Conducting the Examination</p>
          <p v-if="data.Devlopmentstage">Development stages: <strong>{{ data.Devlopmentstage === 'Y' ? 'Yes' : 'No' }}</strong></p>
          <p v-if="data.DifferentPlotsForObservation">Different plot types: <strong>{{ data.DifferentPlotsForObservation === 'Y' ? 'Yes' : 'No' }}</strong></p>
          <p v-if="data.EyeColorObservation">Color observation: <strong>{{ data.EyeColorObservation === 'Y' ? 'Yes' : 'No' }}</strong></p>
          <div v-if="data.ConditionAddInfo" v-html="data.ConditionAddInfo"></div>
          <em v-if="!data.Devlopmentstage && !data.ConditionAddInfo" style="color: var(--color-neutral-500)">No content yet</em>
        </div>
        <div>
          <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px">3.4 Test Design</p>
          <p v-if="data.PlantNumber || data.PlantType">Plants: <strong>{{ data.PlantNumber }} {{ data.PlantType }}</strong></p>
          <p v-if="data.PlotDesign">Plot design: <strong>{{ data.PlotDesign }}</strong></p>
          <div v-if="data.TestDesignAddInfo" v-html="data.TestDesignAddInfo"></div>
          <em v-if="!data.PlantNumber && !data.PlotDesign && !data.TestDesignAddInfo" style="color: var(--color-neutral-500)">No content yet</em>
        </div>
        <div v-if="data.OtherGrowingCycleInfo">
          <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px">3.5 Additional Tests</p>
          <div v-html="data.OtherGrowingCycleInfo"></div>
        </div>
      </div>
    </ChapterPreview>

    <!-- ── Refresh Button ── -->
    <div style="display: flex; justify-content: flex-end">
      <Button type="secondary" :disabled="refreshing" @click="refreshPreview">
        <svg v-if="!refreshing" width="14" height="14" viewBox="0 0 14 14" fill="none" style="margin-right: 6px">
          <path d="M1 7A6 6 0 0 1 12.5 4M1 7l2-2M1 7l2 2M13 7A6 6 0 0 1 1.5 10M13 7l-2 2M13 7l-2-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ refreshing ? 'Refreshing...' : 'Refresh Preview' }}
      </Button>
    </div>
  </div>
</template>
