/**
 * MCP transports.
 *
 * The stdio test speaks real JSON-RPC to a real child process — the same
 * handshake Claude Desktop performs. That is the demo in docs/03_App_Flow.md
 * Part E step 8, so it is worth proving it works rather than assuming.
 */
import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { registerAllTools, EXPECTED_TOOLS } from '../src/mcp/tools/index.js';

const STDIO = path.resolve(import.meta.dirname, '../src/mcp/stdio.js');

/**
 * Speaks newline-delimited JSON-RPC to the stdio server and collects replies.
 * Resolves once `wanted` responses have arrived or the timeout expires.
 */
function talkToStdioServer(messages, { wanted = 1, timeoutMs = 20_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [STDIO], {
      // No MONGO_URI: an MCP client must be able to list tools with no database.
      env: { ...process.env, NODE_ENV: 'test', MONGO_URI: '', LOG_LEVEL: 'silent' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const responses = [];
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`stdio server timed out.\nstdout: ${stdout}\nstderr: ${stderr}`));
    }, timeoutMs);

    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      const lines = stdout.split('\n');
      stdout = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try { responses.push(JSON.parse(line)); } catch { /* partial frame */ }
      }
      if (responses.length >= wanted) {
        clearTimeout(timer);
        child.kill();
        resolve({ responses, stderr });
      }
    });

    child.on('error', (err) => { clearTimeout(timer); reject(err); });

    // Give the server a moment to register tools and connect the transport.
    setTimeout(() => {
      for (const m of messages) child.stdin.write(`${JSON.stringify(m)}\n`);
    }, 1500);
  });
}

const INITIALISE = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'agentiq-test-client', version: '1.0.0' },
  },
};

describe('stdio transport', () => {
  it('completes the MCP handshake', async () => {
    const { responses } = await talkToStdioServer([INITIALISE], { wanted: 1 });
    const init = responses.find((r) => r.id === 1);
    expect(init, JSON.stringify(responses)).toBeTruthy();
    expect(init.result.serverInfo.name).toBe('agentiq');
    expect(init.result.capabilities).toHaveProperty('tools');
  }, 30_000);

  it('lists all nine tools to an external client', async () => {
    const { responses } = await talkToStdioServer(
      [
        INITIALISE,
        { jsonrpc: '2.0', method: 'notifications/initialized' },
        { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
      ],
      { wanted: 2 },
    );
    const list = responses.find((r) => r.id === 2);
    expect(list, JSON.stringify(responses)).toBeTruthy();
    const names = list.result.tools.map((t) => t.name).sort();
    expect(names).toEqual([...EXPECTED_TOOLS].sort());
  }, 30_000);

  it('writes nothing but JSON-RPC to stdout — logs must go to stderr', async () => {
    // A single stray console.log corrupts the protocol stream and the client
    // disconnects with a parse error. This is the most common way to break a
    // stdio MCP server, so it is asserted rather than assumed.
    const { responses, stderr } = await talkToStdioServer([INITIALISE], { wanted: 1 });
    expect(responses.every((r) => r.jsonrpc === '2.0')).toBe(true);
    expect(stderr).toMatch(/tools registered/);
  }, 30_000);
});

describe('streamable-HTTP transport', () => {
  const app = createApp({ logging: false });

  it('requires authentication', async () => {
    await registerAllTools();
    const res = await request(app).post('/api/mcp').send(INITIALISE);
    expect(res.status).toBe(401);
  });

  it('does not shadow the concrete /api/mcp/* routes', async () => {
    // The catch-all is declared last on purpose; if it were first it would
    // swallow /tools, /audit and /grants.
    const res = await request(app).get('/api/mcp/tools');
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(9);
  });
});
