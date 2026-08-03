import { verifyToken } from '../config/jwt.js';
import { sendError } from '../utils/responseFormatter.js';
import { prisma } from '../config/db.js';
import { USER_STATUS } from '@election-os/shared/roles';

/**
 * AUTH-R-002: validates JWT and attaches req.user.
 * AUTH-CL-005: blocks login-gated actions if account isn't active
 * (checked here too, not just at login, in case status changed mid-session).
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return sendError(res, { status: 401, message: 'Authentication required' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return sendError(res, { status: 401, message: 'Invalid or expired access token' });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!user || user.deletedAt) {
    return sendError(res, { status: 401, message: 'User not found' });
  }

  if ([USER_STATUS.SUSPENDED, USER_STATUS.BANNED].includes(user.status)) {
    return sendError(res, { status: 403, message: `Account is ${user.status}` });
  }

  req.user = { id: user.id, email: user.email, role: user.role, status: user.status };
  next();
}
