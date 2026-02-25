import { queryOne } from '../utils/db.js';

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
      up.Role_Code as roleCode
    FROM User_Profile up
    WHERE UPPER(up.User_Name) = UPPER(?)`,
    [username]
  );
};
