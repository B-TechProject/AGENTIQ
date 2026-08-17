/**
 * /api/auth/*
 *
 * The Google routes are registered unconditionally but check configuration at
 * request time, so an unconfigured server returns an explanatory 503 instead of
 * a 404 (or, as in Sem 6, refusing to boot at all).
 */
import { Router } from 'express';
import passport from 'passport';
import {
  registerUser, loginUser, logoutUser, currentUser, googleCallback,
} from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.js';
import { isGoogleOAuthConfigured, GOOGLE_STRATEGY } from '../config/passport.js';
import { fail } from '../utils/http.js';
import { env } from '../config/env.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protectRoute, currentUser);

/** Refuses cleanly when Google credentials are absent. */
function requireGoogle(req, res, next) {
  if (!isGoogleOAuthConfigured()) {
    return fail(
      res,
      503,
      'OAUTH_NOT_CONFIGURED',
      'Google sign-in is not configured on this server. Use email and password, or set ' +
        'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
    );
  }
  return next();
}

router.get('/google', requireGoogle, (req, res, next) =>
  passport.authenticate(GOOGLE_STRATEGY, {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
  })(req, res, next),
);

router.get(
  '/google/callback',
  requireGoogle,
  (req, res, next) =>
    passport.authenticate(GOOGLE_STRATEGY, {
      session: false,
      failureRedirect: `${env.APP_BASE_URL}/login?error=google_auth_failed`,
    })(req, res, next),
  googleCallback,
);

export default router;
