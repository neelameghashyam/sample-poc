import { query, queryOne } from '../utils/db.js';

/**
 * Find user by username (case-insensitive)
 */
export const findByUsername = async (username) => {
  return queryOne(
    `SELECT
      up.User_ID as id,
      up.User_Name as userName,
      up.Full_Name as fullName,
      up.PrimaryEmail as email,
      up.Role_Code as roleCode,
      up.Status_Code as statusCode,
      up.Request_Status as requestStatus,
      up.Office_Code as officeCode,
      up.TWPS as twps
    FROM User_Profile up
    WHERE UPPER(up.User_Name) = UPPER(?)`,
    [username]
  );
};

/**
 * Create a new access request (insert user with Pending status)
 * Full_Name and PrimaryEmail come from SSO identity, PrimaryPhone defaults to '-'
 */
export const createAccessRequest = async ({ userName, fullName, email, officeCode, twps }) => {
  const result = await query(
    `INSERT INTO User_Profile (User_Name, Full_Name, PrimaryEmail, PrimaryPhone, Office_Code, TWPS, Role_Code, Status_Code, Request_Status, User_lastupdated, Created_Time)
     VALUES (?, ?, ?, '-', ?, ?, 'EXP', 'I', 'Pending', NOW(), NOW())`,
    [userName, fullName, email, officeCode, twps]
  );
  return result;
};

/**
 * Auto-provision an EntraID user (active admin with all TWPs)
 */
export const createEntraIdUser = async ({ userName, fullName, email }) => {
  const result = await query(
    `INSERT INTO User_Profile (User_Name, Full_Name, PrimaryEmail, PrimaryPhone, Office_Code, TWPS, Role_Code, Status_Code, Request_Status, User_lastupdated, Created_Time)
     VALUES (?, ?, ?, '-', 'UPOV', NULL, 'ADM', 'A', 'Accepted', NOW(), NOW())`,
    [userName, fullName, email]
  );
  return result;
};

/**
 * Update an existing access request (re-submit after rejection)
 */
export const updateAccessRequest = async (userId, { officeCode, twps }) => {
  return query(
    `UPDATE User_Profile
     SET Office_Code = ?, TWPS = ?, Request_Status = 'Pending'
     WHERE User_ID = ?`,
    [officeCode, twps, userId]
  );
};

/**
 * Sync SSO identity fields (Full_Name, PrimaryEmail) on every login
 */
export const syncUserIdentity = async (userId, { fullName, email }) => {
  return query(
    `UPDATE User_Profile
     SET Full_Name = ?, PrimaryEmail = ?, User_lastupdated = NOW()
     WHERE User_ID = ?`,
    [fullName, email, userId]
  );
};

/**
 * Find users by request status (e.g. 'Pending')
 */
export const findByRequestStatus = async (status) => {
  return query(
    `SELECT
      up.User_ID as id,
      up.User_Name as userName,
      up.Full_Name as fullName,
      up.PrimaryEmail as email,
      up.Office_Code as officeCode,
      up.TWPS as twps,
      up.Request_Status as requestStatus,
      o.Office_Name as officeName
    FROM User_Profile up
    LEFT JOIN Office o ON up.Office_Code = o.Office_Code
    WHERE up.Request_Status = ?
    ORDER BY up.User_ID DESC`,
    [status]
  );
};

/**
 * Approve a user access request
 */
export const approveUser = async (userId) => {
  return query(
    `UPDATE User_Profile
     SET Status_Code = 'A', Request_Status = 'Accepted'
     WHERE User_ID = ?`,
    [userId]
  );
};

/**
 * Reject a user access request
 */
export const rejectUser = async (userId) => {
  return query(
    `UPDATE User_Profile
     SET Status_Code = 'I', Request_Status = 'Rejected'
     WHERE User_ID = ?`,
    [userId]
  );
};

/**
 * Find all active users with office info
 */
export const findAllUsers = async () => {
  return query(
    `SELECT
      up.User_ID as id,
      up.User_Name as userName,
      up.Full_Name as fullName,
      up.PrimaryEmail as email,
      up.Role_Code as roleCode,
      up.Status_Code as statusCode,
      up.Request_Status as requestStatus,
      up.Office_Code as officeCode,
      o.Office_Name as officeName,
      up.TWPS as twps,
      up.User_lastupdated as lastUpdated,
      GROUP_CONCAT(DISTINCT tg.TG_Name ORDER BY tg.TG_Name SEPARATOR '||') as leTgNames
    FROM User_Profile up
    LEFT JOIN Office o ON up.Office_Code = o.Office_Code
    LEFT JOIN Tg_Users tu ON up.User_ID = tu.User_ID AND tu.Role_Code = 'LE'
    LEFT JOIN TG tg ON tu.TG_ID = tg.TG_ID AND tg.Status_Code <> 'DEL'
    WHERE up.Status_Code = 'A'
    GROUP BY up.User_ID
    ORDER BY up.Full_Name`
  );
};

/**
 * Find a single user by ID
 */
export const findUserById = async (id) => {
  return queryOne(
    `SELECT
      up.User_ID as id,
      up.User_Name as userName,
      up.Full_Name as fullName,
      up.PrimaryEmail as email,
      up.Role_Code as roleCode,
      up.Status_Code as statusCode,
      up.Request_Status as requestStatus,
      up.Office_Code as officeCode,
      o.Office_Name as officeName,
      up.TWPS as twps,
      up.User_lastupdated as lastUpdated
    FROM User_Profile up
    LEFT JOIN Office o ON up.Office_Code = o.Office_Code
    WHERE up.User_ID = ?`,
    [id]
  );
};

/**
 * Update a user's role code
 */
export const updateUserRole = async (id, roleCode) => {
  return query(
    `UPDATE User_Profile
     SET Role_Code = ?, User_lastupdated = NOW()
     WHERE User_ID = ?`,
    [roleCode, id]
  );
};

/**
 * Delete a user by ID
 */
export const deleteUser = async (id) => {
  return query(
    `DELETE FROM User_Profile WHERE User_ID = ?`,
    [id]
  );
};

/**
 * Count LE assignments for a user (to check before delete)
 */
export const countUserTgAssignments = async (userId) => {
  const row = await queryOne(
    `SELECT COUNT(*) as count FROM Tg_Users WHERE User_ID = ? AND Role_Code = 'LE'`,
    [userId]
  );
  return row.count;
};

/**
 * Auto-assign user as IE to all TGs matching their TWPs.
 * Join path: TG → TG_UPOVCode → Upov_Code → upovcode_twp.TWP
 * Skips TGs the user is already assigned to.
 */
export const assignUserToMatchingTgs = async (userId, twpsCsv) => {
  if (!twpsCsv) return 0;
  const twps = twpsCsv.split(',').map((t) => t.trim()).filter(Boolean);
  if (twps.length === 0) return 0;

  const placeholders = twps.map(() => '?').join(',');
  const result = await query(
    `INSERT INTO Tg_Users (TG_ID, User_ID, Role_Code, Status_Code, Language_Code)
     SELECT DISTINCT t.TG_ID, ?, 'IE', 'A', 'EN'
     FROM TG t
     JOIN TG_UPOVCode tuc ON t.TG_ID = tuc.TG_ID
     JOIN Upov_Code uc ON tuc.UpovCode_ID = uc.UpovCode_ID
     JOIN upovcode_twp ut ON ut.UPOV_CODE = REPLACE(REPLACE(REPLACE(uc.Upov_Code, '<p>', ''), '</p>', ''), '\r\n', '')
     WHERE ut.TWP IN (${placeholders})
       AND t.Status_Code <> 'DEL'
       AND NOT EXISTS (
         SELECT 1 FROM Tg_Users tu
         WHERE tu.TG_ID = t.TG_ID AND tu.User_ID = ?
       )`,
    [userId, ...twps, userId]
  );
  return result.affectedRows;
};

/**
 * Update a user's TWPs
 */
export const updateTwps = async (userId, twps) => {
  return query(
    `UPDATE User_Profile
     SET TWPS = ?, User_lastupdated = NOW()
     WHERE User_ID = ?`,
    [twps, userId]
  );
};

/**
 * Get all offices for autocomplete
 */
export const findAllOffices = async () => {
  const rows = await query(
    `SELECT Office_Code as code, Office_Name as name
     FROM Office
     ORDER BY Office_Name`
  );
  // Strip redundant code from name (e.g. "Albania, AL" → "Albania", "AFSTA, African Seed..." → "African Seed...")
  return rows.map((row) => ({
    ...row,
    name: row.name.replace(new RegExp(`(\\s*,\\s*)?\\b${row.code}\\b(\\s*,\\s*)?`), (match, before, after) => {
      // If code was between commas, collapse to single separator
      if (before && after) return ', ';
      return '';
    }).trim(),
  }));
};
