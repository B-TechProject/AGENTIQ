/**
 * Environment validation.
 *
 * Every variable in docs/02_TRD.md §12 is declared here and validated with Zod
 * at boot. The server prints a readable table of what is set and what is
 * missing, then exits non-zero if a REQUIRED variable is absent or malformed.
 *
 * There is no fallback for JWT_SECRET and there never will be. Sem 6 shipped a
 * hardcoded literal that reached a public repository (BUG-3); failing loudly at
 * boot is the correct behaviour and is cheap to fix, whereas a silent default is
 * a forged-token vulnerability that looks like a working server.
 */
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

const SERVER_DIR = path.resolve(import.meta.dirname, '../..');
const REPO_ROOT = path.resolve(SERVER_DIR, '..');

/**
 * Load .env files. dotenv does not overwrite variables that are already set, so
 * the first file to define a key wins, and real environment variables (as set by
 * Render, CI, or the shell) always beat both files.
 */
export function loadDotenv() {
  // Never read a developer's .env during tests. dotenv skips variables that are
  // already set, but tests legitimately *delete* variables to assert the
  // unconfigured path — and a deleted variable looks unset, so dotenv would
  // refill it from disk. That makes results depend on whose machine is running:
  // green locally with credentials present, red in CI without them.
  if (process.env.NODE_ENV === 'test') return;

  dotenv.config({ path: path.join(REPO_ROOT, '.env'), quiet: true });
  dotenv.config({ path: path.join(SERVER_DIR, '.env'), quiet: true });
}

/** "true"/"1"/"yes" -> true. Anything else -> false. z.coerce.boolean() is wrong
 *  here: it uses JS truthiness, so the string "false" would coerce to true. */
const boolFromString = z
  .string()
  .optional()
  .transform((v) => ['true', '1', 'yes', 'on'].includes(String(v).trim().toLowerCase()));

const port = z.coerce.number().int().positive().max(65535);

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: port.default(3001),

    // ── Required ─────────────────────────────────────────────────────────────
    MONGO_URI: z.string().min(1, { error: 'MONGO_URI is required' }),
    JWT_SECRET: z.string().min(32, {
      error: 'JWT_SECRET must be at least 32 characters. Generate one with: ' +
        "node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
    }),

    // ── Origins ──────────────────────────────────────────────────────────────
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    APP_BASE_URL: z.url().default('http://localhost:5173'),
    API_BASE_URL: z.url().default('http://localhost:3001'),

    // ── LLM providers (optional until Phase 7) ───────────────────────────────
    // Gemini was dropped 17 Aug 2026: Bedrock covers the fallback role and gives
    // access to many model families through one interface, so a second bespoke
    // provider key earns nothing. See docs/05_AWS_ARCHITECTURE.md.
    GROQ_API_KEY: z.string().optional(),
    // Providers retire models on their own schedule; keep this swappable.
    GROQ_MODEL: z.string().optional(),
    // Per-task overrides — see TASK_MODELS in services/llm.js.
    GROQ_MODEL_EXPLAIN: z.string().optional(),
    BEDROCK_MODEL_EXPLAIN: z.string().optional(),
    LLM_PRIMARY: z.enum(['groq', 'bedrock']).default('bedrock'),
    LLM_FALLBACK: z.enum(['groq', 'bedrock']).default('groq'),

    // ── AWS (optional — see docs/05_AWS_ARCHITECTURE.md) ─────────────────────
    // Deliberately no AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY: credentials come
    // from the default chain locally, an instance role on App Runner, and OIDC in
    // CI. A long-lived AWS key must never be read from a file in this repo.
    AWS_REGION: z.string().default('ap-south-1'),
    AWS_S3_BUCKET: z.string().optional(),
    AWS_SECRETS_ID: z.string().optional(),
    BEDROCK_MODEL_ID: z.string().optional(),

    // ── Google OAuth (optional — absence must not break boot) ─────────────────
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // ── Email (optional — absence disables verification mail, not the app) ───
    // Resend is the default driver: free tier, and its shared onboarding@
    // sender works with no domain set up, which matters for a demo where an
    // examiner may register with their own address.
    MAIL_DRIVER: z.enum(['resend', 'smtp', 'console']).optional(),
    RESEND_API_KEY: z.string().optional(),
    SMTP_URL: z.string().optional(),
    MAIL_FROM: z.string().optional(),

    // ── Deployment (optional) ────────────────────────────────────────────────
    RENDER_API_KEY: z.string().optional(),
    // Overridable so the deployment tests can drive a local fake control plane
    // instead of creating real services in a real Render account.
    RENDER_API_BASE: z.string().url().optional(),

    // ── Egress guard (Phase 4) ───────────────────────────────────────────────
    EGRESS_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    EGRESS_MAX_BYTES: z.coerce.number().int().positive().default(5_242_880),
    EGRESS_RPS_PER_HOST: z.coerce.number().int().positive().default(5),
    ALLOW_PRIVATE_TARGETS: boolFromString,
  })
  .refine((e) => !(e.NODE_ENV === 'production' && e.ALLOW_PRIVATE_TARGETS), {
    error:
      'ALLOW_PRIVATE_TARGETS=true is refused when NODE_ENV=production. It exists only for ' +
      'local testing against the fixture apps and would turn the server into an SSRF proxy.',
    path: ['ALLOW_PRIVATE_TARGETS'],
  })
  .refine((e) => e.LLM_PRIMARY !== e.LLM_FALLBACK, {
    error: 'LLM_PRIMARY and LLM_FALLBACK must differ, otherwise there is no fallback.',
    path: ['LLM_FALLBACK'],
  });

/** Variables that are optional but whose absence disables a feature. */
export const OPTIONAL_FEATURE_VARS = {
  GOOGLE_CLIENT_ID: 'Google OAuth sign-in',
  GOOGLE_CLIENT_SECRET: 'Google OAuth sign-in',
  GROQ_API_KEY: 'Groq LLM provider',
  BEDROCK_MODEL_ID: 'Bedrock LLM provider',
  AWS_S3_BUCKET: 'S3 spec & artifact storage',
  AWS_SECRETS_ID: 'Secrets Manager',
  RENDER_API_KEY: 'Deployment agent',
  RESEND_API_KEY: 'Verification email',
};

const SECRET_KEYS = new Set([
  'JWT_SECRET', 'MONGO_URI', 'GROQ_API_KEY',
  'GOOGLE_CLIENT_SECRET', 'GOOGLE_CLIENT_ID', 'RENDER_API_KEY',
  'RESEND_API_KEY', 'SMTP_URL',
]);

/** Never print a secret. Show only enough to confirm the right value is loaded. */
export function maskValue(key, value) {
  if (value === undefined || value === '') return '';
  const s = String(value);
  if (!SECRET_KEYS.has(key)) return s;
  if (s.length <= 8) return '••••';
  return `${s.slice(0, 4)}••••${s.slice(-4)}`;
}

/**
 * Pure parse. Returns a result instead of exiting, so tests can exercise the
 * failure paths without killing the test runner.
 */
export function parseEnv(source = process.env) {
  const result = envSchema.safeParse(source);
  return result.success
    ? { ok: true, env: result.data, issues: [] }
    : { ok: false, env: null, issues: result.error.issues };
}

/**
 * The only variables with no default and no fallback. Everything else either
 * defaults or degrades a single feature, so only these two can read "missing".
 */
export const REQUIRED_KEYS = ['MONGO_URI', 'JWT_SECRET'];

/**
 * Defaults, resolved once by parsing a minimal valid object. Computed rather
 * than duplicated so the table cannot disagree with the schema.
 */
function schemaDefaults() {
  const probe = envSchema.safeParse({ MONGO_URI: 'mongodb://x/y', JWT_SECRET: 'x'.repeat(32) });
  return probe.success ? probe.data : {};
}

/** Renders the set/default/missing table printed at boot. Returns lines. */
export function formatEnvTable(source = process.env, parsed = null) {
  const names = ENV_KEYS;
  const defaults = schemaDefaults();
  const width = Math.max(...names.map((k) => k.length));
  const lines = [`  ${'VARIABLE'.padEnd(width)}  STATUS    VALUE`];
  lines.push(`  ${'-'.repeat(width)}  --------  -----`);

  for (const key of names) {
    const raw = source[key];
    const isSet = raw !== undefined && raw !== '';

    // Falls back to the schema's own defaults when validation failed, so a
    // failing boot does not report 18 problems when only two are real.
    const effective = parsed?.[key] ?? defaults[key];

    let status;
    if (isSet) status = 'set';
    else if (REQUIRED_KEYS.includes(key)) status = 'MISSING';
    else if (key in OPTIONAL_FEATURE_VARS) status = 'off';
    else if (effective !== undefined) status = 'default';
    else status = 'unset';

    const shown = isSet
      ? maskValue(key, raw)
      : status === 'default' ? String(effective) : '';
    lines.push(`  ${key.padEnd(width)}  ${status.padEnd(8)}  ${shown}`);
  }
  return lines;
}

/**
 * Declared order for the boot table. Explicit rather than derived from the Zod
 * schema: .refine() wraps the object schema, so .shape is not reachable without
 * touching Zod internals that change between versions.
 *
 * The env.schema.test.js suite asserts this list matches the schema exactly, so
 * the two cannot drift apart silently.
 */
export const ENV_KEYS = [
  'NODE_ENV', 'PORT', 'MONGO_URI', 'JWT_SECRET', 'CORS_ORIGIN',
  'APP_BASE_URL', 'API_BASE_URL', 'GROQ_API_KEY',
  'GROQ_MODEL', 'GROQ_MODEL_EXPLAIN', 'BEDROCK_MODEL_EXPLAIN',
  'LLM_PRIMARY', 'LLM_FALLBACK',
  'AWS_REGION', 'AWS_S3_BUCKET', 'AWS_SECRETS_ID', 'BEDROCK_MODEL_ID',
  'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
  'MAIL_DRIVER', 'RESEND_API_KEY', 'SMTP_URL', 'MAIL_FROM',
  'RENDER_API_KEY', 'RENDER_API_BASE', 'EGRESS_TIMEOUT_MS', 'EGRESS_MAX_BYTES',
  'EGRESS_RPS_PER_HOST', 'ALLOW_PRIVATE_TARGETS',
];

/**
 * Boot-time load. Prints the table, then exits non-zero if validation failed.
 * Called by index.js only — app.js imports the already-validated config.
 */
export function loadEnv({ exit = true, log = console } = {}) {
  loadDotenv();
  const result = parseEnv(process.env);

  log.info?.('\nAGENTIQ — environment');
  for (const line of formatEnvTable(process.env, result.env)) log.info?.(line);

  const disabled = Object.entries(OPTIONAL_FEATURE_VARS)
    .filter(([k]) => !process.env[k])
    .map(([, feature]) => feature);
  if (disabled.length) {
    log.info?.(`\n  Disabled (optional config absent): ${[...new Set(disabled)].join(', ')}`);
  }

  if (!result.ok) {
    log.error?.('\n  Environment validation FAILED:\n');
    for (const issue of result.issues) {
      log.error?.(`    ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    log.error?.('\n  Copy .env.example to .env and fill in the required values.\n');
    if (exit) process.exit(1);
    return null;
  }

  log.info?.('');
  return result.env;
}

/**
 * The validated config used across the app.
 *
 * Parsed without exiting so that importing a module does not kill a test run;
 * index.js calls loadEnv() explicitly at boot and that is what enforces the
 * hard failure.
 */
loadDotenv();
const parsed = parseEnv(process.env);
export const env = parsed.env ?? {};
export const envIsValid = parsed.ok;
export default env;
