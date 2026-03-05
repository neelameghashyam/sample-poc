import { query } from '../../utils/db.js';

const ALLOWED_FIELDS = [
  'IsHybridParentFormula',
  'IsHybridVariety',
  'IsHybridVarietyGuideline',
  'SinglePlant',
  'PartsPlant',
  'IsPartsOfSinglePlants',
  'IsOneMethodOfPropogation',
  'DistinctnessAddInfo',
  'typeOfPropagation',
  'CrossPolinattedVarieties',
  'UniformityAssessmentSameSample',
  'UniformityAssessmentDifferentSample',
  'TGCovering',
  'IsParentLineAssessed',
  'StabilityAddInfo',
];

/**
 * PATCH — update TG_Assessment fields
 */
export const updateChapter04 = async (tgId, updates) => {
  const fields = Object.keys(updates).filter((f) => ALLOWED_FIELDS.includes(f));
  if (fields.length === 0) return null;

  const setClauses = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => updates[f]);

  const result = await query(
    `UPDATE TG_Assessment SET ${setClauses} WHERE TG_ID = ?`,
    [...values, tgId]
  );
  return result.affectedRows > 0;
};

export { ALLOWED_FIELDS };
