import { sendError } from '../utils/responseFormatter.js';

/**
 * API-STD-005: validates req.body/query/params against a zod schema and
 * returns detailed field-level errors on failure.
 *
 *   router.post('/register', validateRequest(registerSchema), controller)
 */
export function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return sendError(res, { status: 400, message: 'Validation failed', errors });
    }
    req[source] = result.data;
    next();
  };
}
