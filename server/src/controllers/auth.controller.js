/**
 * Email/password and Google authentication.
 *
 * Fixes carried over from the Sem 6 audit:
 *   - registerUser returned the whole mongoose document, password hash included.
 *   - loginUser console.logged the freshly minted JWT.
 *   - Registration and login queried two separate collections.
 *   - Cookies were set with secure:true / sameSite:none unconditionally, so they
 *     were silently dropped over plain http in local development.
 */
import { z } from 'zod';
import { User } from '../models/User.js';
import { generateToken, cookieOptions } from '../utils/token.js';
import { ok, fail, ApiError } from '../utils/http.js';
import { env } from '../config/env.js';

const registerSchema = z
  .object({
    displayName: z.string().trim().min(1, { error: 'Name is required' }).max(80),
    email: z.email({ error: 'Enter a valid email address' }),
    password: z.string().min(8, { error: 'Password must be at least 8 characters' }).max(200),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: z.email({ error: 'Enter a valid email address' }),
  password: z.string().min(1, { error: 'Password is required' }),
});

/** Turns a Zod error into the envelope's `details` shape. */
function fieldErrors(zodError) {
  return zodError.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
}

export async function registerUser(req, res) {
  const parsed = registerSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Check the highlighted fields', fieldErrors(parsed.error));
  }
  const { displayName, email, password } = parsed.data;

  if (await User.exists({ email })) {
    return fail(res, 409, 'EMAIL_IN_USE', 'An account with this email already exists');
  }

  const user = new User({
    email,
    displayName,
    authProviders: [{ provider: 'local', providerId: email, email }],
  });
  await user.setPassword(password);
  await user.save();

  const token = generateToken(user);
  res.cookie('token', token, cookieOptions());
  // toJSON strips passwordHash; see models/User.js.
  return ok(res, { user: user.toJSON(), token }, 201);
}

export async function loginUser(req, res) {
  const parsed = loginSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Check the highlighted fields', fieldErrors(parsed.error));
  }
  const { email, password } = parsed.data;

  // passwordHash is select:false, so ask for it explicitly.
  const user = await User.findOne({ email }).select('+passwordHash');

  // Same response whether the account is missing or the password is wrong —
  // otherwise this endpoint enumerates registered emails.
  const invalid = () => fail(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  if (!user) return invalid();
  if (!(await user.verifyPassword(password))) return invalid();

  const token = generateToken(user);
  res.cookie('token', token, cookieOptions());
  return ok(res, { user: user.toJSON(), token });
}

export function logoutUser(req, res) {
  res.clearCookie('token', { ...cookieOptions(), maxAge: undefined });
  return ok(res, { loggedOut: true });
}

export function currentUser(req, res) {
  return ok(res, { user: req.user.toJSON() });
}

/**
 * Google callback. Passport has authenticated the profile; we find-or-create the
 * user, link the provider, mint a JWT, and hand it to the frontend.
 */
export async function googleCallback(req, res) {
  const profile = req.user;
  const email = profile?.emails?.[0]?.value?.toLowerCase();
  if (!email) throw ApiError.badRequest('Google account did not return an email address');

  let user = await User.findOne({ email });
  if (!user) {
    user = new User({
      email,
      displayName: profile.displayName || email.split('@')[0],
      avatarUrl: profile.photos?.[0]?.value ?? '',
      authProviders: [],
    });
  }
  // Linking rather than creating a second document is the whole reason the two
  // Sem 6 collections were merged: one person, one user, many sign-in methods.
  user.linkProvider({ provider: 'google', providerId: profile.id, email });
  if (!user.avatarUrl && profile.photos?.[0]?.value) user.avatarUrl = profile.photos[0].value;
  await user.save();

  const token = generateToken(user);
  res.cookie('token', token, cookieOptions());

  const target = new URL('/google-success', env.APP_BASE_URL);
  target.searchParams.set('token', token);
  return res.redirect(target.toString());
}
