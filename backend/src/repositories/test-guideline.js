import { query, queryOne } from '../utils/db.js';

/**
 * List test guidelines with optional status filter
 */
const INACTIVE_STATUSES = ['DEL', 'ADT', 'ABT', 'SSD', 'ARC'];

const TG_JOINS = `
    LEFT JOIN Tg_Users tu ON tg.TG_ID = tu.TG_ID AND tu.Role_Code = 'LE'
    LEFT JOIN User_Profile up ON tu.User_ID = up.User_ID
    LEFT JOIN TG_UPOVCode tuc ON tg.TG_ID = tuc.TG_ID
    LEFT JOIN Upov_Code uc ON tuc.UpovCode_ID = uc.UpovCode_ID`;

function addTabFilter(tab, status) {
  let sql = '';
  const params = [];
  if (tab === 'twp-drafts' || tab === 'tc-drafts') {
    const ph = INACTIVE_STATUSES.map(() => '?').join(', ');
    sql = ` AND tg.Status_Code NOT IN (${ph})`;
    params.push(...INACTIVE_STATUSES);
  } else if (tab === 'adopted') {
    sql = ` AND tg.Status_Code = ?`;
    params.push('ADT');
  } else if (tab === 'archived') {
    sql = ` AND tg.Status_Code = ?`;
    params.push('ARC');
  } else if (tab === 'aborted') {
    sql = ` AND tg.Status_Code = ?`;
    params.push('ABT');
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

  if (filters.search) {
    whereSql += ' AND (tg.TG_Reference LIKE ? OR tg.TG_Name LIKE ? OR up.Full_Name LIKE ?)';
    const term = `%${filters.search}%`;
    whereParams.push(term, term, term);
  }
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
    havingConds.push("GROUP_CONCAT(DISTINCT uc.Upov_Code ORDER BY tuc.seqNumber SEPARATOR '||') LIKE ?");
    havingParams.push(`%${filters.upovCodes}%`);
  }
  if (filters.twp) {
    const twpValues = filters.twp.split(',').map((t) => t.trim()).filter(Boolean);
    if (twpValues.length === 1) {
      whereSql += ' AND tg.CPI_TechWorkParty = ?';
      whereParams.push(twpValues[0]);
    } else if (twpValues.length > 1) {
      const ph = twpValues.map(() => '?').join(',');
      whereSql += ` AND tg.CPI_TechWorkParty IN (${ph})`;
      whereParams.push(...twpValues);
    }
  }

  const havingSql = havingConds.length ? ` HAVING ${havingConds.join(' AND ')}` : '';
  const needsJoins = !!(filters.search || filters.leadExpert || filters.upovCodes);
  return { whereSql, whereParams, havingSql, havingParams, needsJoins };
}

export const findAll = async ({ tab, status, limit, offset, filters = {}, sortDir, userTwps = null }) => {
  let sql = `
    SELECT
      tg.TG_ID as id,
      tg.TG_Reference as reference,
      tg.TG_Name as name,
      tg.Status_Code as status,
      tg.TG_LastUpdated as lastUpdated,
      tg.TG_AdoptionDate as adoptionDate,
      (SELECT MAX(h.Modification_Time) FROM tg_history_log h WHERE h.TG_ID = tg.TG_ID AND h.Status_Code = tg.Status_Code) as statusDate,
      up.Full_Name as leadExpert,
      up.Office_Code as leadExpertCountry,
      GROUP_CONCAT(DISTINCT uc.Upov_Code ORDER BY tuc.seqNumber SEPARATOR '||') as upovCodes,
      tg.CPI_TechWorkParty as twps,
      (SELECT COUNT(*) FROM TG_IEComments ic WHERE ic.TG_ID = tg.TG_ID AND ic.Comments != '') as ieCommentCount,
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

  // Scope to user's TWPs (non-admin)
  const twpCond = addUserTwpFilter(userTwps);
  sql += twpCond.sql;
  params.push(...twpCond.params);

  const fc = addFilterConditions(filters);
  sql += fc.whereSql;
  params.push(...fc.whereParams);

  sql += ' GROUP BY tg.TG_ID';
  sql += fc.havingSql;
  params.push(...fc.havingParams);

  const order = sortDir === 'asc' ? 'ASC' : 'DESC';
  let orderCol = 'tg.TG_LastUpdated';
  if (tab === 'adopted') orderCol = 'tg.TG_AdoptionDate';
  else if (tab === 'archived' || tab === 'submitted' || tab === 'aborted') orderCol = 'statusDate';
  sql += ` ORDER BY ${orderCol} ${order}`;

  if (limit != null) {
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
  }

  return query(sql, params);
};

/**
 * Count test guidelines for a given tab (excluding deleted)
 */
function addUserTwpFilter(userTwps) {
  if (!userTwps) return { sql: '', params: [] };
  const twpList = userTwps.split(',').map((t) => t.trim()).filter(Boolean);
  if (twpList.length === 0) return { sql: '', params: [] };
  const ph = twpList.map(() => '?').join(',');
  return {
    sql: ` AND tg.CPI_TechWorkParty IN (${ph})`,
    params: twpList,
  };
}

export const countAll = async (tab, filters = {}, userTwps = null) => {
  const tabCond = addTabFilter(tab);
  const fc = addFilterConditions(filters);
  const twpCond = addUserTwpFilter(userTwps);

  if (!fc.needsJoins) {
    // Simple count — no joins needed
    let sql = `SELECT COUNT(*) as total FROM TG tg WHERE tg.Status_Code != ?`;
    const params = ['DEL'];
    sql += tabCond.sql;
    params.push(...tabCond.params);
    sql += twpCond.sql;
    params.push(...twpCond.params);
    sql += fc.whereSql;
    params.push(...fc.whereParams);
    const result = await queryOne(sql, params);
    return parseInt(result?.total || 0, 10);
  }

  // Needs joins for leadExpert / upovCodes filters
  let sql = `SELECT COUNT(*) as total FROM (
    SELECT tg.TG_ID FROM TG tg ${TG_JOINS}
    WHERE tg.Status_Code != ?`;
  const params = ['DEL'];
  sql += tabCond.sql;
  params.push(...tabCond.params);
  sql += twpCond.sql;
  params.push(...twpCond.params);
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
 * Count TGs grouped by TWP for a given tab.
 * Returns { TWA: n, TWF: n, TWO: n, TWV: n }
 */
export const countByTwp = async (tab, userTwps = null) => {
  const tabCond = addTabFilter(tab);
  const twpCond = addUserTwpFilter(userTwps);

  const sql = `
    SELECT tg.CPI_TechWorkParty as twp, COUNT(*) as count
    FROM TG tg
    WHERE tg.Status_Code != 'DEL'
    ${tabCond.sql}
    ${twpCond.sql}
    AND tg.CPI_TechWorkParty IS NOT NULL
    GROUP BY tg.CPI_TechWorkParty`;

  const rows = await query(sql, [...tabCond.params, ...twpCond.params]);
  const counts = {};
  for (const r of rows) counts[r.twp] = r.count;
  return counts;
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
      tg.AdminComments as adminComments,
      (SELECT GROUP_CONCAT(DISTINCT uc.Upov_Code ORDER BY tuc.seqNumber SEPARATOR '||')
       FROM TG_UPOVCode tuc
       JOIN Upov_Code uc ON tuc.UpovCode_ID = uc.UpovCode_ID
       WHERE tuc.TG_ID = tg.TG_ID) as upovCodes
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
 * Find IE comments for a test guideline
 */
export const findIeComments = async (id) => {
  return query(
    `SELECT
      ic.IEComments_ID as id,
      ic.Chapter_Name as chapterName,
      ic.Section_Name as sectionName,
      ic.Comments as comments,
      ic.LastUpdated as lastUpdated,
      up.Full_Name as ieName,
      up.Office_Code as ieCountry
    FROM TG_IEComments ic
    JOIN User_Profile up ON ic.User_ID = up.User_ID
    WHERE ic.TG_ID = ? AND ic.Comments != ''
    ORDER BY ic.Chapter_Name, ic.Section_Name`,
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
export const getStats = async (userTwps = null) => {
  const twpCond = addUserTwpFilter(userTwps);
  const inactivePh = INACTIVE_STATUSES.map(() => '?').join(',');
  const stats = await queryOne(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN tg.Status_Code = 'LED' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN tg.Status_Code = 'IEC' THEN 1 ELSE 0 END) as ieComments,
      SUM(CASE WHEN tg.Status_Code = 'LEC' THEN 1 ELSE 0 END) as leChecking,
      SUM(CASE WHEN tg.Status_Code NOT IN (${inactivePh}) THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN tg.Status_Code = 'ADT' THEN 1 ELSE 0 END) as adopted,
      SUM(CASE WHEN tg.Status_Code = 'ARC' THEN 1 ELSE 0 END) as archive,
      SUM(CASE WHEN tg.Status_Code = 'STU' THEN 1 ELSE 0 END) as submitted,
      SUM(CASE WHEN tg.Status_Code = 'ABT' THEN 1 ELSE 0 END) as aborted
    FROM TG tg
    WHERE tg.Status_Code != 'DEL'
    ${twpCond.sql}
  `, [...INACTIVE_STATUSES, ...twpCond.params]);

  return {
    total: parseInt(stats?.total || 0, 10),
    draft: parseInt(stats?.draft || 0, 10),
    ieComments: parseInt(stats?.ieComments || 0, 10),
    leChecking: parseInt(stats?.leChecking || 0, 10),
    active: parseInt(stats?.active || 0, 10),
    adopted: parseInt(stats?.adopted || 0, 10),
    archive: parseInt(stats?.archive || 0, 10),
    submitted: parseInt(stats?.submitted || 0, 10),
    aborted: parseInt(stats?.aborted || 0, 10),
  };
};
