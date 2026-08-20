# AGENTIQ — complete walkthrough

**Read this first.** It explains what exists, why it is shaped the way it is, and — in
§12 — everything that is weak, unfinished, or worth changing. Nothing is omitted to make
the project look better than it is.

Written 18 Aug 2026 against commit `4796d09`. Every figure was measured, not recalled.

---

## 1 · What this is, in one paragraph

You give AGENTIQ an API endpoint and a sentence describing it. An LLM writes executable
test cases; a deterministic tool runs them and decides pass or fail; six probe families
look for vulnerability indicators; failures get explained in English; and a deployment
agent can ship a service and then test the thing it just shipped.

**The contribution is not "an LLM writes tests".** It is that every side effect goes
through a registry where permission, schema validation, SSRF checking and auditing are
applied *by construction*. An agent in this codebase cannot open a socket. That is
enforced by a test, not by discipline.

---

## 2 · Size

| Area | Files | Lines | What lives here |
| --- | --: | --: | --- |
| `server/src` | 60 | 8,499 | API, MCP tool layer, agents, guards |
| `server/tests` | 21 | 5,189 | 429 tests |
| `web/src` | 33 | 4,729 | React frontend |
| `evaluation/` | 7 | 1,394 | The harness that produces Chapter 4 |
| `fixtures/` | 7 | 805 | Two deliberately-paired test APIs |
| `docs/` | 12 | 3,013 | Specs and generated reports |

453 tests total (429 server + 24 fixtures). No frontend tests — see §12.

---

## 3 · The one idea, and why everything else follows from it

Almost every design choice traces back to a single rule:

> **Agents never perform I/O. They may only call a registered tool.**

An LLM-driven agent that can call `axios` directly is indistinguishable from a script
that does whatever the model says. Once every outbound action must pass through one
registry, you get four properties for free and permanently:

| Property | Where it is enforced |
| --- | --- |
| The user consented to this host and this risk | `mcp/permissions.js` |
| The input matched a schema | `mcp/registry.js` (Zod) |
| The target is not an internal address | `mcp/egress.js` |
| It is recorded whether it succeeded or not | `mcp/audit.js` |

The rule is mechanical. `server/tests/architecture.test.js` fails the build if `axios`,
`fetch`, `node:http`, `node:net` or `child_process` appears anywhere under
`server/src/agents/`, `controllers/` or `routes/`. It has already caught a real hole —
see §12.1.

---

## 4 · Repository map

```
AGENTIQ/
├── server/                  Express API — the whole backend
│   └── src/
│       ├── index.js         BOOT: validate env → connect Mongo → listen. The only
│       │                    file allowed to exit the process.
│       ├── app.js           Builds the Express app. Importable without side effects,
│       │                    which is what makes it testable.
│       ├── config/
│       │   ├── env.js       Zod-validates EVERY variable, prints a masked table,
│       │   │                exits non-zero if a required one is missing.
│       │   └── passport.js  Google OAuth strategy, registered LAZILY (see §7.3).
│       ├── mcp/             ★ THE TOOL LAYER — the project's contribution
│       │   ├── registry.js  defineTool() + withGuards(). The choke point.
│       │   ├── permissions.js  Risk classes and the grant store.
│       │   ├── audit.js     Append-only audit writer.
│       │   ├── egress.js    ★ The SSRF guard. The only path to a socket.
│       │   ├── ipRules.js   Pure IP classification. No I/O, heavily tested.
│       │   ├── transport.js Streamable-HTTP MCP transport.
│       │   ├── stdio.js     stdio MCP transport (what Claude Desktop speaks).
│       │   ├── probes/      Baseline differential + DB error fingerprints.
│       │   └── tools/       The nine tools.
│       ├── agents/          ★ NO I/O ALLOWED. Orchestration only.
│       ├── services/        Business logic: runs, specs, LLM, mail, deployment.
│       ├── models/          Mongoose schemas.
│       ├── routes/          HTTP surface.
│       ├── controllers/     Only auth. Everything else is route → service.
│       └── middleware/      auth, error handling.
├── web/                     React 19 + Vite 8 + Tailwind v4
├── fixtures/                vulnerable-api and hardened-api — IDENTICAL contract
├── evaluation/              The Chapter 4 harness
└── docs/                    Specs, setup guides, generated evaluation
```

---

## 5 · What happens when you click "Run tests"

Follow one request all the way down. This is the clearest way to understand the system.

```
POST /api/runs  { url, method, description, count }
  │
  ├─ routes/runs.routes.js — protectRoute (JWT) → Zod validation
  │
  ├─ services/run.service.js  startRun()
  │   │  STATE MACHINE — every terminal state persists a TestRun.
  │   │  A failed run is data, not a void.
  │   │
  │   ├─ DRAFT → AWAITING_GRANT
  │   │    hasRequiredGrant()? If not → CANCELLED. NO PACKET HAS LEFT.
  │   │
  │   ├─ → GENERATING
  │   │    agents/testing.agent.js  generateCases()
  │   │      services/llm.js → Bedrock Nova Lite (fallback: Groq)
  │   │      Model returns JSON. Invalid cases are DISCARDED AND COUNTED.
  │   │      Zero usable cases → GEN_FAILED, visible, not a fake success.
  │   │
  │   ├─ → EXECUTING
  │   │    For each case: runTool('run_test_case', …)
  │   │      └─ mcp/registry.js withGuards()  ← EVERY tool call goes here
  │   │           1. permission gate      (denied → audit + throw)
  │   │           2. audit: started
  │   │           3. Zod schema validation
  │   │           4. handler → mcp/egress.js fetchGuarded()
  │   │                • scheme allow-list
  │   │                • hostname suffix block
  │   │                • DNS resolve → validate EVERY address
  │   │                • PIN the IP (defeats DNS rebinding)
  │   │                • per-host rate limit
  │   │                • timeout, 3 redirects max, re-validated each hop
  │   │                • streamed response, hard byte cap
  │   │           5. audit: ok | denied | error | blocked_ssrf  ← ALWAYS, in finally
  │   │
  │   │    THE TOOL decides pass/fail, not the model. The LLM proposed the
  │   │    assertion; run_test_case evaluates it and reports expected vs actual.
  │   │
  │   ├─ → EXPLAINING (only if something failed)
  │   │    Time-boxed, budgeted, best-effort. NEVER blocks completion.
  │   │
  │   └─ → COMPLETE
  │
  └─ 201 with the persisted run
```

**Why the LLM never judges.** If the model both writes the assertion and decides whether
it passed, a green run proves the model was self-consistent — not that the API is
correct. Splitting proposal from judgement is what makes the pass rate mean anything.

---

## 6 · The MCP tool layer

### 6.1 The nine tools

| Tool | Risk class | What it does |
| --- | --- | --- |
| `http_request` | `network.read` | One HTTP request. Everything else builds on it. |
| `run_test_case` | `network.read` | Executes a case, evaluates assertions **deterministically**. |
| `parse_openapi` | `local.compute` | YAML/JSON → dereferenced operations. No network. |
| `probe_headers` | `network.read` | Security-header analysis. |
| `probe_cors` | `network.read` | CORS misconfiguration, incl. wildcard+credentials. |
| `probe_sqli` | `network.probe` | SQLi indicators vs a benign baseline, with DB fingerprints. |
| `probe_xss` | `network.probe` | Reflected-XSS indicators, escaping-aware. |
| `probe_auth` | `network.probe` | Three requests: valid, **tampered**, anonymous. |
| `deploy_service` | `deploy.write` | Render deployment. Grant **and** confirmation. |

### 6.2 Risk classes, and why they are not per-tool

| Class | Auto-granted | Needs host | Needs confirmation |
| --- | --- | --- | --- |
| `local.compute` | ✅ yes | no | no |
| `network.read` | no | ✅ | no |
| `network.probe` | **never, under any config** | ✅ | no |
| `deploy.write` | no | no | ✅ |

Asking someone to approve nine tools individually is theatre — they click through it.
Asking them to approve *"this app may send attack-indicator payloads to
api.example.com"* is a decision a human can actually make.

Grants are **per session, in memory**, and expire in an hour. A permission that outlives
the session that granted it is the unaccountable-automation problem this project exists
to avoid. (This has a cost — see §12.4.)

### 6.3 The egress guard, step by step

`mcp/egress.js` is the single most important file. Order matters:

1. **Scheme allow-list** — http/https only. `file:`, `gopher:` and `data:` are SSRF
   vectors in their own right.
2. **Hostname suffix block** — `.local`, `.internal`, `localhost`.
3. **Resolve DNS, then judge the ADDRESS.** Validating a hostname is useless; an
   attacker controls DNS and can point `evil.com` at `127.0.0.1`. **Every** returned
   address is checked, not just the one to be used.
4. **PIN the resolved IP.** Node's agent accepts a `lookup` override, so the connection
   uses the address already validated. This defeats DNS rebinding (TOCTOU) — without it
   an attacker answers the validation lookup with a public IP and the connection lookup
   with `169.254.169.254`.
5. **Per-host rate limit** — 5 req/s, so a scan cannot become a DoS against a target the
   user nominated. An ethical requirement, not just a polite one.
6. **Timeout, max 3 redirects, re-validated at every hop.** A redirect to the metadata
   endpoint is the classic bypass of a guard that only checks the first URL.
7. **Streamed response with a hard byte cap.**

`ALLOW_PRIVATE_TARGETS=true` relaxes 2–3 for local fixture testing. It is **refused when
`NODE_ENV=production`**, and it can **never** unlock the cloud metadata range — that rule
is unconditional, because the flag is set at runtime by tests and the evaluation harness
and so bypasses the boot-time check.

### 6.4 The audit trail

Every tool invocation writes one row: `{ userId, sessionId, runId, tool, riskClass,
targetHost, inputHash, outcome, errorCode, reason, durationMs, ts }`.

- The write is in a `finally` block, so a handler that throws still produces a row.
  An unaudited failure is worse than a failure.
- `inputHash` is a SHA-256 of the **canonicalised** input (keys sorted at every level),
  never the input itself.
- The collection is **append-only, enforced at the mongoose layer** — `updateOne`,
  `deleteOne`, `findOneAndUpdate` etc. all throw. There is no update route to remove.
- A test asserts `audit-row-count == tool-call-count`.

---

## 7 · The other subsystems

### 7.1 LLM routing (`services/llm.js`)

Two providers, two tasks, routed independently:

| Task | Bedrock | Groq |
| --- | --- | --- |
| `generation` | `nova-lite` | `gpt-oss-120b` |
| `explanation` | `nova-lite` | `gpt-oss-20b` |

Bedrock is primary — cheaper ($0.000156/generation vs $0.00055), faster, no free-tier
rate limit, and it scored higher on the harness. **Both tiers were chosen by
measurement, and the obvious guesses were wrong twice:** the cheapest model (`nova-micro`)
succeeded only 3/6 on explanation, and the most expensive (`nova-pro`) scored *lower* on
mutation score for 13× the price. Both experiments are recorded in
`docs/05_AWS_ARCHITECTURE.md`.

`providerOrder()` silently **drops** a provider whose credentials are missing, so the
boot log warns when a named provider is unusable and `/api/health` reports the chain that
will actually resolve. That gap once ran an entire evaluation phase on the wrong
provider.

Generation is deliberately tolerant of formatting slips whose intent is unmistakable: a
bare array is coerced to `{cases:[…]}`, `"body": null` is normalised to absent, an
over-long batch is truncated. Invalid cases are still discarded **and counted**.

### 7.2 The security agent

Six families. A finding requires a **material deviation from a benign baseline** — not a
suspicious-looking string. An endpoint already returning 500 to benign input yields *no
claim at all*: it is broken, not injectable.

The false-positive control that matters most is `intendedPublic`, a user declaration.
Three of four fixture endpoints are meant to be reachable anonymously, so an anonymous
200 there is **correct behaviour** and the auth family reports nothing.

`probe_auth` sends **three** requests — valid, *tampered*, anonymous. The tampered one
with a forged credential is the discriminator: a public endpoint ignores it, a broken one
accepts it. Without a credential to tamper with, the probe **refuses to draw any
conclusion** rather than inferring "no auth" from a 200.

### 7.3 Auth

One `User` collection with an `authProviders` array. Sem 6 kept two collections for one
concept, which made "the same person signed in two ways" unrepresentable.

- **JWT**, 7 days, cookie is `HttpOnly; Secure; SameSite=None` in production.
- **Google OAuth** — the strategy registers *lazily*, only when both credentials exist.
  A fresh clone with no Google config boots fine and the route returns an explanatory 503.
  Signing in with Google on an address that already has a password **links** the provider
  rather than creating a second account.
- **Email verification** — tokens are **hashed at rest** (a verification token is a
  bearer credential), single-use, and re-issuing invalidates the old one. Resend is
  authenticated so there is no address parameter to enumerate with, and rate-limited to
  3/15min per user because it causes mail to be delivered to a third party.
- Verification is **soft**: an unverified user can sign in and use everything, and sees a
  banner. A demo a spam filter can lock you out of is worse than an advisory one.

### 7.4 The evaluation harness

`npm run evaluate` produces `docs/90_EVALUATION.md` — that document *is* Chapter 4.

| Measurement | Result |
| --- | --- |
| Security detection | 16 TP · 0 FP · 0 FN across 48 labelled observations |
| Precision / recall | 100% / 100% |
| **False positives on the hardened app** | **0%** |
| Mutation score, grounded | 50.0% (3 repeats, range 50–50%) |
| Mutation score, description-only | 43.3% (range 40–50%) |
| Cost | $0.004 per full run |

Four methodology decisions changed the numbers materially, and each is stated in the
report: mutants are response-boundary rather than source-level; only *applicable* mutants
are scored; each arm runs 3× and reports mean plus range; and ground-truth labels were
written from the fixtures' defect comments *before* the scanner ran.

The two fixture apps share their seed data and response builders, and a contract test
asserts they answer identically to every benign request. That is what makes "a finding on
one and not the other" attributable to the defect rather than to some other difference.

---

## 8 · Data models

| Model | Purpose | Notable |
| --- | --- | --- |
| `User` | One person | `authProviders[]`; `passwordHash` is `select:false` and stripped in `toJSON` |
| `TestRun` | One run, any terminal state | State machine with `stateHistory` |
| `AuditEvent` | Every tool call | **Append-only, enforced in mongoose** |
| `ApiSpec` | Imported OpenAPI | Parsed operations cached |
| `Deployment` | One deployment | `postDeployRunId` — the link that makes F5 a contribution |
| `EmailVerification` | Verification token | Hash only; **TTL index** auto-expires |

`project.model.js` and `testCase.model.js` are **Sem 6 orphans, imported by nothing** —
see §12.2.

---

## 9 · API surface

All under `/api`. Everything except `/health` and `/auth/*` requires a Bearer token.

| Method | Route | Notes |
| --- | --- | --- |
| GET | `/health` | Liveness, Mongo, **resolved** LLM chain, mail driver |
| POST | `/auth/register` `/auth/login` `/auth/logout` | |
| GET | `/auth/me` | |
| POST | `/auth/verify` `/auth/verify/resend` | POST, not GET — link scanners prefetch |
| GET | `/auth/google` `/auth/google/callback` | 503 when unconfigured |
| GET | `/mcp/tools` | JSON Schemas **generated** from Zod, never hand-written |
| GET | `/mcp/audit` | |
| GET/POST/DELETE | `/mcp/grants` | |
| ALL | `/mcp` | Streamable-HTTP MCP transport |
| POST | `/runs` · GET `/runs` `/runs/:id` `/runs/stats` | `/stats` declared before `/:id` |
| POST | `/security/scan` · GET `/security/families` | |
| POST | `/specs/import` · GET `/specs` `/specs/:id` | |
| POST | `/request/send` | The API client — guarded like everything else |
| POST | `/deployments` `/deployments/preflight` · GET `/deployments` `/deployments/:id` `/deployments/config` | |

---

## 10 · Frontend

React 19, Vite 8, Tailwind v4 (CSS-first — no `tailwind.config.js`, tokens in `@theme`),
TanStack Query for server state, Zustand for auth only.

The load-bearing component is `PermissionSheet`: `network.probe` starts **unchecked**
every time, Esc cancels but Enter does **not** allow, and there is deliberately no
click-outside handler. A consent dialog you can dismiss by reflex is not consent.

Every screen has four designed states — loading, empty, error, populated. Empty states
carry an honest sentence rather than a placeholder chart. A new account shows real zeros;
`passRate` is `null` rather than `0` when nothing has run, because "no data" and "0%" are
different claims.

---

## 11 · Testing

| File | Tests | Guards |
| --- | --: | --- |
| `ipRules.test.js` | 53 | One test per blocked range |
| `egress.test.js` | 43 | SSRF, incl. IP pinning through a hostname |
| `testing.agent.test.js` | 42 | Generation robustness |
| `deployment.test.js` | 41 | F5, against faked control planes |
| `mcp.test.js` | 37 | Registry, permissions, audit completeness |
| `security.agent.test.js` | 34 | Six families, false-positive controls |
| …12 more | 179 | |

Coverage gate: **70% on `src/mcp/**` and `src/agents/**`**, enforced in CI and verified to
fail when breached. Currently `mcp` 92.3%, `agents` 92.3%.

The evaluation harness needs no credentials and makes no outbound request — both external
control planes (Render, GitHub) are faked, and every fake **records** what it received, so
a test can assert that a dry run sends no mutating request at all.

---

## 12 · Everything that is weak, unfinished, or worth changing

This is the section to read with a pen. Ordered by how much I would care.

### 12.1 Already found and fixed — but worth knowing they existed

These are in git history and belong in the report as evidence of a real hardening pass:

- **A live SSRF hole in `POST /api/request/send`.** The API client still called Sem 6
  code that handed the user's URL straight to `axios`. It survived because the
  architecture guard only scanned `agents/`. Now guarded, and the guard covers
  `controllers/` and `routes/` too.
- **`ALLOW_PRIVATE_TARGETS` unlocked the cloud metadata range.** Now unconditional.
- **The MCP HTTP transport served one client at a time.** The second concurrent client
  got a 500 — the headline feature, broken for anyone but the first tab.
- **IP pinning never worked against a hostname.** Node 20+ calls a custom `lookup` with
  `{all:true}` and expects an array; the guard answered positionally. 373 green tests
  missed it because every fixture is an IP literal.
- **`joinUrl` broke every real URL with a path**, so generated suites mostly 404'd.

### 12.2 Dead code — trivial to remove

| Item | Note |
| --- | --- |
| `server/src/models/project.model.js` | Sem 6 orphan, imported by nothing |
| `server/src/models/testCase.model.js` | Sem 6 orphan, imported by nothing |
| `web`: `react-hook-form`, `@hookform/resolvers`, `zod` | Declared, used in **0** files |

**Effort: minutes.** Do it before the report so nobody asks what they are.

### 12.3 Docs promise things the code does not do

`docs/05_AWS_ARCHITECTURE.md` says imported specs and evaluation artifacts go to **S3**,
and that secrets resolve from **Secrets Manager**. `AWS_S3_BUCKET` and `AWS_SECRETS_ID`
exist in `env.js` and **nothing reads them**. Specs are stored inline in Mongo.

**This is the single biggest honesty gap in the project.** Either implement it or amend
the document. A viva question about "where do specs live?" would expose it immediately.
**Effort: half a day to implement, ten minutes to amend.**

### 12.4 In-memory state that breaks on scale-out

Three stores live in process memory:

| Store | Consequence of a restart or a second instance |
| --- | --- |
| `grantStore` | Grants vanish; user re-consents. Annoying, arguably correct. |
| `HostRateLimiter` | The 5 req/s egress cap is **per instance**, so two instances allow 10. |
| MCP `sessions` | A session is pinned to one instance; a load balancer breaks it. |

App Runner can scale to more than one instance. **Decide deliberately**: either pin to a
single instance and say so, or move these to Redis. For a BTP the honest single-instance
answer is fine — but it should be a stated decision, not an accident.

### 12.5 Coverage holes outside the gated trees

| Area | Statements | Why it matters |
| --- | --: | --- |
| `src/lib` | 33% | `db.js`, `logger.js` — mostly boot, low risk |
| `src/utils` | 54% | `token.js` mints JWTs — **worth testing** |
| `src/controllers` | 61% | auth paths |
| `src/middleware` | 60% | error handling, auth |
| `src/routes` | 70% | |
| **`web/src`** | **0%** | **No frontend tests exist at all** |

The frontend has `vitest` configured and zero test files. `PermissionSheet` in particular
encodes security-relevant behaviour (probe unchecked, Enter does not allow) that is
currently protected by nothing. **Effort: a day for a meaningful frontend suite.**

### 12.6 The evaluation is a floor, not a result

- Two fixture applications are **not a population**. Every number describes this
  benchmark.
- Only **four endpoints** are scanned, and only **four** are used for mutation testing.
- Three mutants were **never killed by either arm**: the generator never asserts
  `content-type`, never writes a 404 negative case, and never verifies filter
  correctness. Each is a concrete, fixable prompt weakness.
- Three repeats catches noise; it is not a significance test.

**Highest-value improvement available:** fix the three surviving mutants by adjusting the
generation prompt, then re-run. It would move the mutation score and is a genuinely good
Chapter 4 narrative — *"we measured, found three blind spots, fixed them, and re-measured."*

### 12.7 The deployment agent has never deployed anything real

Every test runs against a faked Render control plane. The dry-run path is exercised; the
mutating path has never touched the real API. **One real deployment before the viva**
would convert F5 from "implemented" to "demonstrated". Effort: an hour with a small repo
that has a `start` script.

### 12.8 Unverified or missing

| Item | State |
| --- | --- |
| `Dockerfile` | Written, **never built** — Docker was not running |
| Screenshots | **None captured.** `docs/screenshots/README.md` lists the seven needed |
| Google consent round-trip | Configuration verified accepted by Google; the click itself untested |
| `web` bundle | 862 KB / 258 KB gzipped, single chunk, no code splitting |

### 12.9 Smaller things

- `probe_headers` and `probe_cors` are `network.read`, so the automatic post-deploy
  verification covers 4 of 6 families. Stated in the UI, but worth a report sentence.
- The rate-limit family is an **indicator**, not a demonstration — 8 successful requests
  do not prove there is no limiter. Scored MEDIUM for that reason.
- Gmail SMTP caps around 500 messages/day and may land in spam.
- `/api/runs` and `/api/specs` accept `limit` but there is no cursor pagination.
- `explain.service.js` uses `maxRepairs: 0` by design, so a malformed reply yields no
  explanation. Acceptable — explanations are a nicety — but it means the explanation rate
  is below 100% and nobody currently measures it.

---

## 13 · Decisions you should be able to defend in a viva

Each of these has a *why*, and the why is the interesting part.

| Decision | The one-line defence |
| --- | --- |
| MCP rather than direct function calls | A convention is defended by discipline; a registry is defended by construction. One choke point for permission, validation, SSRF and audit. |
| The LLM never judges pass/fail | Otherwise green means the model was self-consistent, not that the API is correct. |
| Risk classes, not per-tool prompts | Nine individual approvals is theatre; "may send attack payloads to this host" is a real decision. |
| `network.probe` never auto-granted | Firing SQLi payloads at a host the user did not nominate is the one genuinely serious mistake available here. |
| Grants in memory, session-scoped | A permission that outlives its session is the unaccountable-automation problem itself. |
| Append-only audit | An audit you can edit is not evidence. |
| DNS-resolve-then-pin | Validating a hostname is useless when the attacker controls DNS. |
| `intendedPublic` as a user declaration | A heuristic cannot distinguish "public API" from "broken auth"; the owner can. |
| Two fixtures with an identical contract | Makes a differential finding attributable to the defect and nothing else. |
| Verification is soft | A demo a spam filter can lock you out of is worse than an advisory one. |
| Bedrock over Groq, Lite over Pro | Both chosen by measurement; both obvious guesses were wrong. |

---

## 14 · Where to start reading the code

In this order, it will make sense:

1. `server/src/mcp/registry.js` — `withGuards()`. The whole architecture in 60 lines.
2. `server/src/mcp/egress.js` — the guard, top to bottom.
3. `server/src/services/run.service.js` — the state machine.
4. `server/src/agents/testing.agent.js` — an agent that cannot touch the network.
5. `server/tests/architecture.test.js` — the test that keeps #4 true.
6. `evaluation/mutation.eval.js` — how Chapter 4 is measured.

Every file opens with a comment explaining *why* it is the way it is, and most name the
Sem 6 bug they exist to prevent.
