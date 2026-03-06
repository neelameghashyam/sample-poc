import { generateTGWordDocument } from '../services/doc-generator.service.js';

/**
 * GET /api/test-guidelines/:id/doc-generate
 *
 * Query params:
 *   date  - optional, format yyyy-MM-dd  (report date for non-adopted TGs)
 *   lang  - optional, one of: en, fr, de, es  (defaults to en)
 *
 * Returns a .docx file as an octet-stream download.
 */
export const generateDoc = async (c) => {
  const id = c.req.param('id');
  const lang = c.req.query('lang') || 'en';
  const dateParam = c.req.query('date');

  const tgId = parseInt(id, 10);
  if (!id || isNaN(tgId)) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Valid TG ID is required' } }, 400);
  }

  // Validate lang
  const supportedLangs = ['en', 'fr', 'de', 'es'];
  const normalizedLang = supportedLangs.includes(lang.toLowerCase()) ? lang.toLowerCase() : 'en';

  // Parse optional report date
  let reportDate = null;
  if (dateParam) {
    reportDate = new Date(dateParam);
    if (isNaN(reportDate.getTime())) {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid date format. Use yyyy-MM-dd' } }, 400);
    }
  }

  try {
    console.log(`[DocGen] Generating document for TG_ID=${tgId} lang=${normalizedLang} date=${dateParam || 'now'}`);

    const docBuffer = await generateTGWordDocument(tgId, reportDate, normalizedLang);

    if (!docBuffer) {
      return c.json({ error: { code: 'NOT_FOUND', message: `No test guideline found for ID ${tgId}` } }, 404);
    }

    const filename = `TG_${tgId}_${normalizedLang}.docx`;

    return new Response(docBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(docBuffer.length),
        'charset': 'utf-8',
      },
    });
  } catch (err) {
    console.error('[DocGen] Error generating document:', err);
    return c.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate document',
        detail: err.message,
      },
    }, 500);
  }
};