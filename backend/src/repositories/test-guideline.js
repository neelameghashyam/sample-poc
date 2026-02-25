import { query, queryOne } from '../utils/db.js';

/**
 * List test guidelines with optional status filter
 */
export const findAll = async ({ status, limit, offset }) => {
  let sql = `
    SELECT
      tg.TG_ID as id,
      tg.TG_Reference as reference,
      tg.TG_Name as name,
      tg.Status_Code as status,
      tg.TG_LastUpdated as lastUpdated,
      up.Full_Name as leadExpert
    FROM TG tg
    LEFT JOIN Tg_Users tu ON tg.TG_ID = tu.TG_ID AND tu.Role_Code = 'LE'
    LEFT JOIN User_Profile up ON tu.User_ID = up.User_ID
    WHERE tg.Status_Code != 'DEL'
  `;

  const params = [];

  if (status) {
    sql += ' AND tg.Status_Code = ?';
    params.push(status);
  }

  sql += ' ORDER BY tg.TG_LastUpdated DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return query(sql, params);
};

/**
 * Count all test guidelines (excluding deleted)
 */
export const countAll = async () => {
  const result = await queryOne(
    'SELECT COUNT(*) as total FROM TG WHERE Status_Code != ?',
    ['DEL']
  );
  return parseInt(result?.total || 0, 10);
};

/**
 * Find test guideline by ID
 */
export const findById = async (id) => {
  return queryOne(
    `SELECT
      tg.TG_ID as id,
      tg.TG_Reference as reference,
      tg.TG_Name as name,
      tg.Language_Code as language,
      tg.Status_Code as status,
      tg.TG_LastUpdated as lastUpdated,
      tg.LE_Draft_StartDate as leDraftStart,
      tg.LE_Draft_EndDate as leDraftEnd,
      tg.IE_Comments_StartDate as ieCommentsStart,
      tg.IE_Comments_EndDate as ieCommentsEnd,
      tg.LE_Checking_StartDate as leCheckingStart,
      tg.LE_Checking_EndDate as leCheckingEnd
    FROM TG tg
    WHERE tg.TG_ID = ? AND tg.Status_Code != 'DEL'`,
    [id]
  );
};

/**
 * Find users assigned to a test guideline
 */
export const findUsersByTgId = async (id) => {
  return query(
    `SELECT
      up.User_ID as id,
      up.Full_Name as fullName,
      up.PrimaryEmail as email,
      tu.Role_Code as role
    FROM Tg_Users tu
    JOIN User_Profile up ON tu.User_ID = up.User_ID
    WHERE tu.TG_ID = ?`,
    [id]
  );
};

/**
 * Get aggregate statistics by status
 */
export const getStats = async () => {
  const stats = await queryOne(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN Status_Code = 'LED' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN Status_Code = 'IEC' THEN 1 ELSE 0 END) as ieComments,
      SUM(CASE WHEN Status_Code = 'LEC' THEN 1 ELSE 0 END) as leChecking,
      SUM(CASE WHEN Status_Code = 'ADO' THEN 1 ELSE 0 END) as adopted
    FROM TG
    WHERE Status_Code != 'DEL'
  `);

  return {
    total: parseInt(stats?.total || 0, 10),
    draft: parseInt(stats?.draft || 0, 10),
    ieComments: parseInt(stats?.ieComments || 0, 10),
    leChecking: parseInt(stats?.leChecking || 0, 10),
    adopted: parseInt(stats?.adopted || 0, 10),
  };
};
