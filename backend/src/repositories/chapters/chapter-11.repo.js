import { query } from '../../utils/db.js';

const ALLOWED_FIELDS = ['annexRefData'];

/**
 * PATCH /api/test-guidelines/:id/chapters/11
 * Update annex content on the TG_Annex row.
 */
export const updateChapter11 = async (tgId, updates) => {
  const fields = Object.keys(updates).filter((f) => ALLOWED_FIELDS.includes(f));
  if (fields.length === 0) return null;

  const setClauses = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => updates[f]);

  const result = await query(
    `UPDATE TG_Annex SET ${setClauses} WHERE TG_ID = ?`,
    [...values, tgId]
  );
  return result.affectedRows > 0;
};

export { ALLOWED_FIELDS };
