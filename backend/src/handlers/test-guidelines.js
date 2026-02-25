import { findAll, countAll, findById, findUsersByTgId } from '../repositories/test-guideline.js';

/**
 * List test guidelines
 */
export const list = async (c) => {
  try {
    const status = c.req.query('status');
    const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
    const offset = parseInt(c.req.query('offset') || '0', 10);

    const [items, total] = await Promise.all([
      findAll({ status, limit, offset }),
      countAll(),
    ]);

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

    const users = await findUsersByTgId(id);

    return c.json({ ...tg, users });
  } catch (err) {
    console.error('Get TG error:', err);
    return c.json({ error: { code: 'ERROR', message: 'Failed to get test guideline' } }, 500);
  }
};
