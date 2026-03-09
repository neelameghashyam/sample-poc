<script setup lang="ts">
import { computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { RadioGroup, RadioOption, Input } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { useTinymce } from '@/composables/useTinymce';
import SectionAccordion from '@/components/editor/shared/SectionAccordion.vue';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 200 });

const data = computed(() => store.chapters['03']);

function onFieldChange(field: string, value: any) {
  store.autosave('03', field, value);
}

const plotDesigns = computed(() => store.lookups?.plotDesigns ?? []);
</script>

<template>
  <div v-if="data" style="display: flex; flex-direction: column; gap: 12px">

    <!-- 3.1 Number of Growing Cycles -->
    <SectionAccordion number="3.1" title="Number of Growing Cycles">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <!-- Growing cycle radio -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">3.1.1 Growing cycle duration</h3>
          <RadioGroup :model-value="data.GrowingCycle" direction="vertical"
            @update:model-value="onFieldChange('GrowingCycle', $event)">
            <RadioOption value="Single" label="Single growing cycle" />
            <RadioOption value="Two" label="Two independent growing cycles" />
          </RadioGroup>

          <!-- Sub-options for Two cycles -->
          <RadioGroup v-if="data.GrowingCycle === 'Two'" :model-value="data.PlantingForm"
            direction="vertical" style="padding-left: 32px"
            @update:model-value="onFieldChange('PlantingForm', $event)">
            <RadioOption value="from two separate plantings" label="Two separate plantings" />
            <RadioOption value="from a single planting" label="From a single planting" />
          </RadioGroup>
        </div>

        <!-- Fruit crop -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">3.1.3 Fruit crop</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Is a satisfactory crop of fruit required?</p>
          <RadioGroup :model-value="data.IsFruitCrop" direction="horizontal"
            @update:model-value="onFieldChange('IsFruitCrop', $event)">
            <RadioOption value="Y" label="Yes" />
            <RadioOption value="N" label="No" />
          </RadioGroup>

          <RadioGroup v-if="data.IsFruitCrop === 'Y'" :model-value="data.FruitDormantPeriod"
            direction="vertical" style="padding-left: 32px"
            @update:model-value="onFieldChange('FruitDormantPeriod', $event)">
            <RadioOption value="Defined" label="Clearly defined dormant period" />
            <RadioOption value="NotDefined" label="No clearly defined dormant period" />
            <RadioOption value="Evergreen" label="Evergreen species with indeterminate growth" />
          </RadioGroup>
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
          <RadioGroup :model-value="data.Devlopmentstage" direction="horizontal"
            @update:model-value="onFieldChange('Devlopmentstage', $event)">
            <RadioOption value="Y" label="Yes" />
            <RadioOption value="N" label="No" />
          </RadioGroup>
        </div>

        <!-- 3.3.2 Different plots -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">3.3.2 Plot types</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Are there different types of plots for observation?</p>
          <RadioGroup :model-value="data.DifferentPlotsForObservation" direction="horizontal"
            @update:model-value="onFieldChange('DifferentPlotsForObservation', $event)">
            <RadioOption value="Y" label="Yes" />
            <RadioOption value="N" label="No" />
          </RadioGroup>
        </div>

        <!-- 3.3.3 Eye color observation -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">3.3.3 Color observation</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Indicate if the observation of color by eye applies</p>
          <RadioGroup :model-value="data.EyeColorObservation" direction="horizontal"
            @update:model-value="onFieldChange('EyeColorObservation', $event)">
            <RadioOption value="Y" label="Yes" />
            <RadioOption value="N" label="No" />
          </RadioGroup>
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
          <RadioGroup :model-value="data.IsOneMethodOfPropogation" direction="horizontal"
            @update:model-value="onFieldChange('IsOneMethodOfPropogation', $event)">
            <RadioOption value="Y" label="Yes" />
            <RadioOption value="N" label="No" />
          </RadioGroup>
        </div>

        <!-- 3.4.2 Plot design -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">3.4.2 Plot design</h3>
          <RadioGroup :model-value="data.PlotDesign" direction="vertical"
            @update:model-value="onFieldChange('PlotDesign', $event)">
            <RadioOption v-for="opt in plotDesigns" :key="opt.code" :value="opt.code" :label="opt.label" />
          </RadioGroup>
        </div>

        <!-- 3.4.3 Plant removal -->
        <div style="display: flex; flex-direction: column; gap: 10px">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px">3.4.3 Plant removal</h3>
          <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">Is it necessary to state that the design should allow plant removal without prejudice to observations?</p>
          <RadioGroup :model-value="data.PlantRemoval" direction="horizontal"
            @update:model-value="onFieldChange('PlantRemoval', $event)">
            <RadioOption value="Y" label="Yes" />
            <RadioOption value="N" label="No" />
          </RadioGroup>
        </div>

        <!-- Plant count and type inline inputs -->
        <div style="display: flex; gap: 16px; flex-wrap: wrap">
          <Input :model-value="data.PlantNumber || ''" placeholder="60" label="Plant number" size="small"
            @update:model-value="onFieldChange('PlantNumber', $event)" />
          <Input :model-value="data.PlantType || ''" placeholder="trees" label="Plant type" size="small"
            @update:model-value="onFieldChange('PlantType', $event)" />
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
  </div>
</template>
