import { findAll, countAll, findById, findUsersByTgId, countIeComments } from '../repositories/test-guideline.js';

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&times;/g, '\u00d7').replace(/&amp;/g, '&').trim();
}

/**
 * List test guidelines
 */
export const list = async (c) => {
  try {
    const tab = c.req.query('tab');
    const status = c.req.query('status');
    const limitParam = c.req.query('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : null;
    const offset = limitParam ? parseInt(c.req.query('offset') || '0', 10) : 0;
    const sortDir = c.req.query('sortDir') || null;

    const filters = {};
    for (const key of ['name', 'reference', 'leadExpert', 'upovCodes', 'status', 'twps']) {
      const val = c.req.query(`filter[${key}]`);
      if (val) filters[key] = val;
    }

    const [items, total] = await Promise.all([
      findAll({ tab, status, limit, offset, filters, sortDir }),
      countAll(tab, filters),
    ]);

    for (const item of items) {
      item.upovCodes = item.upovCodes
        ? item.upovCodes.split('||').map(stripHtml)
        : [];
    }

    return c.json({ items, total, limit, offset });
  } catch (err) {
    console.error('List TGs error:', err);
    return c.json({ error: { code: 'ERROR', message: 'Failed to list test guidelines' } }, 500);
  }
};

/**
 * Get single test guideline
 */
export const get = async (c) => {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Test guideline ID required' } }, 400);
    }

    const tg = await findById(id);

    if (!tg) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Test guideline not found' } }, 404);
    }

    const [users, ieCommentCount] = await Promise.all([
      findUsersByTgId(id),
      countIeComments(id),
    ]);

    return c.json({ ...tg, users, ieCommentCount });
  } catch (err) {
    console.error('Get TG error:', err);
    return c.json({ error: { code: 'ERROR', message: 'Failed to get test guideline' } }, 500);
  }
};
