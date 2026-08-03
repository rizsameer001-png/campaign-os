import { ApiError, sendError } from '../utils/responseFormatter.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/** API-STD-002: consistent HTTP status + error envelope for every failure path. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return sendError(res, { status: err.status, message: err.message, errors: err.errors });
  }

  // Prisma unique constraint violation -> 409 Conflict (e.g. AUTH-C-002 duplicate email)
  if (err.code === 'P2002') {
    return sendError(res, {
      status: 409,
      message: `${err.meta?.target?.join(', ') || 'Field'} already exists`,
    });
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
  });

  return sendError(res, {
    status: 500,
    message: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
}

export function notFoundHandler(req, res) {
  return sendError(res, { status: 404, message: `Route not found: ${req.method} ${req.path}` });
}
