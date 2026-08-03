// API-STD-001: every endpoint returns { success, data, message, errors }

export function sendSuccess(res, { data = null, message = 'OK', status = 200 } = {}) {
  return res.status(status).json({ success: true, data, message, errors: [] });
}

export function sendError(res, { message = 'Something went wrong', status = 500, errors = [] } = {}) {
  return res.status(status).json({ success: false, data: null, message, errors });
}

export function sendPaginated(res, { items, page, limit, total, message = 'OK' }) {
  // API-STD-003 pagination envelope
  return res.status(200).json({
    success: true,
    message,
    errors: [],
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/** Custom error class carrying an HTTP status, thrown from services/controllers. */
export class ApiError extends Error {
  constructor(status, message, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
