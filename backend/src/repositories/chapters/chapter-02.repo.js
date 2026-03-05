import { query } from '../../utils/db.js';

const ALLOWED_FIELDS = [
  'Material_Supplied',
  'Min_Plant_Material',
  'SeedQualityReq',
  'Material_AddInfo',
];

/**
 * PATCH — update TG_Material fields
 */
export const updateChapter02 = async (tgId, updates) => {
  const fields = Object.keys(updates).filter((f) => ALLOWED_FIELDS.includes(f));
  if (fields.length === 0) return null;

  const setClauses = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => updates[f]);

  const result = await query(
    `UPDATE TG_Material SET ${setClauses} WHERE TG_ID = ?`,
    [...values, tgId]
  );
  return result.affectedRows > 0;
};

export { ALLOWED_FIELDS };
