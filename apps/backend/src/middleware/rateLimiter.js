import rateLimit from 'express-rate-limit';

// AUTH-R-010: role-based limits. Keyed by user id when authenticated,
// falling back to IP for public endpoints.
const keyGenerator = (req) => req.user?.id || req.ip;

export const roleAwareLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  keyGenerator,
  max: (req) => {
    switch (req.user?.role) {
      case 'admin':
      case 'super_admin':
        return 1000;
      case 'candidate':
        return 500;
      case 'volunteer':
        return 200;
      default:
        return 100; // unauthenticated/public
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, message: 'Too many requests, please try again later.', errors: [] },
});

// SEC-004: stricter limiter for auth endpoints to slow brute-force attempts.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, message: 'Too many attempts, please try again later.', errors: [] },
});

// SPI-L / API-PUBLIC: tight limiter for public contact/inquiry forms.
export const publicFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, message: 'Too many submissions, please try again later.', errors: [] },
});
