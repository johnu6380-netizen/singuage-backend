import csurf from 'csurf';
import { isProduction } from '../config/env';

// Use cookie-based CSRF tokens suitable for a SPA.
// The frontend should fetch /api/csrf-token to obtain the token and include it
// in the X-CSRF-Token header for state-changing requests (POST/PUT/DELETE).
export const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction, // require secure cookie in production
    maxAge: 30 * 60 * 1000, // 30 minutes
  },
});
