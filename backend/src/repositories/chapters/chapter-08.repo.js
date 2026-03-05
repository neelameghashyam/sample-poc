import { query, queryOne } from '../../utils/db.js';

/**
 * Create an explanation for a characteristic
 */
export const createExplanation = async (data) => {
  const result = await query(
    `INSERT INTO TOC_Characteristic_Explanation (TOC_ID, Explaination_Text) VALUES (?, ?)`,
    [data.TOC_ID, data.Explaination_Text || '']
  );

  return queryOne(
    `SELECT Char_Explanation_ID as Explanation_ID, TOC_ID, Explaination_Text
     FROM TOC_Characteristic_Explanation WHERE Char_Explanation_ID = ?`,
    [result.insertId]
  );
};

/**
 * Update explanation text
 */
export const updateExplanation = async (explId, data) => {
  if (data.Explaination_Text === undefined) return null;

  const result = await query(
    `UPDATE TOC_Characteristic_Explanation SET Explaination_Text = ? WHERE Char_Explanation_ID = ?`,
    [data.Explaination_Text, explId]
  );
  return result.affectedRows > 0;
};

/**
 * Delete an explanation (cascades to individual explain docs)
 */
export const deleteExplanation = async (explId) => {
  await query(`DELETE FROM TOC_Explain_Indiv WHERE Char_Explanation_ID = ?`, [explId]);
  const result = await query(
    `DELETE FROM TOC_Characteristic_Explanation WHERE Char_Explanation_ID = ?`,
    [explId]
  );
  return result.affectedRows > 0;
};
