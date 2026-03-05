import { queryOne } from '../utils/db.js';
import { findByUsername } from '../repositories/user.js';

/**
 * LE (Leading Expert) authorization middleware for editor routes.
 * Enforces that only the assigned LE (or an admin) can mutate a TG.
 * GET requests pass through — any authenticated user can view.
 */
export const editorAuthMiddleware = async (c, next) => {
  // Read-only requests are allowed for any authenticated user
  if (c.req.method === 'GET') {
    return next();
  }

  const tgId = parseInt(c.req.param('id'), 10);
  if (!tgId || isNaN(tgId)) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Valid TG ID required' } }, 400);
  }

  const authUser = c.get('user');
  if (!authUser?.sub) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const dbUser = await findByUsername(authUser.sub);
  if (!dbUser) {
    return c.json(
      { error: { code: 'FORBIDDEN', message: 'User not found in the system' } },
      403
    );
  }

  // Admins bypass LE check
  if (dbUser.roleCode === 'ADM') {
    return next();
  }

  // Check LE assignment in Tg_Users
  const isLe = await queryOne(
    `SELECT 1 FROM Tg_Users WHERE User_ID = ? AND TG_ID = ? AND Role_Code = 'LE'`,
    [dbUser.id, tgId]
  );

  if (!isLe) {
    return c.json(
      { error: { code: 'FORBIDDEN', message: 'Only the assigned Leading Expert can edit this test guideline' } },
      403
    );
  }

  return next();
};
