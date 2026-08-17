/**
 * parse_openapi — parse, dereference and validate an OpenAPI 3.x document.
 *
 * docs/01_PRD.md F4. Risk class local.compute: this tool does no network I/O
 * itself. A spec fetched by URL is retrieved by http_request first (which is
 * network.read and therefore permission-gated) and the raw text handed here, so
 * the two concerns stay separated and each is audited on its own terms.
 *
 * Phase 9 builds the full ingestion flow on top of this.
 */
import { z } from 'zod';
import SwaggerParser from '@apidevtools/swagger-parser';
import { defineTool } from '../registry.js';
import { RISK_CLASS } from '../permissions.js';

export const inputSchema = z.object({
  // The document itself, as JSON or YAML text. Never a URL — see above.
  spec: z.string().min(1, { error: 'Provide the specification document as text' }),
});

const operationSchema = z.object({
  operationId: z.string().nullable(),
  method: z.string(),
  path: z.string(),
  summary: z.string().nullable(),
  parameters: z.array(z.object({
    name: z.string(), in: z.string(), required: z.boolean(), schema: z.unknown().nullable(),
  })),
  requestBody: z.unknown().nullable(),
  responses: z.array(z.object({ status: z.string(), description: z.string().nullable() })),
  security: z.array(z.string()),
});

export const outputSchema = z.object({
  title: z.string(),
  version: z.string(),
  openapi: z.string(),
  operationCount: z.number(),
  operations: z.array(operationSchema),
  securitySchemes: z.array(z.object({ name: z.string(), type: z.string(), scheme: z.string().nullable() })),
});

/** YAML or JSON in, object out. Errors name the offending location. */
function parseDocument(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch (err) {
      const err2 = new Error(`Specification is not valid JSON: ${err.message}`);
      err2.code = 'SPEC_PARSE_ERROR';
      throw err2;
    }
  }
  const err = new Error(
    'Specification does not look like JSON. YAML support arrives with the full ingestion flow in Phase 9.',
  );
  err.code = 'SPEC_PARSE_ERROR';
  throw err;
}

export function extractOperations(api) {
  const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
  const operations = [];
  for (const [path, item] of Object.entries(api.paths ?? {})) {
    for (const method of METHODS) {
      const op = item?.[method];
      if (!op) continue;
      operations.push({
        operationId: op.operationId ?? null,
        method: method.toUpperCase(),
        path,
        summary: op.summary ?? op.description ?? null,
        parameters: [...(item.parameters ?? []), ...(op.parameters ?? [])].map((p) => ({
          name: p.name,
          in: p.in,
          required: Boolean(p.required),
          schema: p.schema ?? null,
        })),
        requestBody: op.requestBody ?? null,
        responses: Object.entries(op.responses ?? {}).map(([status, r]) => ({
          status,
          description: r?.description ?? null,
        })),
        security: (op.security ?? api.security ?? []).flatMap((s) => Object.keys(s)),
      });
    }
  }
  return operations;
}

export default defineTool({
  name: 'parse_openapi',
  title: 'Parse OpenAPI specification',
  description:
    'Parse, dereference and validate an OpenAPI 3.x document, returning its operations, ' +
    'parameters, declared responses and security schemes. No network access.',
  riskClass: RISK_CLASS.LOCAL_COMPUTE,
  inputSchema,
  outputSchema,
  async handler(input) {
    const raw = parseDocument(input.spec);

    let api;
    try {
      // dereference resolves $refs so downstream prompts see real schemas.
      api = await SwaggerParser.dereference(raw);
    } catch (err) {
      // Name the offending path rather than surfacing a raw stack trace
      // (docs/01_PRD.md F4 acceptance criterion).
      const e = new Error(`Could not parse specification: ${err.message}`);
      e.code = 'SPEC_PARSE_ERROR';
      throw e;
    }

    const operations = extractOperations(api);
    return {
      title: api.info?.title ?? 'Untitled API',
      version: api.info?.version ?? '0.0.0',
      openapi: api.openapi ?? api.swagger ?? 'unknown',
      operationCount: operations.length,
      operations,
      securitySchemes: Object.entries(api.components?.securitySchemes ?? {}).map(([name, s]) => ({
        name,
        type: s.type ?? 'unknown',
        scheme: s.scheme ?? null,
      })),
    };
  },
});
