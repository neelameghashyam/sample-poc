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

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 200 });
const { previewHtml, previewLoading, previewError, needsRefresh, markDirty, handleRefresh } =
  useChapterPreview('04');

// ── Null-safe data accessor ───────────────────────────────────────────────────
// DB returns null for unset fields. Using ?? '' prevents null being passed to
// RadioGroup/Input which causes values to not display even when data exists.
const data = computed(() => store.chapters['04'] ?? {});

function s(field: string): string {
  const v = (data.value as any)[field];
  return v == null ? '' : String(v);
}

// ── Scalar field autosave ─────────────────────────────────────────────────────
function onFieldChange(field: string, value: string | null | undefined) {
  store.autosave('04', field, value ?? '');
  markDirty();
}
function setRadio(field: string, value: string) {
  onFieldChange(field, value);
}

// ── SinglePlant helpers (TG_Assessment.SinglePlant stored as "first;second") ─
function spFirst(): string  { return s('SinglePlant').split(';')[0] ?? ''; }
function spSecond(): string { return s('SinglePlant').split(';')[1] ?? ''; }
function setSpFirst(v: string)  { onFieldChange('SinglePlant', v + ';' + spSecond()); }
function setSpSecond(v: string) { onFieldChange('SinglePlant', spFirst() + ';' + v); }

// ── typeOfPropagation display ─────────────────────────────────────────────────
// DB: typeOfPropagation = "" when set via autocomplete dropdown,
//     OtherTypeOfPropagation = "Bseed-propagated varieties…" (the B prefix is stripped
//     in legacy by taking substring(1)).
// We show typeOfPropagation first; fall back to OtherTypeOfPropagation minus the prefix char.
function getTypeOfPropagation(): string {
  const main = s('typeOfPropagation');
  if (main) return main;
  const other = s('OtherTypeOfPropagation');
  return other.length > 1 ? other.substring(1) : other;
}

// ── Assessment propagation methods ────────────────────────────────────────────
// Loaded from store.propagationMethods.assessment
// Real DB columns (verified from API response):
//   AssesmentMethodPropogation_ID, Assessment_ID
//   PropogationMethod          — empty when autocomplete used
//   OtherPropogationMethodInfo — "Aseed-propagated varieties" (A prefix = other)
//   NumberOfPlants             — "10;7" (plantsFirst;plantsSecond)
//   NumberOfPartsOfPlants      — number of parts
//   isPartsOfSinglePlants      — "Y"/"N" (lowercase i)
const propMethods = computed(() => store.propagationMethods?.assessment ?? []);

// Get display name: OtherPropogationMethodInfo without prefix char, or PropogationMethod
function pmName(pm: any): string {
  if (pm.OtherPropogationMethodInfo?.length > 1) return pm.OtherPropogationMethodInfo.substring(1);
  return pm.PropogationMethod ?? '';
}
function pmFirst(pm: any): string  { return (pm.NumberOfPlants ?? '').split(';')[0] ?? ''; }
function pmSecond(pm: any): string { return (pm.NumberOfPlants ?? '').split(';')[1] ?? ''; }

const addingPropMethod = ref(false);

async function addPropMethod() {
  if (addingPropMethod.value || !store.tgId) return;
  addingPropMethod.value = true;
  try {
    const row = await editorApi.createExamPropMethod(store.tgId, '04', {
      PropogationMethod: '',
      OtherPropogationMethodInfo: '',
      NumberOfPlants: ';',
      NumberOfPartsOfPlants: '',
      isPartsOfSinglePlants: 'N',
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
    (m: any) => m.AssesmentMethodPropogation_ID !== pmId
  );
  markDirty();
}

async function updatePmField(pm: any, field: string, value: string) {
  pm[field] = value;
  if (!store.tgId) return;
  await editorApi.updateExamPropMethod(store.tgId, '04', pm.AssesmentMethodPropogation_ID, {
    [field]: value,
  });
  markDirty();
}

function setPmFirst(pm: any, v: string) {
  updatePmField(pm, 'NumberOfPlants', v + ';' + pmSecond(pm));
}
function setPmSecond(pm: any, v: string) {
  updatePmField(pm, 'NumberOfPlants', pmFirst(pm) + ';' + v);
}
function setPmName(pm: any, v: string) {
  // Always save to OtherPropogationMethodInfo to match legacy behaviour
  updatePmField(pm, 'OtherPropogationMethodInfo', v);
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

        <!-- ══════════════════════════════════════════════════════════
             4.1  DISTINCTNESS
        ══════════════════════════════════════════════════════════ -->
        <SectionAccordion number="4.1" title="Distinctness" :open="true">
          <div style="display: flex; flex-direction: column; gap: 20px">

            <!-- ── General Recommendations ── -->
            <div style="display: flex; flex-direction: column; gap: 12px">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
                General Recommendations
              </h3>

              <!--
                legacy: assessment_4_1_question_1 — "Do these Test Guidelines cover hybrid varieties?"
                DB field: IsHybridVariety  (from API: "Y")
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

              <!-- Sub-block when IsHybridVariety = Y -->
              <div
                v-if="s('IsHybridVariety') === 'Y'"
                style="display: flex; flex-direction: column; gap: 10px; padding: 10px 14px;
                       border-left: 3px solid #CEDD80; background: var(--color-neutral-50)"
              >
                <!--
                  legacy: assessment_4_1_subquestion_1 — "In the case of hybrids, is the parent formula used?"
                  DB field: IsHybridParentFormula  (from API: "Y")
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

                <!-- ASW 7(a) — shown when IsHybridParentFormula = Y -->
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
                  Additional distinctness info for hybrid varieties
                  DB field: DistinctnessAddInfo  (from API: "<p>test 4.1.4</p>")
                  Note: legacy used DistinctnessHybridAddInfo separately; in new schema
                  this maps to DistinctnessAddInfo which IS in ALLOWED_FIELDS
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
            <div style="display: flex; flex-direction: column; gap: 12px">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
                Number of plants / Parts of plants to be Examined
              </h3>

              <!--
                legacy: assessment_4_1_question_2 — "Is there more than one method of propagation?"
                DB field: IsOneMethodOfPropogation  (from API: "Y")
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
                DB fields: SinglePlant = " ; " (first;second), IsPartsOfSinglePlants, PartsPlant
                spFirst()/spSecond() split "10;7" → "10" and "7"
              -->
              <div
                v-if="s('IsOneMethodOfPropogation') === 'N'"
                style="display: flex; flex-direction: column; gap: 10px; padding: 10px 14px;
                       border: 2px solid #CEDD80; border-radius: 12px; background: var(--color-neutral-50)"
              >
                <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 1.8; margin: 0">
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

                <!-- Are observations made on parts taken from single plants? -->
                <!--  DB: IsPartsOfSinglePlants (from API: "N") -->
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
                  <!-- ASW 7(b) — visible when IsPartsOfSinglePlants = Y -->
                  <!-- DB: PartsPlant -->
                  <div
                    v-if="s('IsPartsOfSinglePlants') === 'Y'"
                    style="font-size: 14px; color: var(--color-neutral-800); line-height: 1.8;
                           padding: 8px 10px; background: var(--color-neutral-100); border-radius: 4px"
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

              <!-- ── When YES — multiple propagation methods (dynamic rows) ── -->
              <!--
                Loaded from store.propagationMethods.assessment
                Real fields from API response:
                  AssesmentMethodPropogation_ID: 4365
                  OtherPropogationMethodInfo: "Aseed-propagated varieties"  ← display name (strip first char)
                  NumberOfPlants: "10;7"  ← plantsFirst;plantsSecond
                  NumberOfPartsOfPlants: ""
                  isPartsOfSinglePlants: "N"  ← lowercase i
              -->
              <div
                v-if="s('IsOneMethodOfPropogation') === 'Y'"
                style="display: flex; flex-direction: column; gap: 10px"
              >
                <!-- Repeating rows -->
                <div
                  v-for="(pm, idx) in propMethods"
                  :key="pm.AssesmentMethodPropogation_ID"
                  style="display: flex; flex-direction: column; gap: 8px; padding: 10px 14px;
                         border: 2px solid #CEDD80; border-radius: 12px; background: var(--color-neutral-50)"
                >
                  <!-- Green separator between rows (legacy hr) -->
                  <div
                    v-if="idx > 0"
                    style="height: 4px; background: #CEDD80; border-radius: 2px; margin-bottom: 4px"
                  />

                  <!-- Sentence: "In the case of [method], unless otherwise..." -->
                  <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 1.8; margin: 0">
                    In the case of
                    <Input
                      :model-value="pmName(pm)"
                      placeholder="(propagation method)"
                      size="small"
                      style="display: inline-block; width: 210px; margin: 0 4px"
                      @update:model-value="setPmName(pm, $event)"
                    />
                    , unless otherwise indicated, for the purpose of distinctness, all
                    observations on single plants should be made on
                    <Input
                      :model-value="pmFirst(pm)"
                      placeholder="(number)"
                      size="small"
                      style="display: inline-block; width: 65px; margin: 0 4px"
                      @update:model-value="setPmFirst(pm, $event)"
                    />
                    plants or parts taken from each of
                    <Input
                      :model-value="pmSecond(pm)"
                      placeholder="(number)"
                      size="small"
                      style="display: inline-block; width: 65px; margin: 0 4px"
                      @update:model-value="setPmSecond(pm, $event)"
                    />
                    plants and any other observations made on all plants in the test,
                    disregarding any off-type plants.
                  </p>

                  <!-- Are observations made on parts taken from single plants? -->
                  <!-- DB: isPartsOfSinglePlants (lowercase i — real column name) -->
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
                    <label style="font-size: 14px; font-weight: 500; color: var(--color-neutral-800)">
                      Are observations made on parts taken from single plants?
                    </label>
                    <RadioGroup
                      :model-value="pm.isPartsOfSinglePlants ?? 'N'"
                      direction="horizontal"
                      @update:model-value="updatePmField(pm, 'isPartsOfSinglePlants', $event)"
                    >
                      <RadioOption value="Y" label="Yes" />
                      <RadioOption value="N" label="No" />
                    </RadioGroup>
                  </div>

                  <!-- Parts count — when isPartsOfSinglePlants = Y -->
                  <!-- DB: NumberOfPartsOfPlants (plural) -->
                  <div
                    v-if="pm.isPartsOfSinglePlants === 'Y'"
                    style="font-size: 14px; color: var(--color-neutral-800); line-height: 1.8"
                  >
                    In the case of observations of parts taken from single plants, the number of
                    parts to be taken from each of the plants should be
                    <Input
                      :model-value="pm.NumberOfPartsOfPlants ?? ''"
                      placeholder="(number)"
                      size="small"
                      style="display: inline-block; width: 65px; margin: 0 4px"
                      @update:model-value="updatePmField(pm, 'NumberOfPartsOfPlants', $event)"
                    />
                    <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">
                      <i>(ASW 7(b))</i>
                    </a>
                  </div>
                </div>

                <!-- Add / Remove method buttons — legacy: "Add method of Propogation" / "Remove method of Propogation" -->
                <div style="display: flex; gap: 10px; margin-top: 4px; flex-wrap: wrap">
                  <button
                    :disabled="addingPropMethod"
                    style="background: #CEDD80; border: none; border-radius: 6px;
                           padding: 8px 16px; font-size: 13px; font-weight: 600;
                           cursor: pointer; color: #333; opacity: 1"
                    :style="addingPropMethod ? { opacity: '0.6', cursor: 'wait' } : {}"
                    @click="addPropMethod"
                  >
                    Add method of Propagation
                  </button>
                  <button
                    v-if="propMethods.length > 0"
                    style="background: #CEDD80; border: none; border-radius: 6px;
                           padding: 8px 16px; font-size: 13px; font-weight: 600;
                           cursor: pointer; color: #333"
                    @click="removePropMethod(propMethods[propMethods.length - 1].AssesmentMethodPropogation_ID)"
                  >
                    Remove method of Propagation
                  </button>
                </div>
              </div>

            </div><!-- /Number of plants section -->
          </div>
        </SectionAccordion>

        <!-- ══════════════════════════════════════════════════════════
             4.2  UNIFORMITY
        ══════════════════════════════════════════════════════════ -->
        <SectionAccordion number="4.2" title="Uniformity">
          <div style="display: flex; flex-direction: column; gap: 16px">

            <!--
              legacy: typeOfPropagationInput (standalone wide input)
              DB: typeOfPropagation = "" / OtherTypeOfPropagation = "Bseed-propagated..."
              getTypeOfPropagation() returns the display value stripping the prefix char
              ALLOWED_FIELDS: typeOfPropagation  (save directly to this field)
            -->
            <div style="font-size: 14px; color: var(--color-neutral-800); line-height: 1.8">
              Please don't complete the following sentence if it is not applicable.
              These Test Guidelines have been developed for the examination of
              <Input
                :model-value="getTypeOfPropagation()"
                placeholder="(variety type)"
                size="small"
                style="display: inline-block; width: 320px; margin: 0 4px"
                @update:model-value="onFieldChange('typeOfPropagation', $event)"
              />
              . For varieties with other types of propagation the recommendation in the
              General Introduction and document TGP/13 "Guidance for new types and species",
              Section 4.5 Testing Uniformity should be followed.
            </div>

            <!-- ── Q1: Cross-pollinated varieties ── -->
            <!--
              DB: IsCrossPollinatedVariety = "Y"  (note: this is the REAL field name from API)
              But ALLOWED_FIELDS has IsHybridVarietyGuideline — mapping: IsCrossPollinatedVariety → IsHybridVarietyGuideline
              From API ch04: "IsCrossPollinatedVariety": "Y", "IsHybridVarietyGuideline": "Y"
              Both exist; we use IsHybridVarietyGuideline as it is in ALLOWED_FIELDS
            -->
            <div style="display: flex; flex-direction: column; gap: 8px; padding: 10px 14px;
                        border: 2px solid #CEDD80; border-radius: 12px">
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
                  DB: CrossPolinattedVarieties = "crosspollinatedwithotherpropagation"
                  ALLOWED_FIELDS: CrossPolinattedVarieties ✓
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

                <!-- ASW 8(a)(i) — crosspollinatedonly -->
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

                <!-- ASW 8(a)(ii) — crosspollinatedwithotherpropagation -->
                <!--
                  DB: TypesOfVariety = "" / OtherVarietyTypes = "Cseed-propagated" (strip first char)
                  We display this via the typeOfPropagation field (reuse ALLOWED_FIELDS: typeOfPropagation)
                -->
                <div
                  v-if="s('CrossPolinattedVarieties') === 'crosspollinatedwithotherpropagation'"
                  style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.8;
                         padding: 6px 10px; background: var(--color-neutral-100); border-radius: 4px"
                >
                  The assessment of uniformity for
                  <Input
                    :model-value="getTypeOfPropagation()"
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
              </div>
            </div>

            <!-- ── Q2: Hybrid varieties (uniformity) ── -->
            <!--
              DB: IsHybridVariety = "Y"  ALLOWED_FIELDS: IsHybridVariety ✓
            -->
            <div style="display: flex; flex-direction: column; gap: 8px; padding: 10px 14px;
                        border: 2px solid #CEDD80; border-radius: 12px">
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

              <!-- ASW 8(b) -->
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
              DB: UniformityAssessmentParentFormula = "N"  (NOT in ALLOWED_FIELDS)
              The closest ALLOWED_FIELDS key is UniformityAssessmentSameSample
              From API: UniformityAssessmentSameSample = "TGCoveringOnlyVarieties"
              We use UniformityAssessmentSameSample with Y/N mapping:
                Y = was "TGCoveringOnlyVarieties" (parent formula used)
                Legacy question_3 is about UniformityAssessmentParentFormula
              For now we bind to UniformityAssessmentSameSample as the closest available field.
              Display Y if value is "Y" or "TGCoveringOnlyVarieties".
            -->
            <div style="display: flex; flex-direction: column; gap: 8px; padding: 10px 14px;
                        border: 2px solid #CEDD80; border-radius: 12px">
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">
                <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800); flex: 1">
                  Do these Test Guidelines cover uniformity assessment where the parent formula is used?
                </label>
                <RadioGroup
                  :model-value="s('UniformityAssessmentSameSample') === 'TGCoveringOnlyVarieties' ? 'Y' : s('UniformityAssessmentSameSample')"
                  direction="horizontal"
                  @update:model-value="setRadio('UniformityAssessmentSameSample', $event)"
                >
                  <RadioOption value="Y" label="Yes" />
                  <RadioOption value="N" label="No" />
                </RadioGroup>
              </div>

              <!-- ASW 8(e) -->
              <div
                v-if="s('UniformityAssessmentSameSample') === 'Y' || s('UniformityAssessmentSameSample') === 'TGCoveringOnlyVarieties'"
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

            <!-- ── Q4: Uniformity by off-types ── -->
            <!--
              DB: UniformityAssessmentDifferentSample = "Y;uniAllPlants;UniformityAssessmentSubSample"
              ALLOWED_FIELDS: UniformityAssessmentDifferentSample ✓
              We read only the first segment for Y/N display (the rest are sub-flags)
            -->
            <div style="display: flex; flex-direction: column; gap: 8px; padding: 10px 14px;
                        border: 2px solid #CEDD80; border-radius: 12px">
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">
                <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800); flex: 1">
                  Do these Test Guidelines cover uniformity assessment by off-type(s)
                  (all characteristics observed on the same sample size)?
                </label>
                <RadioGroup
                  :model-value="s('UniformityAssessmentDifferentSample').split(';')[0] || s('UniformityAssessmentDifferentSample')"
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

        <!-- ══════════════════════════════════════════════════════════
             4.3  STABILITY
        ══════════════════════════════════════════════════════════ -->
        <SectionAccordion number="4.3" title="Stability">
          <div style="display: flex; flex-direction: column; gap: 16px">

            <!-- Stability assessment: general -->
            <!--
              DB: TGCovering = "SeedVegetative"  ALLOWED_FIELDS: TGCovering ✓
            -->
            <div style="display: flex; flex-direction: column; gap: 10px">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
                Stability assessment: general
                <span style="color: #D32F2F"> *</span>
              </h3>
              <RadioGroup
                :model-value="s('TGCovering')"
                direction="vertical"
                @update:model-value="setRadio('TGCovering', $event)"
              >
                <RadioOption value="SeedVegetative"
                  label="Test Guidelines covering seed-propagated and vegetatively propagated varieties" />
                <RadioOption value="Seed"
                  label="Test Guidelines covering only seed-propagated varieties" />
                <RadioOption value="Vegetative"
                  label="Test Guidelines covering only vegetatively propagated varieties" />
              </RadioGroup>

              <!-- ASW 9(a/b/c) -->
              <div v-if="s('TGCovering') === 'SeedVegetative'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                       padding: 6px 10px; background: var(--color-neutral-100); border-radius: 4px">
                Where appropriate, or in cases of doubt, stability may be further examined by
                testing a new seed stock to ensure that it exhibits the same characteristics as
                those shown by the initial material supplied.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px"><i>(ASW 9(a))</i></a>
              </div>
              <div v-else-if="s('TGCovering') === 'Seed'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                       padding: 6px 10px; background: var(--color-neutral-100); border-radius: 4px">
                Where appropriate, or in cases of doubt, stability may be further examined by
                testing a new seed stock to ensure that it exhibits the same characteristics as
                those shown by the initial material supplied.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px"><i>(ASW 9(b))</i></a>
              </div>
              <div v-else-if="s('TGCovering') === 'Vegetative'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                       padding: 6px 10px; background: var(--color-neutral-100); border-radius: 4px">
                Where appropriate, or in cases of doubt, stability may be further examined by
                testing a new plant stock to ensure that it exhibits the same characteristics as
                those shown by the initial material supplied.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px"><i>(ASW 9(c))</i></a>
              </div>
            </div>

            <!-- Stability assessment: hybrid varieties -->
            <!--
              DB: IsParentLineAssessed = "Y"  ALLOWED_FIELDS: IsParentLineAssessed ✓
            -->
            <div style="display: flex; flex-direction: column; gap: 10px">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); margin: 0">
                Stability assessment: hybrid varieties
              </h3>
              <div style="display: flex; flex-direction: column; gap: 8px; padding: 10px 14px;
                          border: 2px solid #CEDD80; border-radius: 12px">
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

                <!-- ASW 10 -->
                <div v-if="s('IsParentLineAssessed') === 'Y'"
                  style="font-size: 13px; color: var(--color-neutral-700); line-height: 1.6;
                         padding: 6px 10px; background: var(--color-neutral-100); border-radius: 4px">
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
              DB: StabilityAddInfo = "<p>test 4.3</p>"  ALLOWED_FIELDS: StabilityAddInfo ✓
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