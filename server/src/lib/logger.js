/**
 * Structured logging with secret redaction.
 *
 * docs/02_TRD.md §14 sets a hard target of ZERO secrets in logs. Sem 6 violated
 * this in three places: two console.log calls printed raw JWTs, and ai.service.js
 * logged an API-key prefix on every call. Redaction is configured centrally here
 * so no individual call site has to remember.
 */
import pino from 'pino';
import { env } from '../config/env.js';

/**
 * Paths are redacted by pino before serialisation, so a secret cannot reach a
 * transport even if something logs a whole request or config object.
 *
 * pino matches these as literal paths with [*] wildcards; it has no suffix
 * globbing, so each shape a secret can arrive in is listed explicitly.
 */
export const REDACT_PATHS = [
  // Request/response headers
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'res.headers["set-cookie"]',
  'req.headers["x-api-key"]',

  // Common body/config shapes
  '*.password',
  '*.passwordHash',
  '*.confirmPassword',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.secret',
  '*.key',
  '*.apiKey',
  'password',
  'token',
  'secret',
  'apiKey',

  // Named config values
  '*.JWT_SECRET',
  '*.MONGO_URI',
  '*.GROQ_API_KEY',
  '*.GEMINI_API_KEY',
  '*.GOOGLE_CLIENT_SECRET',
  '*.RENDER_API_KEY',
];

const isProd = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'silent' : (process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug')),
  redact: { paths: REDACT_PATHS, censor: '[redacted]' },
  base: undefined, // drop pid/hostname noise
  timestamp: pino.stdTimeFunctions.isoTime,
});

/** Options for pino-http, sharing the same redaction config. */
export const httpLoggerOptions = {
  logger,
  // Health checks would otherwise dominate the log on a free-tier warm ping.
  autoLogging: { ignore: (req) => req.url === '/api/health' },
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // Log only what is needed; never the full header set.
  serializers: {
    req: (req) => ({ method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
};

export default logger;
