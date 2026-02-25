import { query } from '../utils/db.js';

export const findPhaseStartReminders = async (startDateCol, endDateCol, daysOffset, statusCode, roleCode) => {
  return query(`
    SELECT
      tg.TG_ID as tgId,
      tg.TG_Reference as tgReference,
      tg.${startDateCol} as startDate,
      tg.${endDateCol} as endDate,
      up.User_ID as userId,
      up.PrimaryEmail as email,
      up.FirstName as firstName
    FROM TG tg
    JOIN Tg_Users tu ON tg.TG_ID = tu.TG_ID
    JOIN User_Profile up ON tu.User_ID = up.User_ID
    WHERE DATE(tg.${startDateCol}) = CURRENT_DATE + INTERVAL ? DAY
      AND tg.Status_Code = ?
      AND tu.Role_Code = ?
  `, [daysOffset, statusCode, roleCode]);
};

export const findPhaseEndReminders = async (startDateCol, endDateCol, daysOffset, statusCode, roleCode) => {
  return query(`
    SELECT
      tg.TG_ID as tgId,
      tg.TG_Reference as tgReference,
      tg.${startDateCol} as startDate,
      tg.${endDateCol} as endDate,
      up.User_ID as userId,
      up.PrimaryEmail as email,
      up.FirstName as firstName
    FROM TG tg
    JOIN Tg_Users tu ON tg.TG_ID = tu.TG_ID
    JOIN User_Profile up ON tu.User_ID = up.User_ID
    WHERE DATE(tg.${endDateCol}) = CURRENT_DATE + INTERVAL ? DAY
      AND tg.Status_Code = ?
      AND tu.Role_Code = ?
  `, [daysOffset, statusCode, roleCode]);
};
