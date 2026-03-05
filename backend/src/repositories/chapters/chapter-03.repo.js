import { query } from '../../utils/db.js';

const ALLOWED_FIELDS = [
  'GrowingCycle',
  'PlantingForm',
  'IsFruitCrop',
  'CropType',
  'FruitDormantPeriod',
  'GrowingCycleAddInfo',
  'OtherGrowingCycleInfo',
  'PlantType',
  'PlantNumber',
  'Devlopmentstage',
  'DifferentPlotsForObservation',
  'PlotTypeA',
  'PlotTypeB',
  'PlotTypeC',
  'PlotTypeD',
  'EyeColorObservation',
  'ConditionAddInfo',
  'IsOneMethodOfPropogation',
  'PlotDesign',
  'PlantRemoval',
  'TestDesignAddInfo',
  'PlantNumberA',
  'RowPlotSizeA',
  'PlantTypeA',
  'Replicatenum',
];

/**
 * PATCH — update TG_Examination fields
 */
export const updateChapter03 = async (tgId, updates) => {
  const fields = Object.keys(updates).filter((f) => ALLOWED_FIELDS.includes(f));
  if (fields.length === 0) return null;

  const setClauses = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => updates[f]);

  const result = await query(
    `UPDATE TG_Examination SET ${setClauses} WHERE TG_ID = ?`,
    [...values, tgId]
  );
  return result.affectedRows > 0;
};

export { ALLOWED_FIELDS };
