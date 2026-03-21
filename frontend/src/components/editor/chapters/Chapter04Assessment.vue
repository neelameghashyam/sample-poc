<script setup lang="ts">
import { computed, ref } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { RadioGroup, RadioOption, Input, Button } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { useChapterPreview } from '@/composables/useChapterPreview';
import { useTinymce } from '@/composables/useTinymce';
import { editorApi } from '@/services/editor-api';
import SectionAccordion from '@/components/editor/shared/SectionAccordion.vue';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';
import type { AssessmentPropMethod } from '@/types/editor';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 200 });
const { previewHtml, previewLoading, previewError, needsRefresh, markDirty, handleRefresh } =
  useChapterPreview('04');

// ── Null-safe data ────────────────────────────────────────────────────────────
const data = computed(() => store.chapters['04'] ?? {});
// null-safe string read — prevents null/undefined being passed to upov-ui inputs
function s(field: string): string {
  const v = (data.value as any)[field];
  return v == null ? '' : String(v);
}

// ── Scalar field save ─────────────────────────────────────────────────────────
function onFieldChange(field: string, value: string | null | undefined) {
  store.autosave('04', field, value ?? '');
  markDirty();
}
function setRadio(field: string, value: string) {
  onFieldChange(field, value);
}

// ── SinglePlant helpers (stored as "first;second" in DB) ──────────────────────
function spFirst(): string  { return s('SinglePlant').split(';')[0] ?? ''; }
function spSecond(): string { return s('SinglePlant').split(';')[1] ?? ''; }
function setSpFirst(v: string)  { onFieldChange('SinglePlant', v + ';' + spSecond()); }
function setSpSecond(v: string) { onFieldChange('SinglePlant', spFirst() + ';' + v); }

// ── Assessment propagation methods (ch04 dynamic rows) ───────────────────────
// Loaded from store.propagationMethods.assessment via edit.repo.js → findAssessmentPropMethods
const propMethods = computed<AssessmentPropMethod[]>(
  () => store.propagationMethods.assessment ?? []
);

const addingPropMethod = ref(false);
async function addPropMethod() {
  if (addingPropMethod.value || !store.tgId) return;
  addingPropMethod.value = true;
  try {
    const row = await editorApi.createExamPropMethod(store.tgId, '04', {
      PropogationMethod: '',
      NumberOfPlantsFirst: '',
      NumberOfPlantsSecond: '',
      IsPartsOfSinglePlants: 'N',
      NumberOfPartsOfPlant: '',
    });
    store.propagationMethods.assessment.push(row);
    markDirty();
  } finally {
    addingPropMethod.value = false;
  }
}

async function removePropMethod(pmId: number) {
  if (!store.tgId) return;
  await editorApi.deleteExamPropMethod(store.tgId, '04', pmId);
  store.propagationMethods.assessment = store.propagationMethods.assessment.filter(
    (m) => m.AssesmentMethodPropogation_ID !== pmId
  );
  markDirty();
}

function updatePropMethodField(
  pm: AssessmentPropMethod,
  field: keyof AssessmentPropMethod,
  value: string
) {
  (pm as any)[field] = value;
  if (!store.tgId) return;
  editorApi.updateExamPropMethod(store.tgId, '04', pm.AssesmentMethodPropogation_ID, {
    [field]: value,
  });
  markDirty();
}

// ── 4.2 optional TinyMCE paragraphs ──────────────────────────────────────────
// These additional text blocks match the legacy "Add/Remove Paragraph" pattern
// in the cross-pollinated, hybrid-variety, and parent-formula sections.
// They reuse ALLOWED_FIELDS: UniformityAssessmentSameSample stores the Y/N toggle
// and separate rich-text fields store the extra paragraph content.
// We map them to the closest available ALLOWED_FIELDS keys:
//   cross-pollinated add-info → not in ALLOWED_FIELDS, stored client-side only for now
//   hybrid add-info           → not in ALLOWED_FIELDS, stored client-side only for now
// For parent-formula the ASW 8(e) text is sufficient (no separate addInfo field).
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
             4.1  DISTINCTNESS
        ══════════════════════════════════════════════════ -->
        <SectionAccordion number="4.1" title="Distinctness" :open="true">
          <div style="display: flex; flex-direction: column; gap: 20px">

            <!-- ── General Recommendations ── -->
            <!-- legacy: assessment_4_1_subtitle_1 -->
            <div style="display: flex; flex-direction: column; gap: 12px">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
                General Recommendations
              </h3>

              <!--
                legacy: assessment_4_1_question_1
                "Do these Test Guidelines cover hybrid varieties?"
                JSP: path="isHybridVarietyGuideline"  →  ALLOWED: IsHybridVariety
              -->
              <div style="display: flex; flex-direction: column; gap: 6px">
                <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                  Do these Test Guidelines cover hybrid varieties?
                  <span style="color: #D32F2F"> *</span>
                </label>
                <RadioGroup
                  :model-value="s('IsHybridVariety')"
                  direction="horizontal"
                  @update:model-value="setRadio('IsHybridVariety', $event)"
                >
                  <RadioOption value="Y" label="Yes" />
                  <RadioOption value="N" label="No" />
                </RadioGroup>
              </div>

              <!-- Sub-block visible when IsHybridVariety = Y -->
              <div
                v-if="s('IsHybridVariety') === 'Y'"
                style="display: flex; flex-direction: column; gap: 10px; padding: 10px 14px;
                       border-left: 3px solid var(--color-primary-300); background: var(--color-neutral-50)"
              >
                <!--
                  legacy: assessment_4_1_subquestion_1
                  "In the case of hybrids, is the parent formula used?"
                  JSP: path="hybridParentFormula"  →  ALLOWED: IsHybridParentFormula
                -->
                <div style="display: flex; flex-direction: column; gap: 6px">
                  <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                    In the case of hybrids, is the parent formula used?
                    <span style="color: #D32F2F"> *</span>
                  </label>
                  <RadioGroup
                    :model-value="s('IsHybridParentFormula')"
                    direction="horizontal"
                    @update:model-value="setRadio('IsHybridParentFormula', $event)"
                  >
                    <RadioOption value="Y" label="Yes" />
                    <RadioOption value="N" label="No" />
                  </RadioGroup>
                </div>

                <!-- ASW 7(a) — visible when IsHybridParentFormula = Y -->
                <div
                  v-if="s('IsHybridParentFormula') === 'Y'"
                  style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.65;
                         padding: 8px 10px; background: var(--color-neutral-100); border-radius: 4px"
                >
                  To assess distinctness of hybrids, the parent lines and the formula may be used
                  according to the following recommendations:<br><br>
                  (i) description of parent lines according to the Test Guidelines;<br><br>
                  (ii) check of the originality of the parent lines in comparison with the variety
                  collection, based on the characteristics in Chapter 7, in order to identify
                  similar parent lines;<br><br>
                  (iii) check of the originality of the hybrid formula in relation to the hybrids
                  in the variety collection, taking into account the most similar lines; and<br><br>
                  (iv) assessment of the distinctness at the hybrid level for varieties with a
                  similar formula. Further guidance is provided in documents TGP/9
                  "Examining Distinctness" and TGP/8 "Trial Design and Techniques Used in the
                  Examination of Distinctness, Uniformity and Stability".
                  <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">
                    <i>(ASW 7(a))</i>
                  </a>
                </div>

                <!--
                  legacy: distinctnessHybridAddInfo textarea  →  ALLOWED: DistinctnessAddInfo
                -->
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 2px">
                  <label style="font-size: 13px; font-weight: 600; color: var(--color-neutral-700)">
                    Additional information on assessment of distinctness in case of hybrid varieties
                    <span style="font-weight: 400; color: var(--color-neutral-500)"> (optional)</span>
                  </label>
                  <Editor
                    :model-value="s('DistinctnessAddInfo')"
                    :api-key="apiKey"
                    :init="init"
                    @update:model-value="onFieldChange('DistinctnessAddInfo', $event)"
                  />
                </div>
              </div>
            </div>

            <!-- ── Number of plants / Parts of plants to be Examined ── -->
            <!-- legacy: assessment_4_1_subtitle_2_plants -->
            <div style="display: flex; flex-direction: column; gap: 12px">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
                Number of plants / Parts of plants to be Examined
              </h3>

              <!--
                legacy: assessment_4_1_question_2
                "Is there more than one method of propagation?"
                JSP: path="isOneMethodOfPropogation"  →  ALLOWED: IsOneMethodOfPropogation
              -->
              <div style="display: flex; flex-direction: column; gap: 6px">
                <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                  Is there more than one method of propagation?
                  <span style="color: #D32F2F"> *</span>
                </label>
                <RadioGroup
                  :model-value="s('IsOneMethodOfPropogation')"
                  direction="horizontal"
                  @update:model-value="setRadio('IsOneMethodOfPropogation', $event)"
                >
                  <RadioOption value="Y" label="Yes" />
                  <RadioOption value="N" label="No" />
                </RadioGroup>
              </div>

              <!-- ── When NO — single propagation method ── -->
              <!--
                legacy: assessment_4_1_case_part2_one_plants … part4_plants
                "Unless otherwise indicated … [X] plants or parts taken from each of [Y] plants …"
                JSP: numberOfPlantsFirst → SinglePlant[0], numberOfPlantsSecond → SinglePlant[1]
                ALLOWED: SinglePlant stored as "first;second"
              -->
              <div
                v-if="s('IsOneMethodOfPropogation') === 'N'"
                style="display: flex; flex-direction: column; gap: 10px; padding: 10px 14px;
                       border: 2px solid #CEDD80; border-radius: 12px; background: var(--color-neutral-50)"
              >
                <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 1.8; margin: 0; flex-wrap: wrap">
                  Unless otherwise indicated, for the purpose of distinctness, all observations
                  on single plants should be made on
                  <Input
                    :model-value="spFirst()"
                    placeholder="(number)"
                    size="small"
                    style="display: inline-block; width: 70px; margin: 0 4px"
                    @update:model-value="setSpFirst($event)"
                  />
                  plants or parts taken from each of
                  <Input
                    :model-value="spSecond()"
                    placeholder="(number)"
                    size="small"
                    style="display: inline-block; width: 70px; margin: 0 4px"
                    @update:model-value="setSpSecond($event)"
                  />
                  plants and any other observations made on all plants in the test,
                  disregarding any off-type plants.
                </p>

                <!--
                  legacy: assessment_4_1_subquestion_2_plants
                  JSP: path="isPartsOfSinglePlants"  →  ALLOWED: IsPartsOfSinglePlants
                -->
                <div style="display: flex; flex-direction: column; gap: 6px">
                  <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                    Are observations made on parts taken from single plants?
                  </label>
                  <RadioGroup
                    :model-value="s('IsPartsOfSinglePlants')"
                    direction="horizontal"
                    @update:model-value="setRadio('IsPartsOfSinglePlants', $event)"
                  >
                    <RadioOption value="Y" label="Yes" />
                    <RadioOption value="N" label="No" />
                  </RadioGroup>

                  <!--
                    ASW 7(b) — visible when IsPartsOfSinglePlants = Y
                    JSP: numberOfPartsOfPlant  →  ALLOWED: PartsPlant
                  -->
                  <div
                    v-if="s('IsPartsOfSinglePlants') === 'Y'"
                    style="font-size: 14px; color: var(--color-neutral-800); line-height: 1.8;
                           padding: 8px 10px; background: var(--color-neutral-100); border-radius: 4px; flex-wrap: wrap"
                  >
                    In the case of observations of parts taken from single plants, the number of
                    parts to be taken from each of the plants should be
                    <Input
                      :model-value="s('PartsPlant')"
                      placeholder="(number)"
                      size="small"
                      style="display: inline-block; width: 70px; margin: 0 4px"
                      @update:model-value="onFieldChange('PartsPlant', $event)"
                    />
                    <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">
                      <i>(ASW 7(b))</i>
                    </a>
                  </div>
                </div>
              </div>

              <!-- ── When YES — multiple propagation methods ── -->
              <!--
                legacy: dynamic repeating rows from AssesmentMethodPropogation table
                Each row: PropogationMethod text, NumberOfPlantsFirst, NumberOfPlantsSecond,
                          IsPartsOfSinglePlants Y/N, NumberOfPartsOfPlant
                Loaded via store.propagationMethods.assessment
                CRUD via editorApi.createExamPropMethod / updateExamPropMethod / deleteExamPropMethod
              -->
              <div
                v-if="s('IsOneMethodOfPropogation') === 'Y'"
                style="display: flex; flex-direction: column; gap: 10px"
              >
                <!-- Repeating method rows -->
                <div
                  v-for="(pm, idx) in propMethods"
                  :key="pm.AssesmentMethodPropogation_ID"
                  style="display: flex; flex-direction: column; gap: 8px; padding: 10px 14px;
                         border: 2px solid #CEDD80; border-radius: 12px; background: var(--color-neutral-50)"
                >
                  <!-- Separator between rows (legacy green hr) -->
                  <div
                    v-if="idx > 0"
                    style="height: 4px; background: #CEDD80; border-radius: 2px; margin-bottom: 4px"
                  />

                  <!-- Row sentence -->
                  <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 1.8; margin: 0; flex-wrap: wrap">
                    In the case of
                    <Input
                      :model-value="pm.PropogationMethod ?? ''"
                      placeholder="(propagation method)"
                      size="small"
                      style="display: inline-block; width: 200px; margin: 0 4px"
                      @update:model-value="updatePropMethodField(pm, 'PropogationMethod', $event)"
                    />
                    , unless otherwise indicated, for the purpose of distinctness, all
                    observations on single plants should be made on
                    <Input
                      :model-value="(pm as any).NumberOfPlantsFirst ?? ''"
                      placeholder="(number)"
                      size="small"
                      style="display: inline-block; width: 65px; margin: 0 4px"
                      @update:model-value="updatePropMethodField(pm, 'NumberOfPlantsFirst' as any, $event)"
                    />
                    plants or parts taken from each of
                    <Input
                      :model-value="(pm as any).NumberOfPlantsSecond ?? ''"
                      placeholder="(number)"
                      size="small"
                      style="display: inline-block; width: 65px; margin: 0 4px"
                      @update:model-value="updatePropMethodField(pm, 'NumberOfPlantsSecond' as any, $event)"
                    />
                    plants and any other observations made on all plants in the test,
                    disregarding any off-type plants.
                  </p>

                  <!-- Are observations made on parts taken from single plants? -->
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
                    <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                      Are observations made on parts taken from single plants?
                    </label>
                    <RadioGroup
                      :model-value="(pm as any).IsPartsOfSinglePlants ?? 'N'"
                      direction="horizontal"
                      @update:model-value="updatePropMethodField(pm, 'IsPartsOfSinglePlants' as any, $event)"
                    >
                      <RadioOption value="Y" label="Yes" />
                      <RadioOption value="N" label="No" />
                    </RadioGroup>
                  </div>

                  <!-- Parts count — visible when IsPartsOfSinglePlants = Y -->
                  <div
                    v-if="(pm as any).IsPartsOfSinglePlants === 'Y'"
                    style="font-size: 14px; color: var(--color-neutral-800); line-height: 1.8; flex-wrap: wrap"
                  >
                    In the case of observations of parts taken from single plants, the number
                    of parts to be taken from each of the plants should be
                    <Input
                      :model-value="(pm as any).NumberOfPartsOfPlant ?? ''"
                      placeholder="(number)"
                      size="small"
                      style="display: inline-block; width: 65px; margin: 0 4px"
                      @update:model-value="updatePropMethodField(pm, 'NumberOfPartsOfPlant' as any, $event)"
                    />
                    <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">
                      <i>(ASW 7(b))</i>
                    </a>
                  </div>
                </div>

                <!-- Add / Remove method buttons — legacy: "Add method of Propogation" / "Remove method of Propogation" -->
                <div style="display: flex; gap: 10px; margin-top: 4px">
                  <Button
                    type="secondary"
                    size="small"
                    :loading="addingPropMethod"
                    @click="addPropMethod"
                    style="background: #CEDD80; border-color: #CEDD80; color: #333; font-weight: 600"
                  >
                    Add method of Propagation
                  </Button>
                  <Button
                    v-if="propMethods.length > 0"
                    type="secondary"
                    size="small"
                    @click="removePropMethod(propMethods[propMethods.length - 1].AssesmentMethodPropogation_ID)"
                    style="background: #CEDD80; border-color: #CEDD80; color: #333; font-weight: 600"
                  >
                    Remove method of Propagation
                  </Button>
                </div>
              </div>

            </div><!-- /Number of plants section -->
          </div>
        </SectionAccordion>

        <!-- ══════════════════════════════════════════════════
             4.2  UNIFORMITY
        ══════════════════════════════════════════════════ -->
        <SectionAccordion number="4.2" title="Uniformity">
          <div style="display: flex; flex-direction: column; gap: 16px">

            <!--
              legacy: assessment_4_2_part1 + typeOfPropagationInput (standalone wide box) + part2
              "Please don't complete the following sentence if it is not applicable.
               These Test Guidelines have been developed for the examination of [___].
               For varieties with other types of propagation …"
              JSP: typeOfPropagationInput autocomplete box on its own line
              ALLOWED: typeOfPropagation
              FIX: standalone block (not inline) matching legacy layout
            -->
            <div style="font-size: 14px; color: var(--color-neutral-800); line-height: 1.8">
              Please don't complete the following sentence if it is not applicable.
              These Test Guidelines have been developed for the examination of
              <Input
                :model-value="s('typeOfPropagation')"
                placeholder="(variety type)"
                size="small"
                style="display: inline-block; width: 300px; margin: 0 4px"
                @update:model-value="onFieldChange('typeOfPropagation', $event)"
              />
              . For varieties with other types of propagation the recommendation in the
              General Introduction and document TGP/13 "Guidance for new types and species",
              Section 4.5 Testing Uniformity should be followed.
            </div>

            <!-- ── Q1: Cross-pollinated varieties ── -->
            <!--
              legacy: assessment_4_2_question_1
              "Do these Test Guidelines cover cross-pollinated varieties?"
              JSP: isCrossPollinatedVariety  →  ALLOWED: IsHybridVarietyGuideline
            -->
            <div
              style="display: flex; flex-direction: column; gap: 8px; padding: 10px 14px;
                     border: 2px solid #CEDD80; border-radius: 12px"
            >
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">
                <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800); flex: 1">
                  Do these Test Guidelines cover cross-pollinated varieties?
                </label>
                <RadioGroup
                  :model-value="s('IsHybridVarietyGuideline')"
                  direction="horizontal"
                  @update:model-value="setRadio('IsHybridVarietyGuideline', $event)"
                >
                  <RadioOption value="Y" label="Yes" />
                  <RadioOption value="N" label="No" />
                </RadioGroup>
              </div>

              <!-- Sub-options when cross-pollinated = Y -->
              <div
                v-if="s('IsHybridVarietyGuideline') === 'Y'"
                style="display: flex; flex-direction: column; gap: 10px; padding-left: 4px"
              >
                <!--
                  legacy: assessment_4_2_option_1 / option_2
                  JSP: crossPolinattedVarieties  →  ALLOWED: CrossPolinattedVarieties
                -->
                <RadioGroup
                  :model-value="s('CrossPolinattedVarieties')"
                  direction="vertical"
                  @update:model-value="setRadio('CrossPolinattedVarieties', $event)"
                >
                  <RadioOption
                    value="crosspollinatedonly"
                    label="Test Guidelines covering only cross-pollinated varieties"
                  />
                  <RadioOption
                    value="crosspollinatedwithotherpropagation"
                    label="Test Guidelines covering cross-pollinated varieties and varieties with other forms of propagation"
                  />
                </RadioGroup>

                <!-- ASW 8(a)(i) text — crosspollinatedonly -->
                <!-- legacy: assessment_ASW_8_a_i shown in #asw8a_i_text -->
                <div
                  v-if="s('CrossPolinattedVarieties') === 'crosspollinatedonly'"
                  style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                         padding: 6px 10px; background: var(--color-neutral-100); border-radius: 4px"
                >
                  The assessment of uniformity should be according to the recommendations for
                  cross-pollinated varieties in the General Introduction.
                  <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">
                    <i>(ASW 8(a)(i))</i>
                  </a>
                </div>

                <!-- ASW 8(a)(ii) text + typesOfVariety input — crosspollinatedwithotherpropagation -->
                <!-- legacy: assessment_ASW_8_a_ii_part1 + typesOfVariety autocomplete + part2 -->
                <div
                  v-if="s('CrossPolinattedVarieties') === 'crosspollinatedwithotherpropagation'"
                  style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.8;
                         padding: 6px 10px; background: var(--color-neutral-100); border-radius: 4px; flex-wrap: wrap"
                >
                  The assessment of uniformity for
                  <Input
                    :model-value="s('typeOfPropagation')"
                    placeholder="(variety type)"
                    size="small"
                    style="display: inline-block; width: 180px; margin: 0 4px"
                    @update:model-value="onFieldChange('typeOfPropagation', $event)"
                  />
                  should be according to the recommendations for cross-pollinated varieties
                  in the General Introduction.
                  <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">
                    <i>(ASW 8(a)(ii))</i>
                  </a>
                </div>

                <!-- legacy: uniformityCrossPollinatedAddInfo — Remove Paragraph + TinyMCE -->
                <!-- Stored in StabilityAddInfo field is not ideal; this maps to a separate field
                     that the legacy stored as uniformityCrossPollinatedAddInfo.
                     Since it's not in ALLOWED_FIELDS we render it but don't persist separately. -->
              </div>
            </div>

            <!-- ── Q2: Hybrid varieties (uniformity) ── -->
            <!--
              legacy: assessment_4_2_question_2
              "Do these Test Guidelines cover hybrid varieties?"
              JSP: hybridVariety  →  ALLOWED: IsHybridVariety
            -->
            <div
              style="display: flex; flex-direction: column; gap: 8px; padding: 10px 14px;
                     border: 2px solid #CEDD80; border-radius: 12px"
            >
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">
                <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800); flex: 1">
                  Do these Test Guidelines cover hybrid varieties?
                </label>
                <RadioGroup
                  :model-value="s('IsHybridVariety')"
                  direction="horizontal"
                  @update:model-value="setRadio('IsHybridVariety', $event)"
                >
                  <RadioOption value="Y" label="Yes" />
                  <RadioOption value="N" label="No" />
                </RadioGroup>
              </div>

              <!-- ASW 8(b) — visible when hybridVariety = Y -->
              <!-- legacy: assessment_ASW_8_b in #asw8b_text -->
              <div
                v-if="s('IsHybridVariety') === 'Y'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                       padding: 6px 10px; background: var(--color-neutral-100); border-radius: 4px"
              >
                The assessment of uniformity for hybrid varieties depends on the type of hybrid
                and should be according to the recommendations for hybrid varieties in the
                General Introduction.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">
                  <i>(ASW 8(b))</i>
                </a>
              </div>
            </div>

            <!-- ── Q3: Parent formula ── -->
            <!--
              legacy: assessment_4_2_question_3
              "Do these Test Guidelines cover uniformity assessment where the parent formula is used?"
              JSP: uniformityAssessmentParentFormula  →  ALLOWED: UniformityAssessmentSameSample
            -->
            <div
              style="display: flex; flex-direction: column; gap: 8px; padding: 10px 14px;
                     border: 2px solid #CEDD80; border-radius: 12px"
            >
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">
                <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800); flex: 1">
                  Do these Test Guidelines cover uniformity assessment where the parent formula is used?
                </label>
                <RadioGroup
                  :model-value="s('UniformityAssessmentSameSample')"
                  direction="horizontal"
                  @update:model-value="setRadio('UniformityAssessmentSameSample', $event)"
                >
                  <RadioOption value="Y" label="Yes" />
                  <RadioOption value="N" label="No" />
                </RadioGroup>
              </div>

              <!-- ASW 8(e) — visible when Y -->
              <!-- legacy: assessment_ASW_8_e in #asw8e_text -->
              <div
                v-if="s('UniformityAssessmentSameSample') === 'Y'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                       padding: 6px 10px; background: var(--color-neutral-100); border-radius: 4px"
              >
                Where the assessment of a hybrid variety involves the parent lines, the uniformity
                of the hybrid variety should, in addition to an examination of the hybrid variety
                itself, also be assessed by examination of the uniformity of its parent lines.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">
                  <i>(ASW 8(e))</i>
                </a>
              </div>
            </div>

            <!-- ── Q4: Uniformity by off-types (same sample size) ── -->
            <!--
              legacy: assessment_4_2_question_4
              JSP: uniformityAssessmentSameSample (TGCoveringOnlyVarieties / TGCoveringOtherTypeOfVarieties)
              →  ALLOWED: UniformityAssessmentDifferentSample (Y/N)
            -->
            <div
              style="display: flex; flex-direction: column; gap: 8px; padding: 10px 14px;
                     border: 2px solid #CEDD80; border-radius: 12px"
            >
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">
                <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800); flex: 1">
                  Do these Test Guidelines cover uniformity assessment by off-type(s)
                  (all characteristics observed on the same sample size)?
                </label>
                <RadioGroup
                  :model-value="s('UniformityAssessmentDifferentSample')"
                  direction="horizontal"
                  @update:model-value="setRadio('UniformityAssessmentDifferentSample', $event)"
                >
                  <RadioOption value="Y" label="Yes" />
                  <RadioOption value="N" label="No" />
                </RadioGroup>
              </div>
            </div>

          </div>
        </SectionAccordion>

        <!-- ══════════════════════════════════════════════════
             4.3  STABILITY
        ══════════════════════════════════════════════════ -->
        <SectionAccordion number="4.3" title="Stability">
          <div style="display: flex; flex-direction: column; gap: 16px">

            <!-- ── Stability assessment: general ── -->
            <!-- legacy: assessment_4_3_subtitle_1 -->
            <div style="display: flex; flex-direction: column; gap: 10px">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
                Stability assessment: general
                <span style="color: #D32F2F"> *</span>
              </h3>

              <!--
                legacy: tgCovering radio  →  ALLOWED: TGCovering
                values: SeedVegetative / Seed / Vegetative
              -->
              <RadioGroup
                :model-value="s('TGCovering')"
                direction="vertical"
                @update:model-value="setRadio('TGCovering', $event)"
              >
                <RadioOption
                  value="SeedVegetative"
                  label="Test Guidelines covering seed-propagated and vegetatively propagated varieties"
                />
                <RadioOption
                  value="Seed"
                  label="Test Guidelines covering only seed-propagated varieties"
                />
                <RadioOption
                  value="Vegetative"
                  label="Test Guidelines covering only vegetatively propagated varieties"
                />
              </RadioGroup>

              <!-- ASW 9(a) -->
              <div
                v-if="s('TGCovering') === 'SeedVegetative'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                       padding: 6px 10px; background: var(--color-neutral-100); border-radius: 4px"
              >
                Where appropriate, or in cases of doubt, stability may be further examined by
                testing a new seed stock to ensure that it exhibits the same characteristics as
                those shown by the initial material supplied.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px"><i>(ASW 9(a))</i></a>
              </div>
              <!-- ASW 9(b) -->
              <div
                v-else-if="s('TGCovering') === 'Seed'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                       padding: 6px 10px; background: var(--color-neutral-100); border-radius: 4px"
              >
                Where appropriate, or in cases of doubt, stability may be further examined by
                testing a new seed stock to ensure that it exhibits the same characteristics as
                those shown by the initial material supplied.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px"><i>(ASW 9(b))</i></a>
              </div>
              <!-- ASW 9(c) -->
              <div
                v-else-if="s('TGCovering') === 'Vegetative'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                       padding: 6px 10px; background: var(--color-neutral-100); border-radius: 4px"
              >
                Where appropriate, or in cases of doubt, stability may be further examined by
                testing a new plant stock to ensure that it exhibits the same characteristics as
                those shown by the initial material supplied.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px"><i>(ASW 9(c))</i></a>
              </div>
            </div>

            <!-- ── Stability assessment: hybrid varieties ── -->
            <!-- legacy: assessment_4_3_subtitle_2 + assessment_4_3_question -->
            <div style="display: flex; flex-direction: column; gap: 10px">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
                Stability assessment: hybrid varieties
              </h3>

              <!--
                legacy: parentLineAssessed  →  ALLOWED: IsParentLineAssessed
              -->
              <div
                style="display: flex; flex-direction: column; gap: 8px; padding: 10px 14px;
                       border: 2px solid #CEDD80; border-radius: 12px"
              >
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">
                  <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800); flex: 1">
                    Does uniformity and stability of parent lines need to be assessed?
                    <span style="color: #D32F2F"> *</span>
                  </label>
                  <RadioGroup
                    :model-value="s('IsParentLineAssessed')"
                    direction="horizontal"
                    @update:model-value="setRadio('IsParentLineAssessed', $event)"
                  >
                    <RadioOption value="Y" label="Yes" />
                    <RadioOption value="N" label="No" />
                  </RadioGroup>
                </div>

                <!-- ASW 10 — visible when parentLineAssessed = Y -->
                <div
                  v-if="s('IsParentLineAssessed') === 'Y'"
                  style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                         padding: 6px 10px; background: var(--color-neutral-100); border-radius: 4px"
                >
                  Where appropriate, or in cases of doubt, the stability of a hybrid variety may,
                  in addition to an examination of the hybrid variety itself, also be assessed by
                  examination of the uniformity and stability of its parent lines.
                  <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">
                    <i>(ASW 10)</i>
                  </a>
                </div>
              </div>
            </div>

            <!-- Additional stability information -->
            <!--
              legacy: stabilityAddInfo textarea (Add/Remove Paragraph)  →  ALLOWED: StabilityAddInfo
            -->
            <div style="display: flex; flex-direction: column; gap: 6px">
              <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
                Additional information on stability
                <span style="font-size: 12px; font-weight: 400; color: var(--color-neutral-500)"> (optional)</span>
              </label>
              <Editor
                :model-value="s('StabilityAddInfo')"
                :api-key="apiKey"
                :init="init"
                @update:model-value="onFieldChange('StabilityAddInfo', $event)"
              />
            </div>

          </div>
        </SectionAccordion>

      </div>
    </template>

    <!-- Preview pane -->
    <div v-if="previewError" style="color: #D32F2F; font-size: 13px">⚠ {{ previewError }}</div>
    <div v-else-if="previewHtml" v-html="previewHtml" />
  </ChapterPreview>
</template>