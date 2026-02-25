import { query, execute } from '../utils/db.js';

export const findTGsWithDateToday = async () => {
  return query(`
    SELECT TG_Reference, Status_Code
    FROM TG
    WHERE (
      LE_Draft_StartDate = CURRENT_DATE OR
      IE_Comments_StartDate = CURRENT_DATE OR
      LE_Checking_StartDate = CURRENT_DATE OR
      DATE(LE_Checking_EndDate) + INTERVAL 1 DAY = CURRENT_DATE OR
      LE_Draft_EndDate = CURRENT_DATE OR
      LE_Checking_EndDate = CURRENT_DATE
    ) AND Status_Code != 'DEL'
  `);
};

export const updateToLEDraft = async () => {
  return execute(`
    UPDATE TG
    SET TG_LastUpdated = CURRENT_TIMESTAMP, Status_Code = 'LED'
    WHERE LE_Draft_StartDate = CURRENT_DATE AND Status_Code != 'DEL'
  `);
};

export const updateToIEComments = async () => {
  return execute(`
    UPDATE TG
    SET TG_LastUpdated = CURRENT_TIMESTAMP, Status_Code = 'IEC'
    WHERE IE_Comments_StartDate = CURRENT_DATE AND Status_Code != 'DEL'
  `);
};

export const updateToLEChecking = async () => {
  return execute(`
    UPDATE TG
    SET TG_LastUpdated = CURRENT_TIMESTAMP, Status_Code = 'LEC'
    WHERE LE_Checking_StartDate = CURRENT_DATE AND Status_Code != 'DEL'
  `);
};

export const updateToLESignedOff = async () => {
  return execute(`
    UPDATE TG
    SET TG_LastUpdated = CURRENT_TIMESTAMP, Status_Code = 'LES'
    WHERE DATE(LE_Checking_EndDate) + INTERVAL 1 DAY = CURRENT_DATE AND Status_Code != 'DEL'
  `);
};

export const updateToStudy = async () => {
  return execute(`
    UPDATE TG
    SET CPI_date = CURRENT_TIMESTAMP, Status_Code = 'STU'
    WHERE (LE_Draft_EndDate = CURRENT_DATE OR LE_Checking_EndDate = CURRENT_DATE) AND Status_Code != 'DEL'
  `);
};
