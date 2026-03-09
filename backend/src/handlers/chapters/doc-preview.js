/**
 * GET /api/test-guidelines/:id/chapters/:ch/preview?lang=en
 *
 * Proxies to the Java doc-generate service:
 *   GET http://<JAVA_API_BASE>/doc-generate/:id/chapter/:chNum?lang=en
 *
 * The chapter number is normalised: "01" → 1, "02" → 2, etc.
 */
export const docPreview = async (c) => {
  try {
    const tgId = parseInt(c.req.param('id'), 10);
    const ch   = c.req.param('ch');           // e.g. "01", "07"
    const lang = c.req.query('lang') || 'en';

    if (!tgId || isNaN(tgId)) {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Valid test guideline ID required' } }, 400);
    }

    // Strip leading zero so Java receives "1" not "01"
    const chNum = parseInt(ch, 10);
    if (isNaN(chNum) || chNum < 1 || chNum > 11) {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid chapter number' } }, 400);
    }

    const javaBase = process.env.JAVA_API_BASE_URL || 'http://localhost:8080';
    const url = `${javaBase}/doc-generate/${tgId}/chapter/${chNum}?lang=${encodeURIComponent(lang)}`;

    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html, application/json',
      },
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      console.error(`Java doc-generate error ${upstream.status}:`, text);
      return c.json(
        { error: { code: 'UPSTREAM_ERROR', message: `Doc generation failed (${upstream.status})` } },
        upstream.status >= 500 ? 502 : upstream.status,
      );
    }

    const contentType = upstream.headers.get('content-type') || 'text/html';
    const body = await upstream.text();

    return c.body(body, 200, { 'Content-Type': contentType });
  } catch (err) {
    console.error('Doc preview proxy error:', err);
    return c.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch document preview' } },
      500,
    );
  }
};
