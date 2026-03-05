import { query } from '../../utils/db.js';

const ALLOWED_FIELDS = ['LiteratureReferences'];

/**
 * PATCH /api/test-guidelines/:id/chapters/09
 * Update literature references on the TG_Literature row.
 */
export const updateChapter09 = async (tgId, updates) => {
  const fields = Object.keys(updates).filter((f) => ALLOWED_FIELDS.includes(f));
  if (fields.length === 0) return null;

  const setClauses = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => updates[f]);

  const result = await query(
    `UPDATE TG_Literature SET ${setClauses} WHERE TG_ID = ?`,
    [...values, tgId]
  );
  return result.affectedRows > 0;
};

export { ALLOWED_FIELDS };
