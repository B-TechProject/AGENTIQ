import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Sets deterministic env vars BEFORE any module reads process.env.
    setupFiles: ['./tests/setup.js'],
    // mongodb-memory-server downloads/spawns a real mongod on first use.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Each file gets a fresh process: mongoose caches models and connections on
    // module state, and sharing that across files causes order-dependent failures.
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      // docs/02_TRD.md §11 sets the gate at 70% on these two trees. They do not
      // exist until Phases 4-5, so the threshold is enabled there, not here.
      include: ['src/**/*.js'],
      exclude: ['src/index.js'],
    },
  },
});
