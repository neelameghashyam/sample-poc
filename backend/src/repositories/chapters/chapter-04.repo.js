import { query, queryOne } from '../../utils/db.js';

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

export const findAssessmentId = async (tgId) => {
  const row = await queryOne(
    `SELECT Assessment_Id FROM TG_Assessment WHERE TG_ID = ? LIMIT 1`,
    [tgId]
  );
  return row?.Assessment_Id ?? null;
};

const PROP_METHOD_FIELDS = [
  'PropogationMethod',
  'NumberOfPlantsFirst',
  'NumberOfPlantsSecond',
  'IsPartsOfSinglePlants',
  'NumberOfPartsOfPlant',
];

export const createAssessmentPropMethod = async (tgId, data) => {
  const assessmentId = await findAssessmentId(tgId);
  if (!assessmentId) return null;
  const result = await query(
    `INSERT INTO AssesmentMethodPropogation
       (Assessment_ID, PropogationMethod, NumberOfPlantsFirst, NumberOfPlantsSecond,
        IsPartsOfSinglePlants, NumberOfPartsOfPlant)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      assessmentId,
      data.PropogationMethod ?? '',
      data.NumberOfPlantsFirst ?? '',
      data.NumberOfPlantsSecond ?? '',
      data.IsPartsOfSinglePlants ?? 'N',
      data.NumberOfPartsOfPlant ?? '',
    ]
  );
  return queryOne(
    `SELECT * FROM AssesmentMethodPropogation WHERE AssesmentMethodPropogation_ID = ?`,
    [result.insertId]
  );
};

export const updateAssessmentPropMethod = async (tgId, pmId, updates) => {
  const fields = Object.keys(updates).filter((f) => PROP_METHOD_FIELDS.includes(f));
  if (fields.length === 0) return false;
  const setClauses = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => updates[f]);
  const result = await query(
    `UPDATE AssesmentMethodPropogation amp
     JOIN TG_Assessment a ON amp.Assessment_ID = a.Assessment_Id
     SET ${setClauses}
     WHERE amp.AssesmentMethodPropogation_ID = ? AND a.TG_ID = ?`,
    [...values, pmId, tgId]
  );
  return result.affectedRows > 0;
};

export const deleteAssessmentPropMethod = async (tgId, pmId) => {
  const result = await query(
    `DELETE amp FROM AssesmentMethodPropogation amp
     JOIN TG_Assessment a ON amp.Assessment_ID = a.Assessment_Id
     WHERE amp.AssesmentMethodPropogation_ID = ? AND a.TG_ID = ?`,
    [pmId, tgId]
  );
  return result.affectedRows > 0;
};

export { ALLOWED_FIELDS };