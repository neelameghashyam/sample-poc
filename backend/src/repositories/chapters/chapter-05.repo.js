import { query } from '../../utils/db.js';

const ALLOWED_FIELDS = ['GroupingSummaryText'];

/**
 * PATCH /api/test-guidelines/:id/chapters/05
 * Update the grouping summary text on the TG row.
 */
export const updateChapter05 = async (tgId, updates) => {
  const fields = Object.keys(updates).filter((f) => ALLOWED_FIELDS.includes(f));
  if (fields.length === 0) return null;

  const setClauses = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => updates[f]);

  const result = await query(
    `UPDATE TG SET ${setClauses} WHERE TG_ID = ? AND Status_Code != 'DEL'`,
    [...values, tgId]
  );
  return result.affectedRows > 0;
};

export { ALLOWED_FIELDS };
