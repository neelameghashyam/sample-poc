import { generateChapterHtml, MIN_CHAPTER, MAX_CHAPTER } from '../services/doc-preview.service.js';

/**
 * GET /api/doc-generate/:id/chapter/:chapterNumber
 *
 * Path params:
 *   id            - Test Guideline ID (integer)
 *   chapterNumber - Chapter to preview:
 *                     0  = Cover page
 *                     1  = Subject of Test Guidelines
 *                     2  = Material Required
 *                     3  = Method of Examination
 *                     4  = Assessment of DUS
 *                     5  = Grouping of Varieties
 *                     6  = Categories of Characteristics
 *                     7  = Table of Characteristics
 *                     8  = Explanations
 *                     9  = Literature
 *                     10 = Technical Questionnaire
 *                     11 = Annex
 *
 * Query params:
 *   lang - optional, one of: en, fr, de, es  (default: en)
 *
 * Returns: text/html  — full HTML document for UI preview
 */
export const previewChapter = async (c) => {
  const id             = c.req.param('id');
  const chapterParam   = c.req.param('chapterNumber');
  const lang           = c.req.query('lang') || 'en';

  // ── Validate TG ID ──────────────────────────────────────────────────────────
  const tgId = parseInt(id, 10);
  if (!id || isNaN(tgId)) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Valid TG ID is required' } }, 400);
  }

  // ── Validate chapter number ─────────────────────────────────────────────────
  const chapterNumber = parseInt(chapterParam, 10);
  if (isNaN(chapterNumber) || chapterNumber < MIN_CHAPTER || chapterNumber > MAX_CHAPTER) {
    return c.json({
      error: {
        code: 'BAD_REQUEST',
        message: `Invalid chapter number. Must be ${MIN_CHAPTER}–${MAX_CHAPTER} `
               + `(0=Cover, 1-10=Chapters, 11=Annex)`,
      },
    }, 400);
  }

  // ── Validate language ───────────────────────────────────────────────────────
  const supportedLangs  = ['en', 'fr', 'de', 'es'];
  const normalizedLang  = supportedLangs.includes(lang.toLowerCase()) ? lang.toLowerCase() : 'en';

  try {
    console.log(`[DocPreview] TG_ID=${tgId} chapter=${chapterNumber} lang=${normalizedLang}`);

    const html = await generateChapterHtml(tgId, chapterNumber, normalizedLang);

    if (!html) {
      return c.json({
        error: { code: 'NOT_FOUND', message: `No test guideline found for ID ${tgId}` },
      }, 404);
    }

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type':  'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    // Mirrors Java GlobalExceptionHandler — 400 for invalid chapter, 500 for everything else
    if (err.message?.startsWith('Chapter ')) {
      return c.json({ error: { code: 'BAD_REQUEST', message: err.message } }, 400);
    }
    console.error('[DocPreview] Error generating chapter HTML:', err);
    return c.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate chapter preview',
        detail: err.message,
      },
    }, 500);
  }
};