import { sendError } from '../utils/responseFormatter.js';

/**
 * AUTH-R-005: returns 403 with a clear message when the caller's role isn't
 * in the allowed list. Use after `authenticate`.
 *
 *   router.get('/admin/users', authenticate, authorize('admin', 'super_admin'), handler)
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, { status: 401, message: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, {
        status: 403,
        message: `Requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}

/**
 * Ownership check for candidate-scoped resources — e.g. a candidate can only
 * touch their own volunteers/tasks/plans unless they're admin/super_admin.
 * `getOwnerId` extracts the owning user id from the loaded resource.
 */
export function authorizeOwnerOrAdmin(getOwnerId) {
  return async (req, res, next) => {
    try {
      const ownerId = await getOwnerId(req);
      const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
      if (!isAdmin && ownerId !== req.user.id) {
        return sendError(res, { status: 403, message: 'Not authorized to access this resource' });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
