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
const { previewHtml, previewLoading, previewError, needsRefresh, markDirty, handleRefresh } = useChapterPreview('04');

const data = computed(() => store.chapters['04']);

function onFieldChange(field: string, value: string | null | undefined) {
  store.autosave('04', field, value);
  markDirty();
}

function setRadio(field: string, value: string) {
  onFieldChange(field, value);
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
      <div style="display: flex; flex-direction: column; gap: 12px">

        <!-- ══════════════════════════════════════════════
             4.1  DISTINCTNESS
        ══════════════════════════════════════════════ -->
        <SectionAccordion number="4.1" title="Distinctness" :open="true">
          <div style="display: flex; flex-direction: column; gap: 20px">

            <!-- Reference link -->
            <Links :links="[{ text: 'Number of Plants / Parts of Plants to be Examined (for distinctness) (GN 10.2)' }]" />

            <!-- ── 4.1.1  General Recommendations — Hybrid variety guideline ── -->
            <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--color-neutral-200); border-radius: 8px;">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                4.1.1 General recommendations
              </h3>
              <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                Does the TG cover hybrid varieties?
                <span style="color: #D32F2F; margin-left: 2px">*</span>
              </p>
              <!-- maps to: IsHybridVariety / assessmentBean.isHybridVarietyGuideline -->
              <RadioGroup
                :model-value="data.IsHybridVariety"
                direction="horizontal"
                @update:model-value="setRadio('IsHybridVariety', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>

              <!-- Conditional: hybrid parent formula question — shown when IsHybridVariety = Y -->
              <!-- maps to: IsHybridParentFormula / assessmentBean.hybridParentFormula -->
              <div
                v-if="data.IsHybridVariety === 'Y'"
                style="display: flex; flex-direction: column; gap: 10px; padding: 12px; background: var(--color-neutral-50); border-radius: 6px; margin-top: 4px"
              >
                <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                  In the case of hybrids, is the parent formula used?
                  <span style="color: #D32F2F; margin-left: 2px">*</span>
                </p>
                <RadioGroup
                  :model-value="data.IsHybridParentFormula"
                  direction="horizontal"
                  @update:model-value="setRadio('IsHybridParentFormula', $event)"
                >
                  <RadioOption value="Y" label="Yes" />
                  <RadioOption value="N" label="No" />
                </RadioGroup>

                <!-- ASW 7(a) descriptive text shown when both hybrid = Y and parent formula = Y -->
                <div
                  v-if="data.IsHybridParentFormula === 'Y'"
                  style="font-size: 13px; color: var(--color-neutral-700); line-height: 19px; padding: 8px 12px; background: var(--color-neutral-100); border-radius: 4px"
                >
                  To assess distinctness of hybrids, the parent lines and the formula may be used according to the following recommendations:
                  (i) description of parent lines according to the Test Guidelines;
                  (ii) check of the originality of the parent lines in comparison with the variety collection;
                  (iii) check of the originality of the hybrid formula; and
                  (iv) assessment of the distinctness at the hybrid level for varieties with a similar formula.
                  <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">(ASW 7(a))</a>
                </div>

                <!-- Additional info for hybrid distinctness — maps to DistinctnessAddInfo / distinctnessHybridAddInfo -->
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px">
                  <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
                    Additional distinctness information
                    <span style="font-size: 12px; font-weight: 400; color: var(--color-neutral-500); margin-left: 6px">(optional)</span>
                  </label>
                  <Editor
                    :model-value="data.DistinctnessAddInfo || ''"
                    :api-key="apiKey"
                    :init="init"
                    @update:model-value="onFieldChange('DistinctnessAddInfo', $event)"
                  />
                </div>
              </div>
            </div>

            <!-- ── 4.1.2  Number of plants / parts of plants to be examined ── -->
            <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--color-neutral-200); border-radius: 8px;">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                4.1.2 Number of plants / parts of plants to be examined
              </h3>
              <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                Is there more than one method of propagation?
                <span style="color: #D32F2F; margin-left: 2px">*</span>
              </p>
              <!-- maps to: IsOneMethodOfPropogation / assessmentBean.isOneMethodOfPropogation -->
              <RadioGroup
                :model-value="data.IsOneMethodOfPropogation"
                direction="horizontal"
                @update:model-value="setRadio('IsOneMethodOfPropogation', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>

              <!-- When IsOneMethodOfPropogation = N: single plant / parts fields -->
              <!-- maps to: SinglePlant (format "first;second") and PartsPlant -->
              <div
                v-if="data.IsOneMethodOfPropogation === 'N'"
                style="display: flex; flex-direction: column; gap: 12px; padding-top: 4px"
              >
                <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                  Unless otherwise indicated, for the purpose of distinctness, all observations on single plants should be made on
                  <Input
                    :model-value="data.SinglePlant?.split(';')[0] || ''"
                    placeholder="e.g. 20"
                    size="small"
                    style="display: inline-block; width: 80px; margin: 0 6px"
                    @update:model-value="onFieldChange('SinglePlant', $event + ';' + (data.SinglePlant?.split(';')[1] || ''))"
                  />
                  plants or parts taken from each of
                  <Input
                    :model-value="data.SinglePlant?.split(';')[1] || ''"
                    placeholder="e.g. 2"
                    size="small"
                    style="display: inline-block; width: 80px; margin: 0 6px"
                    @update:model-value="onFieldChange('SinglePlant', (data.SinglePlant?.split(';')[0] || '') + ';' + $event)"
                  />
                  plants and any other observations made on all plants in the test, disregarding any off-type plants.
                </p>

                <!-- Are observations made on parts taken from single plants? -->
                <!-- maps to: IsPartsOfSinglePlants -->
                <div style="display: flex; flex-direction: column; gap: 8px">
                  <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                    Are observations made on parts taken from single plants?
                  </p>
                  <RadioGroup
                    :model-value="data.IsPartsOfSinglePlants"
                    direction="horizontal"
                    @update:model-value="setRadio('IsPartsOfSinglePlants', $event)"
                  >
                    <RadioOption value="Y" label="Yes" />
                    <RadioOption value="N" label="No" />
                  </RadioGroup>
                  <!-- Parts of plant count — shown when IsPartsOfSinglePlants = Y -->
                  <!-- maps to: PartsPlant -->
                  <div v-if="data.IsPartsOfSinglePlants === 'Y'" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
                    <span style="font-size: 14px; color: var(--color-neutral-800)">
                      In the case of observations of parts taken from single plants, the number of parts to be taken from each of the plants should be
                    </span>
                    <Input
                      :model-value="data.PartsPlant || ''"
                      placeholder="e.g. 3"
                      size="small"
                      style="width: 80px"
                      @update:model-value="onFieldChange('PartsPlant', $event)"
                    />
                    <a href="#" style="color: #496D31; font-size: 12px">(ASW 7(b))</a>
                  </div>
                </div>
              </div>

              <!-- When IsOneMethodOfPropogation = Y: per-method propagation rows -->
              <div
                v-if="data.IsOneMethodOfPropogation === 'Y'"
                style="display: flex; flex-direction: column; gap: 12px; padding-top: 4px; font-size: 14px; color: var(--color-neutral-800); line-height: 20px"
              >
                <p style="margin: 0">
                  In the case of [propagation method], unless otherwise indicated, for the purpose of distinctness, all observations on single plants should be made on
                  <Input
                    :model-value="data.SinglePlant?.split(';')[0] || ''"
                    placeholder="e.g. 20"
                    size="small"
                    style="display: inline-block; width: 80px; margin: 0 6px"
                    @update:model-value="onFieldChange('SinglePlant', $event + ';' + (data.SinglePlant?.split(';')[1] || ''))"
                  />
                  plants or parts taken from each of
                  <Input
                    :model-value="data.SinglePlant?.split(';')[1] || ''"
                    placeholder="e.g. 2"
                    size="small"
                    style="display: inline-block; width: 80px; margin: 0 6px"
                    @update:model-value="onFieldChange('SinglePlant', (data.SinglePlant?.split(';')[0] || '') + ';' + $event)"
                  />
                  plants and any other observations made on all plants in the test, disregarding any off-type plants.
                </p>

                <div style="display: flex; flex-direction: column; gap: 8px">
                  <p style="font-size: 14px; color: var(--color-neutral-800); margin: 0">
                    Are observations made on parts taken from single plants?
                  </p>
                  <RadioGroup
                    :model-value="data.IsPartsOfSinglePlants"
                    direction="horizontal"
                    @update:model-value="setRadio('IsPartsOfSinglePlants', $event)"
                  >
                    <RadioOption value="Y" label="Yes" />
                    <RadioOption value="N" label="No" />
                  </RadioGroup>
                  <div v-if="data.IsPartsOfSinglePlants === 'Y'" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
                    <span style="font-size: 14px; color: var(--color-neutral-800)">
                      In the case of observations of parts taken from single plants, the number of parts to be taken from each of the plants should be
                    </span>
                    <Input
                      :model-value="data.PartsPlant || ''"
                      placeholder="e.g. 3"
                      size="small"
                      style="width: 80px"
                      @update:model-value="onFieldChange('PartsPlant', $event)"
                    />
                    <a href="#" style="color: #496D31; font-size: 12px">(ASW 7(b))</a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </SectionAccordion>

        <!-- ══════════════════════════════════════════════
             4.2  UNIFORMITY
        ══════════════════════════════════════════════ -->
        <SectionAccordion number="4.2" title="Uniformity">
          <div style="display: flex; flex-direction: column; gap: 20px">

            <!-- Type of propagation text input -->
            <!-- maps to: typeOfPropagation / assessmentBean.typeOfPropagation -->
            <div style="display: flex; flex-direction: column; gap: 8px">
              <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                Please don't complete the following sentence if it is not applicable. These Test Guidelines have been developed for the examination of
                <Input
                  :model-value="data.typeOfPropagation || ''"
                  placeholder="e.g. self-pollinated varieties"
                  size="small"
                  style="display: inline-block; width: 260px; margin: 0 6px"
                  @update:model-value="onFieldChange('typeOfPropagation', $event)"
                />
                . For varieties with other types of propagation the recommendation in the General Introduction and document TGP/13 "Guidance for new types and species", Section 4.5 Testing Uniformity should be followed.
              </p>
            </div>

            <!-- ── 4.2.1  Cross-pollinated varieties ── -->
            <!-- maps to: IsHybridVarietyGuideline / assessmentBean.isCrossPollinatedVariety -->
            <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--color-neutral-200); border-radius: 8px;">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                4.2.1 Cross-pollinated varieties
              </h3>
              <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                Do these Test Guidelines cover cross-pollinated varieties?
              </p>
              <RadioGroup
                :model-value="data.IsHybridVarietyGuideline"
                direction="horizontal"
                @update:model-value="setRadio('IsHybridVarietyGuideline', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>

              <!-- When cross-pollinated = Y: sub-options -->
              <!-- maps to: CrossPolinattedVarieties / assessmentBean.crossPolinattedVarieties -->
              <div v-if="data.IsHybridVarietyGuideline === 'Y'" style="display: flex; flex-direction: column; gap: 10px; padding: 10px; background: var(--color-neutral-50); border-radius: 6px">
                <RadioGroup
                  :model-value="data.CrossPolinattedVarieties"
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

                <!-- ASW 8(a)(i) text for crosspollinatedonly -->
                <div
                  v-if="data.CrossPolinattedVarieties === 'crosspollinatedonly'"
                  style="font-size: 13px; color: var(--color-neutral-700); line-height: 19px; padding: 8px 12px; background: var(--color-neutral-100); border-radius: 4px"
                >
                  The assessment of uniformity should be according to the recommendations for cross-pollinated varieties in the General Introduction.
                  <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">(ASW 8(a)(i))</a>
                </div>

                <!-- ASW 8(a)(ii) text for crosspollinatedwithotherpropagation -->
                <div
                  v-if="data.CrossPolinattedVarieties === 'crosspollinatedwithotherpropagation'"
                  style="font-size: 13px; color: var(--color-neutral-700); line-height: 19px; padding: 8px 12px; background: var(--color-neutral-100); border-radius: 4px"
                >
                  The assessment of uniformity for [variety type] should be according to the recommendations for cross-pollinated varieties in the General Introduction.
                  <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">(ASW 8(a)(ii))</a>
                </div>
              </div>
            </div>

            <!-- ── 4.2.2  Hybrid varieties ── -->
            <!-- NOTE: reuses IsHybridVariety field as per legacy "hybridVariety" path -->
            <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--color-neutral-200); border-radius: 8px;">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                4.2.2 Hybrid varieties
              </h3>
              <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                Do these Test Guidelines cover hybrid varieties?
              </p>
              <RadioGroup
                :model-value="data.IsHybridVariety"
                direction="horizontal"
                @update:model-value="setRadio('IsHybridVariety', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>
              <div
                v-if="data.IsHybridVariety === 'Y'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 19px; padding: 8px 12px; background: var(--color-neutral-100); border-radius: 4px"
              >
                The assessment of uniformity for hybrid varieties depends on the type of hybrid and should be according to the recommendations for hybrid varieties in the General Introduction.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">(ASW 8(b))</a>
              </div>
            </div>

            <!-- ── 4.2.3  Uniformity — parent formula ── -->
            <!-- maps to: UniformityAssessmentSameSample used for parentFormula Y/N -->
            <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--color-neutral-200); border-radius: 8px;">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                4.2.3 Parent formula
              </h3>
              <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                Do these Test Guidelines cover uniformity assessment where the parent formula is used?
              </p>
              <RadioGroup
                :model-value="data.UniformityAssessmentSameSample"
                direction="horizontal"
                @update:model-value="setRadio('UniformityAssessmentSameSample', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>
              <div
                v-if="data.UniformityAssessmentSameSample === 'Y'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 19px; padding: 8px 12px; background: var(--color-neutral-100); border-radius: 4px"
              >
                Where the assessment of a hybrid variety involves the parent lines, the uniformity of the hybrid variety should, in addition to an examination of the hybrid variety itself, also be assessed by examination of the uniformity of its parent lines.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">(ASW 8(e))</a>
              </div>
            </div>

            <!-- ── 4.2.4  Uniformity by off-types (different sample size) ── -->
            <!-- maps to: UniformityAssessmentDifferentSample -->
            <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--color-neutral-200); border-radius: 8px;">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                4.2.4 Uniformity assessment by off-types
              </h3>
              <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                Do these Test Guidelines cover uniformity assessment by off-type(s)?
              </p>
              <RadioGroup
                :model-value="data.UniformityAssessmentDifferentSample"
                direction="horizontal"
                @update:model-value="setRadio('UniformityAssessmentDifferentSample', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>
            </div>

          </div>
        </SectionAccordion>

        <!-- ══════════════════════════════════════════════
             4.3  STABILITY
        ══════════════════════════════════════════════ -->
        <SectionAccordion number="4.3" title="Stability">
          <div style="display: flex; flex-direction: column; gap: 20px">

            <!-- ── 4.3.1  Stability assessment — general ── -->
            <!-- maps to: TGCovering / assessmentBean.tgCovering -->
            <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--color-neutral-200); border-radius: 8px;">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                4.3.1 Stability assessment: general
                <span style="color: #D32F2F; margin-left: 2px">*</span>
              </h3>
              <RadioGroup
                :model-value="data.TGCovering"
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

              <!-- ASW 9 descriptive text — shown based on TGCovering selection -->
              <div
                v-if="data.TGCovering === 'SeedVegetative'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 19px; padding: 8px 12px; background: var(--color-neutral-100); border-radius: 4px"
              >
                Where appropriate, or in cases of doubt, stability may be further examined by testing a new seed stock to ensure that it exhibits the same characteristics as those shown by the initial material supplied.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">(ASW 9(a))</a>
              </div>
              <div
                v-else-if="data.TGCovering === 'Seed'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 19px; padding: 8px 12px; background: var(--color-neutral-100); border-radius: 4px"
              >
                Where appropriate, or in cases of doubt, stability may be further examined by testing a new seed stock to ensure that it exhibits the same characteristics as those shown by the initial material supplied.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">(ASW 9(b))</a>
              </div>
              <div
                v-else-if="data.TGCovering === 'Vegetative'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 19px; padding: 8px 12px; background: var(--color-neutral-100); border-radius: 4px"
              >
                Where appropriate, or in cases of doubt, stability may be further examined by testing a new plant stock to ensure that it exhibits the same characteristics as those shown by the initial material supplied.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">(ASW 9(c))</a>
              </div>
            </div>

            <!-- ── 4.3.2  Stability assessment — hybrid varieties / parent lines ── -->
            <!-- maps to: IsParentLineAssessed / assessmentBean.parentLineAssessed -->
            <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--color-neutral-200); border-radius: 8px;">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                4.3.2 Stability assessment: hybrid varieties
              </h3>
              <p style="font-size: 14px; color: var(--color-neutral-800); line-height: 20px; margin: 0">
                Does uniformity and stability of parent lines need to be assessed?
                <span style="color: #D32F2F; margin-left: 2px">*</span>
              </p>
              <RadioGroup
                :model-value="data.IsParentLineAssessed"
                direction="horizontal"
                @update:model-value="setRadio('IsParentLineAssessed', $event)"
              >
                <RadioOption value="Y" label="Yes" />
                <RadioOption value="N" label="No" />
              </RadioGroup>
              <div
                v-if="data.IsParentLineAssessed === 'Y'"
                style="font-size: 13px; color: var(--color-neutral-700); line-height: 19px; padding: 8px 12px; background: var(--color-neutral-100); border-radius: 4px"
              >
                Where appropriate, or in cases of doubt, the stability of a hybrid variety may, in addition to an examination of the hybrid variety itself, also be assessed by examination of the uniformity and stability of its parent lines.
                <a href="#" style="color: #496D31; font-size: 12px; margin-left: 4px">(ASW 10)</a>
              </div>
            </div>

            <!-- Stability additional information (optional rich text) -->
            <!-- maps to: StabilityAddInfo / assessmentBean.stabilityAddInfo -->
            <div style="display: flex; flex-direction: column; gap: 6px">
              <label style="font-size: 14px; font-weight: 600; color: var(--color-neutral-800)">
                Additional stability information
                <span style="font-size: 12px; font-weight: 400; color: var(--color-neutral-500); margin-left: 6px">(optional)</span>
              </label>
              <Editor
                :model-value="data.StabilityAddInfo || ''"
                :api-key="apiKey"
                :init="init"
                @update:model-value="onFieldChange('StabilityAddInfo', $event)"
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