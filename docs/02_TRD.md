# 02 — How it is wired

### Architecture, the exact stack, and the constraints that produced it

> Companion to [01_PRD.md](01_PRD.md). Read that for *what*. This is *how*.
> Every version in §2 was resolved from the npm registry and **install-tested together on
> 17 Aug 2026** with zero peer-dependency conflicts. Do not "upgrade to latest" casually —
> the matrix is the deliverable, not the individual numbers.

---

## 1. The shape of it

```
┌──────────────────────────────────────────────────────────────────────────┐
│  BROWSER — React 19 SPA (Vite 8, Tailwind 4)                             │
│  Dashboard · Test Runner · Security · Specs · API Client                  │
│  History · Deploy · Tool Registry · Audit Log · Settings                  │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ HTTPS + Bearer JWT
┌───────────────────────────────▼──────────────────────────────────────────┐
│  API SERVER — Express 5 (Node 22)                                        │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Route layer   /api/auth /runs /ai /security /specs /deploy /mcp    │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │ Orchestrator  analyze.service — sequences agents, builds TestRun   │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │ AGENTS   testing.agent · security.agent · deployment.agent         │  │
│  │          (agents hold NO I/O — they only call tools)               │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │ ██ MCP LAYER ██  registry · Zod schemas · permission gate · audit  │  │
│  │    http_request  run_test_case  probe_sqli  probe_xss  probe_auth  │  │
│  │    probe_cors    probe_headers  parse_openapi  deploy_service      │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │ Guarded egress — SSRF filter · per-host rate limit · timeout · cap │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└────────┬──────────────────────┬──────────────────────┬──────────────────┘
         │                      │                      │
   ┌─────▼─────┐        ┌───────▼───────┐      ┌───────▼────────┐
   │ MongoDB   │        │ LLM providers │      │ Target APIs    │
   │ Atlas M0  │        │ Groq → Gemini │      │ user-nominated │
   │ users,    │        │ (free tier)   │      │ Render API     │
   │ runs,     │        └───────────────┘      └────────────────┘
   │ specs,    │
   │ audit     │
   └───────────┘
```

**The one architectural rule that matters:** an agent may not perform I/O. It may only call an
MCP tool. If you ever find `axios` imported inside `security.agent.js`, the MCP claim is dead and
so is the project's contribution. Enforce this with a lint rule (§11).

---

## 2. Stack — exact, verified, install-tested

### Runtime

| | Version | Why |
|---|---|---|
| **Node.js** | **22.x LTS** (≥ 22.12.0) | Vite 8 requires `^20.19 \|\| >=22.12`; Mongoose 9 requires ≥ 20.19. 22 LTS satisfies both with headroom. Pin in `.nvmrc` and `engines`. |
| **Package manager** | npm 10+ | Ships with Node 22. No pnpm/yarn — one less thing to explain. |

### Backend

| Package | Version | Notes |
|---|---|---|
| `express` | `5.2.1` | **v5** — async errors auto-forward; `req.query` is a getter; path-to-regexp v8 |
| `mongoose` | `9.9.2` | requires Node ≥ 20.19 |
| `@modelcontextprotocol/sdk` | `1.30.0` | `McpServer`, `registerTool`, streamable-HTTP + stdio transports |
| `zod` | `4.4.3` | **v4** — shared with frontend; source of truth for all tool schemas |
| `axios` | `1.19.0` | only ever called from inside the egress guard |
| `jsonwebtoken` | `9.0.3` | |
| `bcryptjs` | `3.0.3` | **pure JS — remove native `bcrypt` entirely.** It was an unused dep and the cause of the cross-platform native-build pain |
| `passport` / `passport-google-oauth20` | `0.7.0` / `2.0.0` | lazily registered (§8) |
| `cors` / `cookie-parser` | `2.8.6` / `1.4.7` | |
| `helmet` | `8.3.0` | **new** — security headers on your own API |
| `express-rate-limit` | `8.6.2` | **new** — auth + scan endpoints |
| `pino` / `pino-http` | `10.3.1` / `11.0.0` | **new** — structured logs, redaction of secrets |
| `@apidevtools/swagger-parser` | `12.1.0` | **new** — OpenAPI 3.x parse + `$ref` dereference |
| `dotenv` | `17.4.2` | |

Dev: `vitest@4.1.10`, `supertest@7.2.2`, `mongodb-memory-server@11.2.0`, `nodemon@3.1.14`,
`eslint@9`.

### Frontend

| Package | Version | Notes |
|---|---|---|
| `react` / `react-dom` | `19.2.8` | |
| `vite` | `8.2.1` | |
| `@vitejs/plugin-react` | `6.0.5` | peer `vite ^8.0.0`. Its `@rolldown/plugin-babel` and `babel-plugin-react-compiler` peers are **optional** — do not install them |
| `typescript` | `7.0.2` | native port, current `latest`. **Fallback: `5.9.3`** if any tooling misbehaves — record which you used |
| `tailwindcss` + `@tailwindcss/vite` | `4.3.3` | **v4 — CSS-first config.** See §3 |
| `react-router-dom` | `7.18.2` | v7 |
| `@tanstack/react-query` | `5.101.4` | server state |
| `zustand` | `5.0.15` | client state (auth, theme) |
| `react-hook-form` | `7.85.0` | peer of resolvers ≥ 7.55 ✓ |
| `@hookform/resolvers` | `5.9.1` | peer `zod ^3.25 \|\| ^4.0` ✓ |
| `zod` | `4.4.3` | same major as backend — share schema definitions |
| `recharts` | `3.10.1` | **v3** |
| `lucide-react` | `1.31.0` | **v1** |
| `axios` | `1.19.0` | |
| `clsx` | `2.1.1` | |

Dev: `@types/react@19.2.18`, `@types/react-dom@19`, `vitest@4.1.10`, `eslint@9`.

> **Verified:** both dependency sets were installed together in a clean workspace on 17 Aug 2026.
> `npm ls --depth=0` clean, no `ERESOLVE`, no peer warnings. If you deviate, re-run that check.

---

## 3. Breaking-change landmines

The Sem 6 code targets React 18 / Vite 5 / Tailwind 3 / Zod 3 / Router 6 / Recharts 2. **Every one
of those is a major version behind.** Do not migrate incrementally — scaffold the frontend fresh
and port components. Read this section before writing a line of UI.

**Tailwind v4 — the big one.** There is no `tailwind.config.js` and no `postcss.config.js`.
- Vite plugin: `import tailwindcss from '@tailwindcss/vite'` in `vite.config.ts`.
- CSS entry is `@import "tailwindcss";` — **not** `@tailwind base/components/utilities`.
- Design tokens live in CSS: `@theme { --color-primary: #1B4D89; ... }`, which generates
  `bg-primary`, `text-primary` etc. automatically.
- `@layer components` still works for `.btn`, `.card` shorthands.
- Any Sem 6 file with `@tailwind base` or a JS config is v3 and must be rewritten.

**Express 5.**
- Rejected promises in handlers auto-forward to the error middleware — delete manual
  `try/catch → next(err)` boilerplate.
- `req.query` is a getter; you cannot assign to it.
- Wildcards need names: `app.use('/*splat', handler)`, not `app.use('*', handler)`. This bites on
  the SPA fallback route.

**Zod 4.**
- `z.string().email()` → `z.email()`; same for `url()`, `uuid()`.
- Error customisation: `{ message }` → `{ error }`.
- `.strict()` semantics changed — read the migration note before relying on it.

**React Router 7.** Package still `react-router-dom`; v6 data-router APIs carry over. Prefer
`createBrowserRouter`. Check `useNavigate` and loader typings against v7 docs.

**React 19.** `forwardRef` is no longer needed — `ref` is a normal prop. `useFormState` →
`useActionState`. Strict Mode double-invokes effects in dev; do not "fix" that with a ref hack.

**Recharts 3.** `ResponsiveContainer` sizing behaviour changed; some `Tooltip`/`Legend` props were
renamed. Verify each chart visually, do not trust the v2 code to compile-and-look-right.

**Mongoose 9.** `strictQuery` default changed; some callback signatures removed (promises only).

---

## 4. Repository layout

```
AgenticIQ/
├── MASTER_PROMPT.md            ← point Claude Code here
├── README.md                   ← 5-minute quickstart
├── .nvmrc                      ← 22
├── .gitattributes              ← * text=auto eol=lf   (fixes the CRLF mess for good)
├── .gitignore
├── .env.example                ← every var, no values
├── package.json                ← workspace root, concurrently scripts
├── docs/
│   ├── 00_SEM6_AUDIT.md  01_PRD.md  02_TRD.md  03_App_Flow.md  04_App_UI.md
│   └── 90_EVALUATION.md        ← generated by the harness
├── server/
│   ├── src/
│   │   ├── index.js            ← boot only: config check → app → listen
│   │   ├── app.js              ← express app, no listen (so tests can import it)
│   │   ├── config/             ← env.js (validated with Zod, fail fast)
│   │   ├── mcp/
│   │   │   ├── server.js       ← McpServer instance + transport
│   │   │   ├── registry.js     ← tool registration, single source of truth
│   │   │   ├── permissions.js  ← risk classes, grant checks
│   │   │   ├── audit.js        ← writes every invocation
│   │   │   ├── egress.js       ← SSRF guard, rate limit, timeout, size cap
│   │   │   └── tools/          ← one file per tool
│   │   ├── agents/             ← testing · security · deployment  (NO I/O HERE)
│   │   ├── services/           ← analyze, llm (provider abstraction), openapi
│   │   ├── models/             ← User, TestRun, ApiSpec, AuditEvent, Deployment
│   │   ├── routes/  controllers/  middleware/  utils/
│   └── tests/                  ← vitest + supertest
├── web/
│   ├── src/
│   │   ├── main.tsx  App.tsx  index.css   ← Tailwind v4 @theme lives here
│   │   ├── components/{ui,layout,charts}/
│   │   ├── pages/  hooks/  services/  store/  types/  lib/
│   └── vite.config.ts
├── fixtures/
│   ├── vulnerable-api/         ← deliberately broken (evaluation target)
│   └── hardened-api/           ← same contract, defects fixed
└── evaluation/
    ├── run.js                  ← npm run evaluate
    ├── mutations/              ← seeded behavioural mutations
    └── results/                ← generated tables → docs/90_EVALUATION.md
```

`server/` and `web/` — not `backend/` and `frontend/`. Rename deliberately: it is a clean break
from the Sem 6 tree and makes "which copy is real?" unambiguous forever.

---

## 5. The MCP layer

### 5.1 Registration

One file owns the registry. Tools are registered with `registerTool` (not the deprecated `tool`):

```js
// server/src/mcp/registry.js
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export const mcp = new McpServer(
  { name: 'agentiq', version: '2.0.0' },
  { capabilities: { tools: {} } }
);

export const TOOLS = [];   // mirror used by /api/mcp/tools and the permission gate

export function defineTool({ name, title, description, riskClass, inputSchema, outputSchema, handler }) {
  TOOLS.push({ name, title, description, riskClass, inputSchema, outputSchema });
  mcp.registerTool(
    name,
    { title, description, inputSchema, outputSchema },
    withGuards({ name, riskClass, handler })     // permission → audit → egress → handler
  );
}
```

`withGuards` is the whole architecture in one wrapper, and the order is not negotiable:

```
permission check  →  audit "started"  →  input validation (SDK does this)
                  →  egress guard      →  handler
                  →  audit "ok" | "denied" | "error"  (always, even on throw)
```

### 5.2 Risk classes

| Class | Meaning | Default |
|---|---|---|
| `local.compute` | No network. Parsing, evaluation. | auto-granted |
| `network.read` | Benign request to a user-nominated host | granted per host |
| `network.probe` | Attack-indicator payloads to a user-nominated host | **explicit grant, per host, per session** |
| `deploy.write` | Mutates external infrastructure | explicit grant + confirmation |

Grants are stored on the session and echoed in every audit record. **`network.probe` must never be
auto-granted.** Firing SQLi payloads at a host the user did not knowingly nominate is the one
mistake in this project that would be genuinely serious.

### 5.3 Audit record

```js
{ _id, userId, runId, tool, riskClass, targetHost,
  inputHash,            // sha256 of canonicalised input — never store raw payloads with creds
  outcome,              // 'ok' | 'denied' | 'error' | 'blocked_ssrf' | 'rate_limited'
  errorCode, durationMs, ts }
```

Immutable: no update or delete path exists in the API. Say that out loud in the viva.

### 5.4 Transport

Register the MCP server over **streamable HTTP** at `/api/mcp` behind auth, so an external MCP
client (Claude Desktop, an IDE) can drive AgentIQ's tools directly. Also expose a **stdio**
entrypoint `server/src/mcp/stdio.js` for local clients.

> This is a real differentiator and cheap to add once the registry exists: *AgentIQ is not just
> built on MCP, it is itself an MCP server other agents can use.* Demo it live by connecting a
> client and calling `probe_headers`. That single demo retires any doubt about the claim.

---

## 6. Agents

Thin orchestration over tools. No I/O.

**Testing agent** — build prompt (spec-grounded if a spec is attached) → LLM call in JSON mode →
Zod validation → one bounded repair retry → for each case call `run_test_case` → collect
per-assertion results. Emits `{ cases, results, discarded, tokensUsed }`.

**Security agent** — for each enabled family: call `http_request` for the baseline, then the
`probe_*` tool, then classify against the baseline. Emits findings with severity, OWASP category,
payload, signal, explanation, remediation.

**Deployment agent** — pre-flight checks → `deploy_service` → poll → on success re-invoke the
testing and security agents against the live URL.

### Assertion types (the contract the LLM must emit)

```ts
type Assertion =
  | { kind: 'status';           expected: number }
  | { kind: 'responseTimeUnder'; ms: number }
  | { kind: 'jsonPathExists';   path: string }
  | { kind: 'jsonPathEquals';   path: string; value: unknown }
  | { kind: 'jsonPathType';     path: string; type: 'string'|'number'|'boolean'|'object'|'array'|'null' }
  | { kind: 'headerPresent';    name: string }
  | { kind: 'headerEquals';     name: string; value: string }
  | { kind: 'bodyMatches';      pattern: string }   // RE2-safe subset only
```

Evaluated deterministically in `run_test_case`. **The LLM proposes assertions; it never judges
whether one passed.** That separation is what makes results trustworthy, and it is worth a
paragraph in the report.

`bodyMatches` compiles user/LLM-supplied regex — cap pattern length, reject nested quantifiers, and
time-box execution, or you have handed yourself a ReDoS.

---

## 7. Egress guard — SSRF, and why it matters {#ssrf}

**This is the most important security control in the system.** AgentIQ accepts a URL from a user
and fetches it from your server. Without controls, that is a textbook SSRF proxy: a user asks it
to fetch `http://169.254.169.254/latest/meta-data/` and your cloud credentials leave the building.

Every outbound request — no exceptions, from every tool — goes through `mcp/egress.js`:

1. **Scheme allow-list:** `http`, `https` only.
2. **Resolve DNS first, then validate the resolved IP.** Validating the hostname is not enough —
   an attacker controls DNS and can point `evil.com` at `127.0.0.1`.
3. **Block** loopback `127.0.0.0/8` `::1` · private `10/8` `172.16/12` `192.168/16` `fc00::/7` ·
   link-local `169.254/16` `fe80::/10` (**this is the cloud metadata range**) · `0.0.0.0/8` ·
   multicast · `.local` / `.internal` suffixes.
4. **Pin the resolved IP for the actual connection** so DNS cannot change between check and fetch
   (TOCTOU / DNS rebinding).
5. **Cap redirects at 3**, re-validating every hop. A redirect to `169.254.169.254` is the
   classic bypass.
6. **Timeout 10 s**, **response cap 5 MB**, **per-host rate limit 5 req/s**.
7. Blocked attempts write an audit record with `outcome: 'blocked_ssrf'`.

Add an env-gated `ALLOW_PRIVATE_TARGETS=true` for local development against the fixture apps on
`localhost` — **off by default, and refused entirely in production.**

> Write a test for each blocked range. Six passing SSRF tests is a slide in your presentation and
> a paragraph in your report that no other student project will have.

---

## 8. Auth

- Single `User` model, `authProviders: [{ provider, providerId, email }]`. Collapse the Sem 6
  `mongoUsers` / `googleUsers` split.
- `bcryptjs`, cost 12.
- JWT: HS256, 7-day expiry, `{ sub, email, iat, exp }`. **Boot fails if `JWT_SECRET` is unset** —
  no fallback constant, ever. Rotate the leaked Sem 6 secret in Phase 1.
- **Lazy Google strategy:** register the Passport strategy *inside* a guard that checks the env
  vars are present. Sem 6 registered it at module top level, so a fresh clone crashed on boot.
  Fixing this is the difference between an examiner seeing your app and seeing a stack trace.
- `express-rate-limit` on `/api/auth/*`.
- Redirect URIs from config, never hardcoded to localhost.

## 9. Data model

```
User          { _id, email, displayName, passwordHash?, authProviders[], avatarUrl?, createdAt }
ApiSpec       { _id, userId, title, version, sourceUrl?, raw, operations[], createdAt }
TestRun       { _id, userId, target{url,method,description,intendedPublic}, specRef?,
                summary{totalTests,passed,failed,discarded,findings{critical,high,medium,low}},
                functional[{ name, status, responseTimeMs, assertions[{kind,expected,actual,pass}],
                             explanation? }],
                security[{ family, owasp, severity, vulnerable, payload, signal,
                           baseline, explanation, remediation }],
                tokensUsed, startedAt, finishedAt }
AuditEvent    { see §5.3 }   // immutable
Deployment    { _id, userId, provider, repo, branch, serviceId, status,
                liveUrl?, postDeployRunId?, createdAt }
```

Indexes: `TestRun{userId, startedAt:-1}`, `AuditEvent{userId, ts:-1}`, `AuditEvent{runId}`,
`ApiSpec{userId}`.

## 10. API surface

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` `/login` | JWT |
| `GET` | `/api/auth/google` `/callback` | OAuth |
| `GET` | `/api/auth/me` | current user |
| `POST` | `/api/ai/generate` | generate cases (no execution) |
| `POST` | `/api/runs` | full run: generate → execute → optional scan |
| `GET` | `/api/runs` `/api/runs/:id` | history, detail |
| `GET` | `/api/runs/stats` | dashboard aggregates |
| `POST` | `/api/security/scan` | scan only |
| `POST` | `/api/specs/import` · `GET /api/specs` · `GET /api/specs/:id` | OpenAPI |
| `POST` | `/api/request/send` | ad-hoc client |
| `POST` | `/api/deploy` · `GET /api/deploy/:id` | deployment |
| `GET` | `/api/mcp/tools` | **live registry with JSON Schemas** |
| `GET` | `/api/mcp/audit` | **audit log, filterable** |
| `POST` | `/api/mcp/grants` | grant a risk class for a host |
| `ALL` | `/api/mcp` | streamable-HTTP MCP transport |
| `GET` | `/api/health` | liveness + dependency status |

All `/api/*` except auth and health require a Bearer token. Every response is
`{ success, data }` or `{ success:false, error:{ code, message, details? } }` — one envelope, no
exceptions.

## 11. Testing

- **Unit** (vitest): assertion evaluator, JSON normaliser, SSRF guard (one test per blocked range),
  permission gate, security classifiers, OpenAPI parser.
- **Integration** (supertest + `mongodb-memory-server`): auth, run lifecycle, audit completeness,
  registry endpoint.
- **End-to-end against fixtures:** full run against `vulnerable-api` and `hardened-api`.
- **Architecture test — write this one first:** a test that greps `server/src/agents/**` for
  `axios|fetch|http\.request` and **fails** if found. This is what mechanically protects the MCP
  claim from erosion over 15 weeks.
- **Coverage gate:** 70% on `server/src/mcp/**` and `server/src/agents/**`. Elsewhere, best effort.
- LLM calls are mocked in tests. Never let CI depend on a provider being up.

## 12. Config

```
NODE_ENV  PORT  MONGO_URI  JWT_SECRET(required)  CORS_ORIGIN  APP_BASE_URL  API_BASE_URL
GROQ_API_KEY  GEMINI_API_KEY  LLM_PRIMARY=groq  LLM_FALLBACK=gemini
GOOGLE_CLIENT_ID  GOOGLE_CLIENT_SECRET       (optional — absence must not break boot)
RENDER_API_KEY                                (optional)
EGRESS_TIMEOUT_MS=10000  EGRESS_MAX_BYTES=5242880  EGRESS_RPS_PER_HOST=5
ALLOW_PRIVATE_TARGETS=false
```

Validate the whole set with Zod at boot. Print a readable table of what is set and what is missing,
then exit non-zero if a required var is absent. Frontend reads `VITE_API_URL` — **actually read
it**; Sem 6 declared it and then hardcoded `http://localhost:3001`.

## 13. Deployment & cost

> **⚠️ SUPERSEDED 17 Aug 2026 — see [05_AWS_ARCHITECTURE.md](05_AWS_ARCHITECTURE.md).**
> AWS credits became available, so deployment moved to App Runner + S3/CloudFront + Bedrock, and
> **the ₹0/month claim below no longer holds.** MongoDB Atlas M0 is retained (DocumentDB has no free
> tier). Everything else in this document — the MCP layer, egress guard, agent rules, data model —
> is unchanged and provider-agnostic. The original plan is kept here as the recorded alternative.

Server → Render free web service. Web → Render static site or Vercel. DB → MongoDB Atlas M0.
LLM → Groq free tier (`llama-3.1-8b-instant`: 30 RPM / 6K TPM / 14.4K RPD), Gemini free tier as
fallback. **Total ₹0/month.**

Free tiers cold-start. Add a `/api/health` warm ping and **open the app three minutes before your
demo.** A cold start during a viva reads as a broken app.

## 14. Non-functionals

| | Target |
|---|---|
| p95 run latency (4 tests, no scan) | < 15 s |
| p95 security scan (6 families) | < 30 s |
| Dashboard first paint | < 2 s warm |
| Outbound probe rate | ≤ 5 req/s per host |
| Secrets in logs | zero — pino redaction on `authorization`, `*.key`, `*.secret`, `*.token` |
| Accessibility | WCAG 2.1 AA |
| Browsers | Last 2 versions of Chrome, Firefox, Safari, Edge |
