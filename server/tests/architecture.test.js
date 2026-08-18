/**
 * THE ARCHITECTURE GUARD.
 *
 * The project's central claim is that an agent never performs I/O — it may only
 * call an MCP tool. That claim is what separates AGENTIQ from "an LLM wrapper
 * that calls axios", and it is the thing an examiner will probe.
 *
 * A claim defended only by discipline erodes over 15 weeks of edits. This test
 * defends it mechanically: the moment anyone imports axios into an agent, CI
 * goes red.
 *
 * Written in Phase 3, deliberately BEFORE server/src/agents/ has any real
 * content (docs/02_TRD.md §11: "write this one first"). It passes vacuously
 * today and becomes load-bearing in Phases 7-8.
 */
import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = path.resolve(import.meta.dirname, '../src');

/**
 * Trees that must contain NO HTTP client of their own.
 *
 * agents/ was the original scope. controllers/ and routes/ were added in
 * Phase 15 after a live SSRF hole was found in exactly the place the guard was
 * not looking: controllers/request.controller.js passed a user-supplied URL
 * straight to axios, so POST /api/request/send would fetch
 * http://169.254.169.254/latest/meta-data/... and return the body. Guarding
 * only the agents while a route did raw I/O defended the claim in the one place
 * it was already true.
 *
 * services/ is deliberately NOT here: services/llm.js talks to fixed provider
 * endpoints that no user supplies, which is a different risk entirely. The rule
 * being enforced is "no user-controlled URL reaches an HTTP client", and these
 * three trees are where user input arrives.
 */
const GUARDED_TREES = ['agents', 'controllers', 'routes'];

/** Anything that can open a socket or issue a request. */
const FORBIDDEN = [
  { name: 'axios', pattern: /\baxios\b/ },
  { name: 'fetch', pattern: /(?<![\w.])fetch\s*\(/ },
  { name: 'http.request', pattern: /\bhttps?\s*\.\s*request\s*\(/ },
  { name: 'http.get', pattern: /\bhttps?\s*\.\s*get\s*\(/ },
  { name: "import 'node:http'", pattern: /from\s+['"]node:https?['"]/ },
  { name: "import 'http'", pattern: /from\s+['"]https?['"]/ },
  { name: 'net/tls socket', pattern: /from\s+['"]node:(net|tls|dgram)['"]/ },
  { name: 'child_process', pattern: /from\s+['"]node:child_process['"]/ },
  { name: 'undici', pattern: /from\s+['"]undici['"]/ },
  { name: 'got/node-fetch', pattern: /from\s+['"](got|node-fetch|superagent|request)['"]/ },
];

async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return []; // agents/ not created yet
    throw err;
  }
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (/\.(js|mjs|ts)$/.test(entry.name)) files.push(full);
  }
  return files;
}

/** Strips comments so a mention of axios in prose does not fail the build. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('architecture: no user-controlled URL reaches an HTTP client', () => {
  it.each(GUARDED_TREES)('server/src/%s/** contains no direct network or process calls', async (tree) => {
    const dir = path.join(SRC, tree);
    const files = await walk(dir);
    const violations = [];

    for (const file of files) {
      const source = stripComments(await readFile(file, 'utf8'));
      for (const { name, pattern } of FORBIDDEN) {
        if (pattern.test(source)) {
          violations.push(`${tree}/${path.relative(dir, file)} uses ${name}`);
        }
      }
    }

    expect(
      violations,
      violations.length
        ? '\n\nThis tree must not perform I/O. It may only call MCP tools.\n' +
            'Move the call into a tool under server/src/mcp/tools/ so it is\n' +
            'schema-validated, permission-checked, audited, and SSRF-guarded.\n\n' +
            violations.map((v) => `  - ${v}`).join('\n') + '\n'
        : undefined,
    ).toEqual([]);
  });

  it('the guard actually detects a violation (guards the guard)', () => {
    // A guard that can never fail is not a guard. This proves the patterns match
    // real violations, so a vacuous pass above means "clean", not "broken test".
    const sample = `import axios from 'axios';\nawait fetch('http://x');\n`;
    const stripped = stripComments(sample);
    const hits = FORBIDDEN.filter(({ pattern }) => pattern.test(stripped)).map((f) => f.name);
    expect(hits).toContain('axios');
    expect(hits).toContain('fetch');
  });

  it('ignores mentions inside comments', () => {
    const sample = `// this file must never import axios\n/* or call fetch() */\nexport const x = 1;\n`;
    const stripped = stripComments(sample);
    const hits = FORBIDDEN.filter(({ pattern }) => pattern.test(stripped));
    expect(hits).toEqual([]);
  });
});
