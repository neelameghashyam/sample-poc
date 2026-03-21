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
  useChapterPreview('04');

// ── Null-safe data accessor ───────────────────────────────────────────────────
// The store loads data asynchronously. Until it arrives every field is null/undefined.
// All field reads MUST use ?? '' (not || '') so 'N' and '0' are not coerced away.
const data = computed(() => store.chapters['04'] ?? {});

function onFieldChange(field: string, value: string | null | undefined) {
  store.autosave('04', field, value ?? '');
  markDirty();
}

function setRadio(field: string, value: string) {
  onFieldChange(field, value);
}

// ── SinglePlant helpers ───────────────────────────────────────────────────────
// DB stores as "first;second" e.g. "20;2"
// DB column: SinglePlant  →  ALLOWED_FIELDS: SinglePlant
function spFirst(): string  { return (data.value.SinglePlant ?? '').split(';')[0] ?? ''; }
function spSecond(): string { return (data.value.SinglePlant ?? '').split(';')[1] ?? ''; }
function setSpFirst(v: string)  { onFieldChange('SinglePlant', v + ';' + spSecond()); }
function setSpSecond(v: string) { onFieldChange('SinglePlant', spFirst() + ';' + v); }

// ── Null-safe string getter ───────────────────────────────────────────────────
function str(field: string): string {
  const v = data.value[field];
  return v == null ? '' : String(v);
}
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

        <h2 style="font-size: 18px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
          4. Assessment of Distinctness, Uniformity and Stability
        </h2>

        <!-- ══════════════════════════════════════════════════════
             4.1  DISTINCTNESS
        ══════════════════════════════════════════════════════ -->
        <SectionAccordion number="4.1" title="Distinctness" :open="true">
          <div style="display: flex; flex-direction: column; gap: 20px">

            <!-- GN 10.2 reference link -->
            <Links :links="[
              { text: 'Number of Plants / Parts of Plants to be Examined (for distinctness) (GN 10.2)' }
            ]" />

            <!-- ── General Recommendations ── -->
            <!-- legacy: assessment_4_1_subtitle_1 -->
            <div style="display: flex; flex-direction: column; gap: 12px">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
                General Recommendations
              </h3>

              <!--
                legacy: assessment_4_1_question_1
                "Do these Test Guidelines cover hybrid varieties?"
                JSP: path="isHybridVarietyGuideline"  radio name="hvop"
                DB column → ALLOWED_FIELDS: IsHybridVariety
                FIX: str('IsHybridVariety') ensures null → '' not 'null'
              -->
              <div style="display: flex; flex-direction: column; gap: 6px">
                <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                  Do these Test Guidelines cover hybrid varieties?
                  <span style="color: #D32F2F"> *</span>
                </label>
                <RadioGroup
                  :model-value="str('IsHybridVariety')"
                  direction="horizontal"
                  @update:model-value="setRadio('IsHybridVariety', $event)"
                >
                  <RadioOption value="Y" label="Yes" />
                  <RadioOption value="N" label="No" />
                </RadioGroup>
              </div>

              <!-- Nested block — visible when IsHybridVariety = Y -->
              <div
                v-if="str('IsHybridVariety') === 'Y'"
                style="display: flex; flex-direction: column; gap: 10px; padding: 10px 14px;
                       border-left: 3px solid var(--color-primary-300); background: var(--color-neutral-50)"
              >
                <!--
                  legacy: assessment_4_1_subquestion_1
                  "In the case of hybrids, is the parent formula used?"
                  JSP: path="hybridParentFormula"  radio name="hpfu"
                  DB column → ALLOWED_FIELDS: IsHybridParentFormula
                -->
                <div style="display: flex; flex-direction: column; gap: 6px">
                  <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                    In the case of hybrids, is the parent formula used?
                    <span style="color: #D32F2F"> *</span>
                  </label>
                  <RadioGroup
                    :model-value="str('IsHybridParentFormula')"
                    direction="horizontal"
                    @update:model-value="setRadio('IsHybridParentFormula', $event)"
                  >
                    <RadioOption value="Y" label="Yes" />
                    <RadioOption value="N" label="No" />
                  </RadioGroup>
                </div>

                <!--
                  ASW 7(a) text block
                  legacy: #asw7a_text via fetchASW('ASW7_a')
                  visible when IsHybridParentFormula = Y
                -->
                <div
                  v-if="str('IsHybridParentFormula') === 'Y'"
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
                  Additional info for hybrid distinctness
                  legacy: distinctnessHybridAddInfo textarea
                  DB column → ALLOWED_FIELDS: DistinctnessAddInfo
                  FIX: str('DistinctnessAddInfo') prevents null being passed to TinyMCE
                -->
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 2px">
                  <label style="font-size: 13px; font-weight: 600; color: var(--color-neutral-700)">
                    Additional information on assessment of distinctness in case of hybrid varieties
                    <span style="font-weight: 400; color: var(--color-neutral-500)"> (optional)</span>
                  </label>
                  <Editor
                    :model-value="str('DistinctnessAddInfo')"
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
                JSP: path="isOneMethodOfPropogation"  radio name="mop"
                DB column → ALLOWED_FIELDS: IsOneMethodOfPropogation
              -->
              <div style="display: flex; flex-direction: column; gap: 6px">
                <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                  Is there more than one method of propagation?
                  <span style="color: #D32F2F"> *</span>
                </label>
                <RadioGroup
                  :model-value="str('IsOneMethodOfPropogation')"
                  direction="horizontal"
                  @update:model-value="setRadio('IsOneMethodOfPropogation', $event)"
                >
                  <RadioOption value="Y" label="Yes" />
                  <RadioOption value="N" label="No" />
                </RadioGroup>
              </div>

              <!--
                When NO — single method:
                legacy: assessment_4_1_case_part2_one_plants … part4_plants
                "Unless otherwise indicated, for the purpose of distinctness, all observations
                 on single plants should be made on [X] plants or parts taken from each of
                 [Y] plants and any other observations made on all plants in the test,
                 disregarding any off-type plants."
                JSP fields: numberOfPlantsFirst → spFirst()
                            numberOfPlantsSecond → spSecond()
                DB column → ALLOWED_FIELDS: SinglePlant  (stored "first;second")
                FIX: spFirst()/spSecond() use nullish coalescing so null → ''
              -->
              <div
                v-if="str('IsOneMethodOfPropogation') === 'N'"
                style="display: flex; flex-direction: column; gap: 10px; padding: 10px 14px;
                       border-left: 3px solid var(--color-primary-300); background: var(--color-neutral-50)"
              >
                <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 1.7; margin: 0">
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
                  "Are observations made on parts taken from single plants?"
                  JSP: path="isPartsOfSinglePlants"
                  DB column → ALLOWED_FIELDS: IsPartsOfSinglePlants
                -->
                <div style="display: flex; flex-direction: column; gap: 6px">
                  <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                    Are observations made on parts taken from single plants?
                  </label>
                  <RadioGroup
                    :model-value="str('IsPartsOfSinglePlants')"
                    direction="horizontal"
                    @update:model-value="setRadio('IsPartsOfSinglePlants', $event)"
                  >
                    <RadioOption value="Y" label="Yes" />
                    <RadioOption value="N" label="No" />
                  </RadioGroup>

                  <!--
                    ASW 7(b) — visible when IsPartsOfSinglePlants = Y
                    legacy: assessment_ASW_7_b_part1_plants + numberOfPartsOfPlant input
                    JSP field: numberOfPartsOfPlant  →  ALLOWED_FIELDS: PartsPlant
                    FIX: str('PartsPlant') prevents null → ''
                  -->
                  <div
                    v-if="str('IsPartsOfSinglePlants') === 'Y'"
                    style="font-size: 14px; color: var(--color-neutral-800); line-height: 1.7;
                           padding: 8px 10px; background: var(--color-neutral-100); border-radius: 4px"
                  >
                    In the case of observations of parts taken from single plants, the number of
                    parts to be taken from each of the plants should be
                    <Input
                      :model-value="str('PartsPlant')"
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

              <!--
                When YES — multiple propagation methods:
                legacy: assessment_4_1_case_part1 + part2_plants + part3_plants + part4_plants
                "In the case of [method], unless otherwise indicated, for the purpose of
                 distinctness, all observations on single plants should be made on [X] plants
                 or parts taken from each of [Y] plants …"
                JSP fields: propogationMethodName, numberOfPlantsFirst, numberOfPlantsSecond
                DB column → ALLOWED_FIELDS: SinglePlant, IsPartsOfSinglePlants, PartsPlant
                NOTE: legacy supports multiple repeating method rows; we expose the first set.
                      propagationMethods from store.propagationMethods.assessment can extend this.
              -->
              <div
                v-if="str('IsOneMethodOfPropogation') === 'Y'"
                style="display: flex; flex-direction: column; gap: 10px; padding: 10px 14px;
                       border-left: 3px solid var(--color-primary-300); background: var(--color-neutral-50)"
              >
                <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 1.7; margin: 0">
                  In the case of
                  <Input
                    :model-value="(data.SinglePlant ?? '').split(';')[2] ?? ''"
                    placeholder="(propagation method)"
                    size="small"
                    style="display: inline-block; width: 180px; margin: 0 4px"
                    @update:model-value="
                      onFieldChange('SinglePlant', spFirst() + ';' + spSecond() + ';' + $event)
                    "
                  />
                  , unless otherwise indicated, for the purpose of distinctness, all observations
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

                <div style="display: flex; flex-direction: column; gap: 6px">
                  <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                    Are observations made on parts taken from single plants?
                  </label>
                  <RadioGroup
                    :model-value="str('IsPartsOfSinglePlants')"
                    direction="horizontal"
                    @update:model-value="setRadio('IsPartsOfSinglePlants', $event)"
                  >
                    <RadioOption value="Y" label="Yes" />
                    <RadioOption value="N" label="No" />
                  </RadioGroup>
                  <div
                    v-if="str('IsPartsOfSinglePlants') === 'Y'"
                    style="font-size: 14px; color: var(--color-neutral-800); line-height: 1.7;
                           padding: 8px 10px; background: var(--color-neutral-100); border-radius: 4px"
                  >
                    In the case of observations of parts taken from single plants, the number of
                    parts to be taken from each of the plants should be
                    <Input
                      :model-value="str('PartsPlant')"
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
            </div>

          </div>
        </SectionAccordion>

        <!-- ══════════════════════════════════════════════════════
             4.2  UNIFORMITY
        ══════════════════════════════════════════════════════ -->
        <SectionAccordion number="4.2" title="Uniformity">
          <div style="display: flex; flex-direction: column; gap: 20px">

            <!--
              legacy: assessment_4_2_part1 + typeOfPropagationInput + assessment_4_2_part2
              JSP path: typeOfPropagation  →  ALLOWED_FIELDS: typeOfPropagation
              FIX: str('typeOfPropagation') prevents null
            -->
            <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 1.7; margin: 0">
              Please don't complete the following sentence if it is not applicable.
              These Test Guidelines have been developed for the examination of
              <Input
                :model-value="str('typeOfPropagation')"
                placeholder="(variety type)"
                size="small"
                style="display: inline-block; width: 220px; margin: 0 4px"
                @update:model-value="onFieldChange('typeOfPropagation', $event)"
              />
              . For varieties with other types of propagation the recommendation in the General
              Introduction and document TGP/13 "Guidance for new types and species", Section 4.5
              Testing Uniformity should be followed.
            </p>

            <!-- ── Q1: Cross-pollinated varieties ── -->
            <!--
              legacy: assessment_4_2_question_1
              "Do these Test Guidelines cover cross-pollinated varieties?"
              JSP path: isCrossPollinatedVariety  →  ALLOWED_FIELDS: IsHybridVarietyGuideline
              FIX: str('IsHybridVarietyGuideline') not data.IsHybridVarietyGuideline
            -->
            <div style="display: flex; flex-direction: column; gap: 6px">
              <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                Do these Test Guidelines cover cross-pollinated varieties?
              </label>
              <RadioGroup
                :model-value="str('IsHybridVarietyGuideline')"
                direction="horizontal"
                @update:model-value="setRadio('IsHybridVarietyGuideline', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>

              <!-- Sub-options when cross-pollinated = Y -->
              <div
                v-if="str('IsHybridVarietyGuideline') === 'Y'"
                style="display: flex; flex-direction: column; gap: 10px; padding: 10px 14px;
                       border-left: 3px solid var(--color-primary-300); background: var(--color-neutral-50); margin-top: 4px"
              >
                <!--
                  legacy: assessment_4_2_option_1 / option_2
                  JSP path: crossPolinattedVarieties  →  ALLOWED_FIELDS: CrossPolinattedVarieties
                  values: crosspollinatedonly / crosspollinatedwithotherpropagation
                -->
                <RadioGroup
                  :model-value="str('CrossPolinattedVarieties')"
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

                <!-- ASW 8(a)(i) — legacy: assessment_ASW_8_a_i -->
                <div
                  v-if="str('CrossPolinattedVarieties') === 'crosspollinatedonly'"
                  style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                         padding: 8px 10px; background: var(--color-neutral-100); border-radius: 4px"
                >
                  The assessment of uniformity should be according to the recommendations for
                  cross-pollinated varieties in the General Introduction.
                  <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">
                    <i>(ASW 8(a)(i))</i>
                  </a>
                </div>

                <!-- ASW 8(a)(ii) — legacy: assessment_ASW_8_a_ii_part1 + typesOfVariety + part2 -->
                <div
                  v-if="str('CrossPolinattedVarieties') === 'crosspollinatedwithotherpropagation'"
                  style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.7;
                         padding: 8px 10px; background: var(--color-neutral-100); border-radius: 4px"
                >
                  The assessment of uniformity for
                  <Input
                    :model-value="str('typeOfPropagation')"
                    placeholder="(variety type)"
                    size="small"
                    style="display: inline-block; width: 160px; margin: 0 4px"
                    @update:model-value="onFieldChange('typeOfPropagation', $event)"
                  />
                  should be according to the recommendations for cross-pollinated varieties
                  in the General Introduction.
                  <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">
                    <i>(ASW 8(a)(ii))</i>
                  </a>
                </div>
              </div>
            </div>

            <!-- ── Q2: Hybrid varieties ── -->
            <!--
              legacy: assessment_4_2_question_2
              "Do these Test Guidelines cover hybrid varieties?"
              JSP path: hybridVariety  →  ALLOWED_FIELDS: IsHybridVariety
            -->
            <div style="display: flex; flex-direction: column; gap: 6px">
              <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                Do these Test Guidelines cover hybrid varieties?
              </label>
              <RadioGroup
                :model-value="str('IsHybridVariety')"
                direction="horizontal"
                @update:model-value="setRadio('IsHybridVariety', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>

              <!-- ASW 8(b) — legacy: assessment_ASW_8_b, visible when hybridVariety = Y -->
              <div
                v-if="str('IsHybridVariety') === 'Y'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                       padding: 8px 10px; background: var(--color-neutral-100); border-radius: 4px; margin-top: 4px"
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
              JSP path: uniformityAssessmentParentFormula  →  ALLOWED_FIELDS: UniformityAssessmentSameSample
            -->
            <div style="display: flex; flex-direction: column; gap: 6px">
              <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                Do these Test Guidelines cover uniformity assessment where the parent formula is used?
              </label>
              <RadioGroup
                :model-value="str('UniformityAssessmentSameSample')"
                direction="horizontal"
                @update:model-value="setRadio('UniformityAssessmentSameSample', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>

              <!-- ASW 8(e) — legacy: assessment_ASW_8_e, visible when Y -->
              <div
                v-if="str('UniformityAssessmentSameSample') === 'Y'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                       padding: 8px 10px; background: var(--color-neutral-100); border-radius: 4px; margin-top: 4px"
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
              "Do these Test Guidelines cover uniformity assessment by off-type(s)
               (all characteristics observed on the same sample size)?"
              JSP path: uniformityAssessmentSameSample
                values in legacy: TGCoveringOnlyVarieties / TGCoveringOtherTypeOfVarieties
              →  ALLOWED_FIELDS: UniformityAssessmentDifferentSample  (Y / N)
            -->
            <div style="display: flex; flex-direction: column; gap: 6px">
              <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                Do these Test Guidelines cover uniformity assessment by off-type(s)
                (all characteristics observed on the same sample size)?
              </label>
              <RadioGroup
                :model-value="str('UniformityAssessmentDifferentSample')"
                direction="horizontal"
                @update:model-value="setRadio('UniformityAssessmentDifferentSample', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>
            </div>

          </div>
        </SectionAccordion>

        <!-- ══════════════════════════════════════════════════════
             4.3  STABILITY
        ══════════════════════════════════════════════════════ -->
        <SectionAccordion number="4.3" title="Stability">
          <div style="display: flex; flex-direction: column; gap: 20px">

            <!-- ── Stability assessment: general ── -->
            <!--
              legacy: assessment_4_3_subtitle_1 = "Stability assessment: general"
              JSP path: tgCovering  →  ALLOWED_FIELDS: TGCovering
              values: SeedVegetative / Seed / Vegetative
              FIX: str('TGCovering') prevents null breaking radio selection
            -->
            <div style="display: flex; flex-direction: column; gap: 10px">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
                Stability assessment: general
                <span style="color: #D32F2F"> *</span>
              </h3>
              <RadioGroup
                :model-value="str('TGCovering')"
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

              <!-- ASW 9(a) — legacy: assessment_ASW_9_a, SeedVegetative -->
              <div
                v-if="str('TGCovering') === 'SeedVegetative'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                       padding: 8px 10px; background: var(--color-neutral-100); border-radius: 4px"
              >
                Where appropriate, or in cases of doubt, stability may be further examined by
                testing a new seed stock to ensure that it exhibits the same characteristics as
                those shown by the initial material supplied.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">
                  <i>(ASW 9(a))</i>
                </a>
              </div>

              <!-- ASW 9(b) — legacy: assessment_ASW_9_b, Seed only -->
              <div
                v-else-if="str('TGCovering') === 'Seed'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                       padding: 8px 10px; background: var(--color-neutral-100); border-radius: 4px"
              >
                Where appropriate, or in cases of doubt, stability may be further examined by
                testing a new seed stock to ensure that it exhibits the same characteristics as
                those shown by the initial material supplied.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">
                  <i>(ASW 9(b))</i>
                </a>
              </div>

              <!-- ASW 9(c) — legacy: assessment_ASW_9_c_plants, Vegetative -->
              <div
                v-else-if="str('TGCovering') === 'Vegetative'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                       padding: 8px 10px; background: var(--color-neutral-100); border-radius: 4px"
              >
                Where appropriate, or in cases of doubt, stability may be further examined by
                testing a new plant stock to ensure that it exhibits the same characteristics as
                those shown by the initial material supplied.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">
                  <i>(ASW 9(c))</i>
                </a>
              </div>
            </div>

            <!-- ── Stability assessment: hybrid varieties ── -->
            <!--
              legacy: assessment_4_3_subtitle_2 = "Stability assessment: hybrid varieties"
              assessment_4_3_question:
              "Does uniformity and stability of parent lines need to be assessed?"
              JSP path: parentLineAssessed  →  ALLOWED_FIELDS: IsParentLineAssessed
              FIX: str('IsParentLineAssessed') prevents null
            -->
            <div style="display: flex; flex-direction: column; gap: 10px">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
                Stability assessment: hybrid varieties
              </h3>

              <div style="display: flex; flex-direction: column; gap: 6px">
                <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                  Does uniformity and stability of parent lines need to be assessed?
                  <span style="color: #D32F2F"> *</span>
                </label>
                <RadioGroup
                  :model-value="str('IsParentLineAssessed')"
                  direction="horizontal"
                  @update:model-value="setRadio('IsParentLineAssessed', $event)"
                >
                  <RadioOption value="Y" label="Yes" />
                  <RadioOption value="N" label="No" />
                </RadioGroup>

                <!-- ASW 10 — legacy: assessment_ASW_10, visible when parentLineAssessed = Y -->
                <div
                  v-if="str('IsParentLineAssessed') === 'Y'"
                  style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                         padding: 8px 10px; background: var(--color-neutral-100); border-radius: 4px; margin-top: 4px"
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
              legacy: stabilityAddInfo textarea (togglable via Add/Remove Paragraph)
              DB column → ALLOWED_FIELDS: StabilityAddInfo
              FIX: str('StabilityAddInfo') prevents null crashing TinyMCE
            -->
            <div style="display: flex; flex-direction: column; gap: 6px">
              <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
                Additional information on stability
                <span style="font-size: 12px; font-weight: 400; color: var(--color-neutral-500)"> (optional)</span>
              </label>
              <Editor
                :model-value="str('StabilityAddInfo')"
                :api-key="apiKey"
                :init="init"
                @update:model-value="onFieldChange('StabilityAddInfo', $event)"
              />
            </div>

          </div>
        </SectionAccordion>

      </div>
    </template>

    <!-- Preview slot (right-hand pane in ChapterPreview split view) -->
    <div v-if="previewError" style="color: #D32F2F; font-size: 13px">⚠ {{ previewError }}</div>
    <div v-else-if="previewHtml" v-html="previewHtml" />
  </ChapterPreview>
</template>