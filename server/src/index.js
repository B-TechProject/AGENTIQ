/**
 * Boot: validate config → connect to MongoDB → listen.
 *
 * The only file that is allowed to exit the process. Everything it uses is
 * importable without side effects, which is what makes the app testable.
 */
import { loadEnv } from './config/env.js';
import { connectDB, disconnectDB } from './lib/db.js';
import { logger } from './lib/logger.js';

// Prints the set/missing table and exits non-zero if a required var is absent.
const env = loadEnv();

// Registering the tools is a side effect of importing them, so it happens
// before the app is built and /api/mcp/tools can never serve an empty registry.
const { registerAllTools } = await import('./mcp/tools/index.js');
const tools = await registerAllTools();
logger.info(`MCP registry: ${tools.length} tools registered`);

const { app } = await import('./app.js');

try {
  await connectDB();
} catch (err) {
  logger.error(
    { err: err.message },
    'Could not connect to MongoDB. Check MONGO_URI, and that this IP is allowed in Atlas.',
  );
  process.exit(1);
}

const server = app.listen(env.PORT, () => {
  logger.info(`AGENTIQ server listening on http://localhost:${env.PORT}`);
  logger.info(`Health check: http://localhost:${env.PORT}/api/health`);
});

/** Close the port and the DB cleanly so nodemon restarts do not leak handles. */
async function shutdown(signal) {
  logger.info(`${signal} received — shutting down`);
  server?.close();
  await disconnectDB().catch(() => {});
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});
