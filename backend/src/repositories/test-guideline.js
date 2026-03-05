import { query, queryOne } from '../utils/db.js';

/**
 * List test guidelines with optional status filter
 */
const INACTIVE_STATUSES = ['DEL', 'STU', 'ADT', 'ABT', 'SSD', 'ARC'];
const ADOPTED_STATUSES = ['ADT', 'ABT'];
const ARCHIVE_STATUSES = ['STU', 'ARC'];

const TG_JOINS = `
    LEFT JOIN Tg_Users tu ON tg.TG_ID = tu.TG_ID AND tu.Role_Code = 'LE'
    LEFT JOIN User_Profile up ON tu.User_ID = up.User_ID
    LEFT JOIN TG_UPOVCode tuc ON tg.TG_ID = tuc.TG_ID
    LEFT JOIN Upov_Code uc ON tuc.UpovCode_ID = uc.UpovCode_ID
    LEFT JOIN upovcode_twp utwp ON utwp.UPOV_CODE = REPLACE(REPLACE(REPLACE(uc.Upov_Code, '<p>', ''), '</p>', ''), '\\r\\n', '')`;

function addTabFilter(tab, status) {
  let sql = '';
  const params = [];
  if (tab === 'active') {
    const ph = INACTIVE_STATUSES.map(() => '?').join(', ');
    sql = ` AND tg.Status_Code NOT IN (${ph})`;
    params.push(...INACTIVE_STATUSES);
  } else if (tab === 'adopted') {
    const ph = ADOPTED_STATUSES.map(() => '?').join(', ');
    sql = ` AND tg.Status_Code IN (${ph})`;
    params.push(...ADOPTED_STATUSES);
  } else if (tab === 'archived') {
    const ph = ARCHIVE_STATUSES.map(() => '?').join(', ');
    sql = ` AND tg.Status_Code IN (${ph})`;
    params.push(...ARCHIVE_STATUSES);
  } else if (status) {
    sql = ' AND tg.Status_Code = ?';
    params.push(status);
  }
  return { sql, params };
}

function addFilterConditions(filters = {}) {
  let whereSql = '';
  const whereParams = [];
  const havingConds = [];
  const havingParams = [];

  if (filters.name) {
    whereSql += ' AND tg.TG_Name LIKE ?';
    whereParams.push(`%${filters.name}%`);
  }
  if (filters.reference) {
    whereSql += ' AND tg.TG_Reference LIKE ?';
    whereParams.push(`%${filters.reference}%`);
  }
  if (filters.leadExpert) {
    whereSql += ' AND up.Full_Name LIKE ?';
    whereParams.push(`%${filters.leadExpert}%`);
  }
  if (filters.status) {
    whereSql += ' AND tg.Status_Code = ?';
    whereParams.push(filters.status);
  }
  if (filters.upovCodes) {
    havingConds.push("GROUP_CONCAT(DISTINCT REPLACE(REPLACE(REPLACE(uc.Upov_Code, '<p>', ''), '</p>', ''), '\\r\\n', '') ORDER BY tuc.seqNumber SEPARATOR '||') LIKE ?");
    havingParams.push(`%${filters.upovCodes}%`);
  }
  if (filters.twps) {
    havingConds.push("FIND_IN_SET(?, GROUP_CONCAT(DISTINCT utwp.TWP SEPARATOR ',')) > 0");
    havingParams.push(filters.twps);
  }

  const havingSql = havingConds.length ? ` HAVING ${havingConds.join(' AND ')}` : '';
  const needsJoins = !!(filters.leadExpert || filters.upovCodes || filters.twps);
  return { whereSql, whereParams, havingSql, havingParams, needsJoins };
}

export const findAll = async ({ tab, status, limit, offset, filters = {}, sortDir }) => {
  let sql = `
    SELECT
      tg.TG_ID as id,
      tg.TG_Reference as reference,
      tg.TG_Name as name,
      tg.Status_Code as status,
      tg.TG_LastUpdated as lastUpdated,
      up.Full_Name as leadExpert,
      up.Office_Code as leadExpertCountry,
      GROUP_CONCAT(DISTINCT uc.Upov_Code ORDER BY tuc.seqNumber SEPARATOR '||') as upovCodes,
      GROUP_CONCAT(DISTINCT utwp.TWP SEPARATOR ',') as twps,
      CASE tg.Status_Code
        WHEN 'LED' THEN tg.LE_Draft_StartDate
        WHEN 'IEC' THEN tg.IE_Comments_StartDate
        WHEN 'LEC' THEN tg.LE_Checking_StartDate
        ELSE NULL
      END as periodStart,
      CASE tg.Status_Code
        WHEN 'LED' THEN tg.LE_Draft_EndDate
        WHEN 'IEC' THEN tg.IE_Comments_EndDate
        WHEN 'LEC' THEN tg.LE_Checking_EndDate
        ELSE NULL
      END as periodEnd
    FROM TG tg ${TG_JOINS}
    WHERE tg.Status_Code != 'DEL'
  `;

  const params = [];
  const tabCond = addTabFilter(tab, status);
  sql += tabCond.sql;
  params.push(...tabCond.params);

  const fc = addFilterConditions(filters);
  sql += fc.whereSql;
  params.push(...fc.whereParams);

  sql += ' GROUP BY tg.TG_ID';
  sql += fc.havingSql;
  params.push(...fc.havingParams);

  const order = sortDir === 'asc' ? 'ASC' : 'DESC';
  sql += ` ORDER BY tg.TG_LastUpdated ${order}`;

  if (limit != null) {
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
  }

  return query(sql, params);
};

/**
 * Count test guidelines for a given tab (excluding deleted)
 */
export const countAll = async (tab, filters = {}) => {
  const tabCond = addTabFilter(tab);
  const fc = addFilterConditions(filters);

  if (!fc.needsJoins) {
    // Simple count — no joins needed
    let sql = `SELECT COUNT(*) as total FROM TG tg WHERE tg.Status_Code != ?`;
    const params = ['DEL'];
    sql += tabCond.sql;
    params.push(...tabCond.params);
    sql += fc.whereSql;
    params.push(...fc.whereParams);
    const result = await queryOne(sql, params);
    return parseInt(result?.total || 0, 10);
  }

  // Needs joins for leadExpert / upovCodes / twps filters
  let sql = `SELECT COUNT(*) as total FROM (
    SELECT tg.TG_ID FROM TG tg ${TG_JOINS}
    WHERE tg.Status_Code != ?`;
  const params = ['DEL'];
  sql += tabCond.sql;
  params.push(...tabCond.params);
  sql += fc.whereSql;
  params.push(...fc.whereParams);
  sql += ' GROUP BY tg.TG_ID';
  sql += fc.havingSql;
  params.push(...fc.havingParams);
  sql += ') as sub';
  const result = await queryOne(sql, params);
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
      tg.LE_Checking_EndDate as leCheckingEnd,
      tg.AdminComments as adminComments
    FROM TG tg
    WHERE tg.TG_ID = ? AND tg.Status_Code != 'DEL'`,
    [id]
  );
};

/**
 * Count IE comments for a test guideline
 */
export const countIeComments = async (id) => {
  const result = await queryOne(
    `SELECT COUNT(*) as total FROM TG_IEComments WHERE TG_ID = ? AND Comments != ''`,
    [id]
  );
  return parseInt(result?.total || 0, 10);
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
      tu.Role_Code as role,
      up.Office_Code as country
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
      SUM(CASE WHEN Status_Code NOT IN ('DEL', 'STU', 'ADT', 'ABT', 'SSD', 'ARC') THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN Status_Code IN ('ADT', 'ABT') THEN 1 ELSE 0 END) as adopted,
      SUM(CASE WHEN Status_Code IN ('STU', 'ARC') THEN 1 ELSE 0 END) as archive
    FROM TG
    WHERE Status_Code != 'DEL'
  `);

  return {
    total: parseInt(stats?.total || 0, 10),
    draft: parseInt(stats?.draft || 0, 10),
    ieComments: parseInt(stats?.ieComments || 0, 10),
    leChecking: parseInt(stats?.leChecking || 0, 10),
    active: parseInt(stats?.active || 0, 10),
    adopted: parseInt(stats?.adopted || 0, 10),
    archive: parseInt(stats?.archive || 0, 10),
  };
};
