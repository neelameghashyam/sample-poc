import {
  updateChapter04,
  ALLOWED_FIELDS,
  createAssessmentPropMethod,
  updateAssessmentPropMethod,
  deleteAssessmentPropMethod,
} from '../../repositories/chapters/chapter-04.repo.js';

/** PATCH /api/test-guidelines/:id/chapters/04 */
export const update = async (c) => {
  try {
    const tgId = parseInt(c.req.param('id'), 10);
    if (!tgId || isNaN(tgId))
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Valid test guideline ID required' } }, 400);

    const body = await c.req.json();
    const updates = {};
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.includes(key)) updates[key] = value;
    }
    if (Object.keys(updates).length === 0)
      return c.json({ error: { code: 'BAD_REQUEST', message: 'No valid fields provided' } }, 400);

    const updated = await updateChapter04(tgId, updates);
    if (!updated)
      return c.json({ error: { code: 'NOT_FOUND', message: 'Assessment data not found' } }, 404);

    return c.json({ ok: true });
  } catch (err) {
    console.error('Chapter 04 update error:', err);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update chapter 04' } }, 500);
  }
};

/** POST /api/test-guidelines/:id/chapters/04/propagation-methods */
export const createPropMethod = async (c) => {
  try {
    const tgId = parseInt(c.req.param('id'), 10);
    if (!tgId || isNaN(tgId))
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Valid test guideline ID required' } }, 400);

    const body = await c.req.json();
    const row = await createAssessmentPropMethod(tgId, body);
    if (!row)
      return c.json({ error: { code: 'NOT_FOUND', message: 'Assessment record not found' } }, 404);

    return c.json(row, 201);
  } catch (err) {
    console.error('Ch04 create prop method error:', err);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create propagation method' } }, 500);
  }
};

/** PATCH /api/test-guidelines/:id/chapters/04/propagation-methods/:pmId */
export const updatePropMethod = async (c) => {
  try {
    const tgId = parseInt(c.req.param('id'), 10);
    const pmId = parseInt(c.req.param('pmId'), 10);
    if (!tgId || isNaN(tgId) || !pmId || isNaN(pmId))
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Valid IDs required' } }, 400);

    const body = await c.req.json();
    const updated = await updateAssessmentPropMethod(tgId, pmId, body);
    if (!updated)
      return c.json({ error: { code: 'NOT_FOUND', message: 'Propagation method not found' } }, 404);

    return c.json({ ok: true });
  } catch (err) {
    console.error('Ch04 update prop method error:', err);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update propagation method' } }, 500);
  }
};

/** DELETE /api/test-guidelines/:id/chapters/04/propagation-methods/:pmId */
export const deletePropMethod = async (c) => {
  try {
    const tgId = parseInt(c.req.param('id'), 10);
    const pmId = parseInt(c.req.param('pmId'), 10);
    if (!tgId || isNaN(tgId) || !pmId || isNaN(pmId))
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Valid IDs required' } }, 400);

    const deleted = await deleteAssessmentPropMethod(tgId, pmId);
    if (!deleted)
      return c.json({ error: { code: 'NOT_FOUND', message: 'Propagation method not found' } }, 404);

    return c.json({ ok: true });
  } catch (err) {
    console.error('Ch04 delete prop method error:', err);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete propagation method' } }, 500);
  }
};