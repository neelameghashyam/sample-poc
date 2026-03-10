/**
 * GET /api/test-guidelines/:id/doc-generate?lang=en
 *
 * Proxies to the Java doc-generate service:
 *   GET http://<JAVA_API_BASE_URL>/doc-generate/:id?lang=en
 *
 * Streams the Java response (docx / pdf / html) back to the client as-is,
 * forwarding Content-Type and Content-Disposition so the browser can
 * trigger a file download directly.
 */
export const docGenerate = async (c) => {
  try {
    const tgId = parseInt(c.req.param('id'), 10);
    const lang = c.req.query('lang') || 'en';

    if (!tgId || isNaN(tgId)) {
      return c.json(
        { error: { code: 'BAD_REQUEST', message: 'Valid test guideline ID required' } },
        400,
      );
    }

    const javaBase = process.env.JAVA_API_BASE_URL || 'http://localhost:8080';
    const url = `${javaBase}/doc-generate/${tgId}?lang=${encodeURIComponent(lang)}`;

    const upstream = await fetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      console.error(`Java doc-generate error ${upstream.status}:`, text);
      return c.json(
        { error: { code: 'UPSTREAM_ERROR', message: `Document generation failed (${upstream.status})` } },
        upstream.status >= 500 ? 502 : upstream.status,
      );
    }

    const contentType        = upstream.headers.get('content-type')        || 'application/octet-stream';
    const contentDisposition = upstream.headers.get('content-disposition')  || '';

    const buffer = await upstream.arrayBuffer();

    const responseHeaders = { 'Content-Type': contentType };
    if (contentDisposition) responseHeaders['Content-Disposition'] = contentDisposition;

    return c.body(buffer, 200, responseHeaders);
  } catch (err) {
    console.error('Doc generate proxy error:', err);
    return c.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to generate document' } },
      500,
    );
  }
};