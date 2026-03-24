import { query, queryOne } from '../utils/db.js';

/**
 * List all technical body sessions, optionally filtered by year
 */
export const findAll = async (year = null) => {
  let sql = `
    SELECT
      TB_CodeID as id,
      TB_Code as code,
      TB_Desc as description,
      TB_Year as year,
      CPI_AtIts as session,
      CPI_Tobeheldin as location,
      DATE_FORMAT(CPI_DateFrom, '%Y-%m-%d') as dateFrom,
      DATE_FORMAT(CPI_DateTo, '%Y-%m-%d') as dateTo,
      DATE_FORMAT(LE_Draft_StartDate, '%Y-%m-%d') as leDraftStart,
      DATE_FORMAT(LE_Draft_EndDate, '%Y-%m-%d') as leDraftEnd,
      DATE_FORMAT(IE_Comments_StartDate, '%Y-%m-%d') as ieCommentsStart,
      DATE_FORMAT(IE_Comments_EndDate, '%Y-%m-%d') as ieCommentsEnd,
      DATE_FORMAT(LE_Checking_StartDate, '%Y-%m-%d') as leCheckingStart,
      DATE_FORMAT(LE_Checking_EndDate, '%Y-%m-%d') as leCheckingEnd,
      DATE_FORMAT(Send_TO_UPOVDate, '%Y-%m-%d') as sentToUpov,
      DATE_FORMAT(TG_Translator_StartDate, '%Y-%m-%d') as translationStart,
      DATE_FORMAT(TG_Translator_EndDate, '%Y-%m-%d') as translationEnd,
      DATE_FORMAT(TG_AdoptionDate, '%Y-%m-%d') as adoptionDate
    FROM technical_body
    WHERE TB_Code NOT IN ('', '-1')`;
  const params = [];

  if (year) {
    sql += ' AND TB_Year = ?';
    params.push(year);
  }

  sql += ' ORDER BY TB_Year DESC, TB_Code';
  return query(sql, params);
};

/**
 * Get distinct years that have technical body sessions
 */
export const findYears = async () => {
  const rows = await query(
    `SELECT DISTINCT TB_Year as year
     FROM technical_body
     WHERE TB_Code NOT IN ('', '-1') AND TB_Year IS NOT NULL
     ORDER BY TB_Year DESC`
  );
  return rows.map((r) => r.year);
};

/**
 * Get distinct body codes with descriptions
 */
export const findBodies = async () => {
  return query(
    `SELECT DISTINCT TB_Code as code, TB_Desc as description
     FROM technical_body
     WHERE TB_Code NOT IN ('', '-1') AND TB_Desc IS NOT NULL
     ORDER BY TB_Code`
  );
};

/**
 * Get a single technical body session by ID
 */
export const findById = async (id) => {
  return queryOne(
    `SELECT
      TB_CodeID as id,
      TB_Code as code,
      TB_Desc as description,
      TB_Year as year,
      CPI_AtIts as session,
      CPI_Tobeheldin as location,
      DATE_FORMAT(CPI_DateFrom, '%Y-%m-%d') as dateFrom,
      DATE_FORMAT(CPI_DateTo, '%Y-%m-%d') as dateTo,
      DATE_FORMAT(LE_Draft_StartDate, '%Y-%m-%d') as leDraftStart,
      DATE_FORMAT(LE_Draft_EndDate, '%Y-%m-%d') as leDraftEnd,
      DATE_FORMAT(IE_Comments_StartDate, '%Y-%m-%d') as ieCommentsStart,
      DATE_FORMAT(IE_Comments_EndDate, '%Y-%m-%d') as ieCommentsEnd,
      DATE_FORMAT(LE_Checking_StartDate, '%Y-%m-%d') as leCheckingStart,
      DATE_FORMAT(LE_Checking_EndDate, '%Y-%m-%d') as leCheckingEnd,
      DATE_FORMAT(Send_TO_UPOVDate, '%Y-%m-%d') as sentToUpov,
      DATE_FORMAT(TG_Translator_StartDate, '%Y-%m-%d') as translationStart,
      DATE_FORMAT(TG_Translator_EndDate, '%Y-%m-%d') as translationEnd,
      DATE_FORMAT(TG_AdoptionDate, '%Y-%m-%d') as adoptionDate
    FROM technical_body
    WHERE TB_CodeID = ?`,
    [id]
  );
};

/**
 * Update a technical body session
 */
export const update = async (id, data) => {
  const fields = [];
  const params = [];

  const map = {
    session: 'CPI_AtIts',
    location: 'CPI_Tobeheldin',
    dateFrom: 'CPI_DateFrom',
    dateTo: 'CPI_DateTo',
    leDraftStart: 'LE_Draft_StartDate',
    leDraftEnd: 'LE_Draft_EndDate',
    ieCommentsStart: 'IE_Comments_StartDate',
    ieCommentsEnd: 'IE_Comments_EndDate',
    leCheckingStart: 'LE_Checking_StartDate',
    leCheckingEnd: 'LE_Checking_EndDate',
    sentToUpov: 'Send_TO_UPOVDate',
    translationStart: 'TG_Translator_StartDate',
    translationEnd: 'TG_Translator_EndDate',
    adoptionDate: 'TG_AdoptionDate',
  };

  for (const [key, col] of Object.entries(map)) {
    if (key in data) {
      fields.push(`${col} = ?`);
      params.push(data[key] || null);
    }
  }

  if (fields.length === 0) return;

  params.push(id);
  await query(
    `UPDATE technical_body SET ${fields.join(', ')} WHERE TB_CodeID = ?`,
    params
  );
};

/**
 * Create a new technical body session
 */
export const create = async (data) => {
  const result = await query(
    `INSERT INTO technical_body (TB_Code, TB_Desc, TB_Year, CPI_AtIts, CPI_Tobeheldin,
      CPI_DateFrom, CPI_DateTo,
      LE_Draft_StartDate, LE_Draft_EndDate,
      IE_Comments_StartDate, IE_Comments_EndDate,
      LE_Checking_StartDate, LE_Checking_EndDate,
      Send_TO_UPOVDate, TG_Translator_StartDate, TG_Translator_EndDate, TG_AdoptionDate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.code, data.description || null, data.year,
      data.session || null, data.location || null,
      data.dateFrom || null, data.dateTo || null,
      data.leDraftStart || null, data.leDraftEnd || null,
      data.ieCommentsStart || null, data.ieCommentsEnd || null,
      data.leCheckingStart || null, data.leCheckingEnd || null,
      data.sentToUpov || null, data.translationStart || null,
      data.translationEnd || null, data.adoptionDate || null,
    ]
  );
  return result.insertId;
};

/**
 * Get the previous year's meeting end date for a given body code and year.
 */
export const findPreviousMeetingEnd = async (code, year) => {
  const row = await queryOne(
    `SELECT DATE_FORMAT(CPI_DateTo, '%Y-%m-%d') as dateTo
     FROM technical_body
     WHERE TB_Code = ? AND TB_Year < ? AND CPI_DateTo IS NOT NULL
     ORDER BY TB_Year DESC
     LIMIT 1`,
    [code, year]
  );
  return row?.dateTo || null;
};

/**
 * Delete a technical body session
 */
export const remove = async (id) => {
  await query('DELETE FROM technical_body WHERE TB_CodeID = ?', [id]);
};
