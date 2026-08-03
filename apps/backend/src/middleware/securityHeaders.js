import helmet from 'helmet';

// SEC-009: HSTS, X-Frame-Options, CSP, X-Content-Type-Options via helmet defaults
// plus a couple of explicit overrides for the API-only surface.
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'https://res.cloudinary.com', 'data:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});
