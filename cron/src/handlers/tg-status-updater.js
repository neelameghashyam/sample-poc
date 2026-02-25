/**
 * TG Status Updater
 *
 * Automatically transitions TG status based on deadline dates.
 * Runs daily at 4:00 AM UTC.
 *
 * Schedule: cron(0 4 * * ? *)
 */
import * as tgStatusRepo from '../repositories/tg-status.js';

export const handler = async (event) => {
  console.log('TG Status Updater started');

  const results = {
    leDraft: 0,
    ieComments: 0,
    leChecking: 0,
    leSignedOff: 0,
    study: 0,
  };

  try {
    // Log TGs that will be updated
    const toUpdate = await tgStatusRepo.findTGsWithDateToday();

    if (toUpdate.length > 0) {
      console.log('TGs to update:', toUpdate);
    }

    const ledResult = await tgStatusRepo.updateToLEDraft();
    results.leDraft = ledResult.affectedRows;
    console.log(`Updated to LE Draft: ${results.leDraft}`);

    const iecResult = await tgStatusRepo.updateToIEComments();
    results.ieComments = iecResult.affectedRows;
    console.log(`Updated to IE Comments: ${results.ieComments}`);

    const lecResult = await tgStatusRepo.updateToLEChecking();
    results.leChecking = lecResult.affectedRows;
    console.log(`Updated to LE Checking: ${results.leChecking}`);

    const lesResult = await tgStatusRepo.updateToLESignedOff();
    results.leSignedOff = lesResult.affectedRows;
    console.log(`Updated to LE Signed Off: ${results.leSignedOff}`);

    const stuResult = await tgStatusRepo.updateToStudy();
    results.study = stuResult.affectedRows;
    console.log(`Updated to Study: ${results.study}`);

    console.log('TG Status Updater completed', results);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'TG status update completed', results }),
    };
  } catch (error) {
    console.error('TG Status Updater error:', error);
    throw error;
  }
};
