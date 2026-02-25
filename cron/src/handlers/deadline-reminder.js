/**
 * Deadline Reminder
 *
 * Sends email notifications to Lead Experts (LE) and Interested Experts (IE)
 * about upcoming deadlines.
 *
 * Runs daily at 4:10 AM UTC (after status updaters).
 *
 * Schedule: cron(10 4 * * ? *)
 */
import * as reminderRepo from '../repositories/reminder.js';
import { sendEmail, formatDate } from '../utils/mail.js';

// Reminder intervals (days before/after deadline)
const REMINDER_INTERVALS = {
  start: 0,      // On start date
  weekBefore: 7, // 7 days before end
};

export const handler = async (event) => {
  console.log('Deadline Reminder started');

  const results = {
    leDraft: { sent: 0, errors: 0 },
    ieComments: { sent: 0, errors: 0 },
    leChecking: { sent: 0, errors: 0 },
  };

  try {
    await sendReminders('LE Draft', 'LED', 'LE_Draft', 'LE', results.leDraft);
    await sendReminders('IE Comments', 'IEC', 'IE_Comments', 'IE', results.ieComments);
    await sendReminders('LE Checking', 'LEC', 'LE_Checking', 'LE', results.leChecking);

    console.log('Deadline Reminder completed', results);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Deadline reminders sent', results }),
    };
  } catch (error) {
    console.error('Deadline Reminder error:', error);
    throw error;
  }
};

async function sendReminders(phaseName, statusCode, datePrefix, roleCode, stats) {
  const startDateCol = `${datePrefix}_StartDate`;
  const endDateCol = `${datePrefix}_EndDate`;

  const startRecipients = await reminderRepo.findPhaseStartReminders(
    startDateCol, endDateCol, REMINDER_INTERVALS.start, statusCode, roleCode
  );

  const weekBeforeRecipients = await reminderRepo.findPhaseEndReminders(
    startDateCol, endDateCol, REMINDER_INTERVALS.weekBefore, statusCode, roleCode
  );

  // Group by recipient email
  const recipientMap = new Map();

  for (const r of [...startRecipients, ...weekBeforeRecipients]) {
    if (!recipientMap.has(r.email)) {
      recipientMap.set(r.email, {
        email: r.email,
        firstName: r.firstName,
        tgs: [],
      });
    }
    recipientMap.get(r.email).tgs.push({
      reference: r.tgReference,
      startDate: r.startDate,
      endDate: r.endDate,
    });
  }

  // Send emails
  for (const [email, recipient] of recipientMap) {
    try {
      const tgList = recipient.tgs
        .map((tg) => `<li>${tg.reference} <b>(${formatDate(tg.startDate)} - ${formatDate(tg.endDate)})</b></li>`)
        .join('\n');

      const htmlBody = `
        <p>Dear ${recipient.firstName || 'Colleague'},</p>
        <p>This is a reminder about the following Test Guidelines in the <b>${phaseName}</b> phase:</p>
        <ul>${tgList}</ul>
        <p>Please visit the <a href="https://www3.wipo.int/upovtg">TG Template application</a> to take action.</p>
        <p>Best regards,<br/>UPOV TG Template System</p>
      `;

      await sendEmail({
        to: email,
        subject: `TG Template - ${phaseName} Reminder`,
        htmlBody,
      });

      stats.sent++;
    } catch (error) {
      console.error(`Failed to send email to ${email}:`, error.message);
      stats.errors++;
    }
  }

  console.log(`${phaseName}: sent ${stats.sent}, errors ${stats.errors}`);
}
