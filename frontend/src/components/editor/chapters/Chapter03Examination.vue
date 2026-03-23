<script setup lang="ts">
import { computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { RadioGroup, RadioOption, Input, Links } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { useChapterPreview } from '@/composables/useChapterPreview';
import { useTinymce } from '@/composables/useTinymce';
import SectionAccordion from '@/components/editor/shared/SectionAccordion.vue';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 200 });
const { previewHtml, previewLoading, previewError, needsRefresh, markDirty, handleRefresh } =
  useChapterPreview('03');

// Null-safe: DB may return null for unset fields
const data = computed(() => store.chapters['03'] ?? {});

function s(field: string): string {
  const v = (data.value as any)[field];
  return v == null ? '' : String(v);
}

function onFieldChange(field: string, value: string | null | undefined) {
  store.autosave('03', field, value ?? '');
  markDirty();
}

const plotDesigns = computed(() => store.lookups?.plotDesigns ?? []);
</script>

<template>
  <ChapterPreview
    v-if="data"
    :loading="previewLoading"
    :needs-refresh="needsRefresh"
    @refresh="handleRefresh"
  >
    <template #edit>
      <div style="display: flex; flex-direction: column; gap: 16px">

        <!-- ══════════════════════════════════════════════════
             3.1 Number of Growing Cycles
             legacy: examination_3_1_title + (ASW 2) link
        ══════════════════════════════════════════════════ -->
        <SectionAccordion number="3.1" title="Number of Growing Cycles" :open="true">
          <div style="display: flex; flex-direction: column; gap: 16px">

            <!-- legacy: sidebar link "Explanation of the growing cycle (GN 8)" -->
            <Links :links="[{ text: 'Explanation of the growing cycle (GN 8)' }]" />

            <!-- ── 3.1.1 Growing cycle duration ── -->
            <!--
              legacy: growingCycle radio
              examination_3_1_option_1 = "Single growing cycle"
              examination_3_1_option_2 = "Two independent growing cycles"
              DB: GrowingCycle = "Single" | "Two"
              ALLOWED_FIELDS: GrowingCycle ✓
            -->
            <div style="display: flex; flex-direction: column; gap: 10px">
              <RadioGroup
                :model-value="s('GrowingCycle')"
                direction="vertical"
                @update:model-value="onFieldChange('GrowingCycle', $event)"
              >
                <RadioOption value="Single" label="Single growing cycle" />
                <RadioOption value="Two" label="Two independent growing cycles" />
              </RadioGroup>

              <!--
                Sub-options visible when GrowingCycle = "Two"
                legacy: plantingForm radio
                examination_3_1_option_2_a = "Two independent cycles in the form of two separate plantings"
                examination_3_1_option_2_b = "Two independent cycles from a single planting"
                DB: PlantingForm = "in the form of two separate plantings" | "from a single planting"
                ALLOWED_FIELDS: PlantingForm ✓
              -->
              <div
                v-if="s('GrowingCycle') === 'Two'"
                style="display: flex; flex-direction: column; gap: 8px; padding: 8px 16px;
                       border-left: 3px solid #CEDD80"
              >
                <RadioGroup
                  :model-value="s('PlantingForm')"
                  direction="vertical"
                  @update:model-value="onFieldChange('PlantingForm', $event)"
                >
                  <RadioOption
                    value="from two separate plantings"
                    label="Two independent cycles in the form of two separate plantings"
                  />
                  <RadioOption
                    value="from a single planting"
                    label="Two independent cycles from a single planting"
                  />
                </RadioGroup>
              </div>
            </div>

            <!-- ── 3.1.2 Fruit crop ── -->
            <!--
              legacy: isCropReqd (IsFruitCrop) radio
              examination_3_2_question = "Is a satisfactory crop of fruit required?"
              DB: IsFruitCrop = "Y" | "N"
              ALLOWED_FIELDS: IsFruitCrop ✓
            -->
            <div style="display: flex; flex-direction: column; gap: 10px">
              <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                Is a satisfactory crop of fruit required?
              </p>
              <RadioGroup
                :model-value="s('IsFruitCrop')"
                direction="horizontal"
                @update:model-value="onFieldChange('IsFruitCrop', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>

              <!--
                Sub-options when IsFruitCrop = "Y"
                legacy: fruitDormantPeriod radio
                examination_3_2_option_1 = "Fruit species with clearly defined dormant period"
                examination_3_2_option_2 = "Fruit species with no clearly defined dormant period"
                examination_3_2_option_3 = "Evergreen species with indeterminate growth"
                DB: FruitDormantPeriod = "Defined" | "NotDefined" | "Evergreen"
                ALLOWED_FIELDS: FruitDormantPeriod ✓
              -->
              <div
                v-if="s('IsFruitCrop') === 'Y'"
                style="display: flex; flex-direction: column; gap: 8px; padding: 8px 16px;
                       border: 2px solid #CEDD80; border-radius: 10px"
              >
                <RadioGroup
                  :model-value="s('FruitDormantPeriod')"
                  direction="vertical"
                  @update:model-value="onFieldChange('FruitDormantPeriod', $event)"
                >
                  <RadioOption value="Defined"    label="Fruit species with clearly defined dormant period" />
                  <RadioOption value="NotDefined" label="Fruit species with no clearly defined dormant period" />
                  <RadioOption value="Evergreen"  label="Evergreen species with indeterminate growth" />
                </RadioGroup>
              </div>
            </div>

            <!-- ── Other growing cycle info (Add/Remove Paragraph in legacy) ── -->
            <!--
              legacy: otherGrowingCycleInfo textarea (Add Paragraph / Remove Paragraph buttons)
              DB: OtherGrowingCycleInfo
              ALLOWED_FIELDS: OtherGrowingCycleInfo ✓
            -->
            <div style="display: flex; flex-direction: column; gap: 6px">
              <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
                Additional information on the number of growing cycles
                <span style="font-weight: 400; color: var(--color-neutral-500)"> (optional)</span>
              </label>
              <Editor
                :model-value="s('OtherGrowingCycleInfo')"
                :api-key="apiKey"
                :init="init"
                @update:model-value="onFieldChange('OtherGrowingCycleInfo', $event)"
              />
            </div>

            <!-- ── Growing cycle add info (examinationMethodAddInfo in legacy) ── -->
            <!--
              legacy: examinationMethodAddInfo textarea (Add Paragraph / Remove Paragraph)
              DB: GrowingCycleAddInfo
              ALLOWED_FIELDS: GrowingCycleAddInfo ✓
            -->
            <div style="display: flex; flex-direction: column; gap: 6px">
              <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
                Additional information on growing cycles
                <span style="font-weight: 400; color: var(--color-neutral-500)"> (optional)</span>
              </label>
              <Editor
                :model-value="s('GrowingCycleAddInfo')"
                :api-key="apiKey"
                :init="init"
                @update:model-value="onFieldChange('GrowingCycleAddInfo', $event)"
              />
            </div>

          </div>
        </SectionAccordion>

        <!-- ══════════════════════════════════════════════════
             3.2 Testing Place
             legacy: section between 3.1 and 3.3 (no questions — standard items)
        ══════════════════════════════════════════════════ -->
        <SectionAccordion number="3.2" title="Testing Place">
          <div style="display: flex; flex-direction: column; gap: 16px">
            <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-600); margin: 0">
              Standard items are configured by default.
            </p>
          </div>
        </SectionAccordion>

        <!-- ══════════════════════════════════════════════════
             3.3 Conditions for Conducting the Examination
             legacy: examination_3_3_title + (GN 9) link
        ══════════════════════════════════════════════════ -->
        <SectionAccordion number="3.3" title="Conditions for Conducting the Examination">
          <div style="display: flex; flex-direction: column; gap: 16px">

            <!-- legacy: sidebar link "Growth stage key (GN 9)" -->
            <Links :links="[{ text: 'Growth stage key (GN 9)' }]" />

            <!-- ── 3.3.1 Development stages ── -->
            <!--
              legacy: examination_3_3_question_1
              "Indicate if there are stages of development in the Table of Characteristics"
              DB: Devlopmentstage = "Y" | "N"
              ALLOWED_FIELDS: Devlopmentstage ✓
            -->
            <div style="display: flex; flex-direction: column; gap: 10px">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
                3.3.1 Development stages
              </h3>
              <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                Indicate if there are stages of development in the Table of Characteristics
              </p>
              <RadioGroup
                :model-value="s('Devlopmentstage')"
                direction="horizontal"
                @update:model-value="onFieldChange('Devlopmentstage', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>
            </div>

            <!-- ── 3.3.2 Plot types ── -->
            <!--
              legacy: examination_3_3_question_2
              "Are there different types of plots for observation?"
              DB: DifferentPlotsForObservation = "Y" | "N"
              ALLOWED_FIELDS: DifferentPlotsForObservation ✓
            -->
            <div style="display: flex; flex-direction: column; gap: 10px">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
                3.3.2 Plot types
              </h3>
              <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                Are there different types of plots for observation?
              </p>
              <RadioGroup
                :model-value="s('DifferentPlotsForObservation')"
                direction="horizontal"
                @update:model-value="onFieldChange('DifferentPlotsForObservation', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>
            </div>

            <!-- ── 3.3.3 Color observation ── -->
            <!--
              legacy: examination_3_3_question_3
              "Indicate if the observation of color by eye applies:"
              DB: EyeColorObservation = "Y" | "N"
              ALLOWED_FIELDS: EyeColorObservation ✓
            -->
            <div style="display: flex; flex-direction: column; gap: 10px">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
                3.3.3 Color observation
              </h3>
              <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                Indicate if the observation of color by eye applies:
              </p>
              <RadioGroup
                :model-value="s('EyeColorObservation')"
                direction="horizontal"
                @update:model-value="onFieldChange('EyeColorObservation', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>
            </div>

            <!-- ── Additional conditions info (conditionAddInfo in legacy) ── -->
            <!--
              legacy: conditionAddInfo textarea (Add Paragraph / Remove Paragraph)
              "Additional information on the conditions for conducting the examination:"
              DB: ConditionAddInfo
              ALLOWED_FIELDS: ConditionAddInfo ✓
            -->
            <div style="display: flex; flex-direction: column; gap: 6px">
              <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
                Additional information on the conditions for conducting the examination
                <span style="font-weight: 400; color: var(--color-neutral-500)"> (optional)</span>
              </label>
              <Editor
                :model-value="s('ConditionAddInfo')"
                :api-key="apiKey"
                :init="init"
                @update:model-value="onFieldChange('ConditionAddInfo', $event)"
              />
            </div>

          </div>
        </SectionAccordion>

        <!-- ══════════════════════════════════════════════════
             3.4 Test Design
             legacy: examination_3_4_title + (GN 10.1) link
        ══════════════════════════════════════════════════ -->
        <SectionAccordion number="3.4" title="Test Design">
          <div style="display: flex; flex-direction: column; gap: 16px">

            <!-- legacy: sidebar link "Test design (GN 10.1)" -->
            <Links :links="[{ text: 'Test design (GN 10.1)' }]" />

            <!-- ── Propagation method question ── -->
            <!--
              legacy: examination_3_4_question
              "Is there more than one method of propagation:" *
              DB: IsOneMethodOfPropogation = "Y" | "N"
              ALLOWED_FIELDS: IsOneMethodOfPropogation ✓
            -->
            <div style="display: flex; flex-direction: column; gap: 10px">
              <p style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                Is there more than one method of propagation:
                <span style="color: #D32F2F; margin-left: 2px">*</span>
              </p>
              <RadioGroup
                :model-value="s('IsOneMethodOfPropogation')"
                direction="horizontal"
                @update:model-value="onFieldChange('IsOneMethodOfPropogation', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>
            </div>

            <!-- ── Plot design ── -->
            <!--
              legacy: examination_3_4_subtitle = "Plot design"
              examination_3_4_option_1 = "Single plot"
              examination_3_4_option_2 = "One type of plot, but replicated"
              examination_3_4_option_3 = "If different types of plots"
              DB: PlotDesign = "Singleplot" | "OneRepplot" | "Diffplot"
              ALLOWED_FIELDS: PlotDesign ✓
            -->
            <div style="display: flex; flex-direction: column; gap: 10px">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
                Plot design
              </h3>
              <RadioGroup
                :model-value="s('PlotDesign')"
                direction="vertical"
                @update:model-value="onFieldChange('PlotDesign', $event)"
              >
                <RadioOption value="Singleplot"  label="Single plot" />
                <RadioOption value="OneRepplot"  label="One type of plot, but replicated" />
                <RadioOption value="Diffplot"    label="If different types of plots" />
              </RadioGroup>

              <!--
                Single plot: "Each test should be designed to result in at least [X] (number) [plant type]"
                legacy: examination_ASW_5_a_part1 / part2
                DB: PlantNumber, PlantType
                ALLOWED_FIELDS: PlantNumber ✓, PlantType ✓
              -->
              <div
                v-if="s('PlotDesign') === 'Singleplot'"
                style="display: flex; align-items: center; gap: 6px; padding: 8px 12px;
                       background: var(--color-neutral-50); border-left: 3px solid #CEDD80; flex-wrap: wrap"
              >
                <span style="font-size: 14px; color: var(--color-neutral-800)">
                  Each test should be designed to result in at least
                </span>
                <Input
                  :model-value="s('PlantNumber')"
                  placeholder="(number)"
                  size="small"
                  style="display: inline-block; width: 70px"
                  @update:model-value="onFieldChange('PlantNumber', $event)"
                />
                <Input
                  :model-value="s('PlantType')"
                  placeholder="(plant type)"
                  size="small"
                  style="display: inline-block; width: 140px"
                  @update:model-value="onFieldChange('PlantType', $event)"
                />
                <a href="#" style="color: #808080; font-size: 12px"><i>(ASW 5(a))</i></a>
              </div>

              <!--
                Replicated plot: "Each test should be designed to result in at least [X] (number) [plant type],
                which should be divided between at least [replicates] replicates."
                legacy: examination_ASW_5_c_part1/2/3/4
                DB: PlantNumber, PlantType, Replicatenum
                ALLOWED_FIELDS: PlantNumber ✓, Replicatenum ✓
              -->
              <div
                v-if="s('PlotDesign') === 'OneRepplot'"
                style="display: flex; align-items: center; gap: 6px; padding: 8px 12px;
                       background: var(--color-neutral-50); border-left: 3px solid #CEDD80; flex-wrap: wrap"
              >
                <span style="font-size: 14px; color: var(--color-neutral-800)">
                  Each test should be designed to result in at least
                </span>
                <Input
                  :model-value="s('PlantNumber')"
                  placeholder="(number)"
                  size="small"
                  style="display: inline-block; width: 70px"
                  @update:model-value="onFieldChange('PlantNumber', $event)"
                />
                <Input
                  :model-value="s('PlantType')"
                  placeholder="(plant type)"
                  size="small"
                  style="display: inline-block; width: 140px"
                  @update:model-value="onFieldChange('PlantType', $event)"
                />
                <span style="font-size: 14px; color: var(--color-neutral-800)">
                  <i>(if applicable)</i>, which should be divided between at least
                </span>
                <Input
                  :model-value="s('Replicatenum')"
                  placeholder="(number)"
                  size="small"
                  style="display: inline-block; width: 70px"
                  @update:model-value="onFieldChange('Replicatenum', $event)"
                />
                <span style="font-size: 14px; color: var(--color-neutral-800)">replicates.</span>
                <a href="#" style="color: #808080; font-size: 12px"><i>(ASW 5(c))</i></a>
              </div>

              <!--
                Different plot types: Plot A sentence
                "Each test should be designed to result in at least [PlantNumberA] (number) [PlantTypeA],
                 which should be divided between at least [RowPlotSizeA] replicates."
                legacy: PlotA/B/C/D + sentenceContent5/6/7/8 per prop method
                DB: PlantNumberA, PlantTypeA, RowPlotSizeA
                ALLOWED_FIELDS: PlantNumberA ✓, RowPlotSizeA ✓, PlantTypeA ✓
              -->
              <div
                v-if="s('PlotDesign') === 'Diffplot'"
                style="display: flex; flex-direction: column; gap: 10px; padding: 8px 12px;
                       background: var(--color-neutral-50); border-left: 3px solid #CEDD80"
              >
                <!-- Plot A -->
                <div>
                  <label style="font-size: 13px; font-weight: 700; color: var(--color-neutral-800)">A:</label>
                  <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px; flex-wrap: wrap">
                    <span style="font-size: 14px; color: var(--color-neutral-800)">Each test should be designed to result in at least</span>
                    <Input :model-value="s('PlantNumberA')" placeholder="(number)" size="small" style="width: 70px"
                      @update:model-value="onFieldChange('PlantNumberA', $event)" />
                    <Input :model-value="s('PlantTypeA')" placeholder="(plant type)" size="small" style="width: 140px"
                      @update:model-value="onFieldChange('PlantTypeA', $event)" />
                    <span style="font-size: 14px; color: var(--color-neutral-800)">, which should be divided between at least</span>
                    <Input :model-value="s('RowPlotSizeA')" placeholder="(number)" size="small" style="width: 70px"
                      @update:model-value="onFieldChange('RowPlotSizeA', $event)" />
                    <span style="font-size: 14px; color: var(--color-neutral-800)">replicates.</span>
                    <a href="#" style="color: #808080; font-size: 12px"><i>(ASW 5(c))</i></a>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── Plant removal (3.5 question in legacy = section 3.4 in new) ── -->
            <!--
              legacy: examination_3_5_question_plants
              "Is it necessary to state that the design of the tests should be such that plants or parts
               of plants may be removed for measurement or counting without prejudice to the observations
               which must be made up to the end of growing cycle?"
              DB: PlantRemoval = "Y" | "N"
              ALLOWED_FIELDS: PlantRemoval ✓
            -->
            <div style="display: flex; flex-direction: column; gap: 10px">
              <p style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                Is it necessary to state that the design of the tests should be such that plants or parts
                of plants may be removed for measurement or counting without prejudice to the observations
                which must be made up to the end of growing cycle?
              </p>
              <RadioGroup
                :model-value="s('PlantRemoval')"
                direction="horizontal"
                @update:model-value="onFieldChange('PlantRemoval', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>
            </div>

            <!-- ── Additional test design info (testDesignAddInfo in legacy) ── -->
            <!--
              legacy: testDesignAddInfo textarea (Add Paragraph / Remove Paragraph)
              "Additional information on test design"
              DB: TestDesignAddInfo
              ALLOWED_FIELDS: TestDesignAddInfo ✓
            -->
            <div style="display: flex; flex-direction: column; gap: 6px">
              <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
                Additional information on test design
                <span style="font-weight: 400; color: var(--color-neutral-500)"> (optional)</span>
              </label>
              <Editor
                :model-value="s('TestDesignAddInfo')"
                :api-key="apiKey"
                :init="init"
                @update:model-value="onFieldChange('TestDesignAddInfo', $event)"
              />
            </div>

          </div>
        </SectionAccordion>

      </div>
    </template>

    <div v-if="previewError" style="color: #D32F2F; font-size: 13px">⚠ {{ previewError }}</div>
    <div v-else-if="previewHtml" v-html="previewHtml" />
  </ChapterPreview>
</template>