# AgentIQ — Master Build Prompt

**Paste this to Claude Code, or say: "Read MASTER_PROMPT.md and begin at Phase 0."**

---

## Who you are and what this is

You are building **AgentIQ** to completion: a B.Tech final-year project (BTP) at LNMIIT Jaipur,
Semester 7, Aug–Dec 2026. A partial version was built in Semester 6. Your job is to organise the
existing mess, clean the repository, and then build the complete system end to end — properly
engineered, properly committed, properly tested.

**Read these first, in order, before writing any code:**

1. `docs/00_SEM6_AUDIT.md` — ground truth about what actually exists. The Sem 6 report and README
   describe systems that are **not in the codebase**. Trust this document over both.
2. `docs/01_PRD.md` — what you are building and why. Features F1–F10 with acceptance criteria.
3. `docs/02_TRD.md` — exact stack, versions, MCP design, SSRF guard, data model, API surface.
4. `docs/03_App_Flow.md` — journeys, state machines, every required UI state, the demo script.
5. `docs/04_App_UI.md` — the light design system. Tokens, components, screens.

The repository is `github.com/B-TechProject/AGENTIQ`. The working folder is this one.

---

## Standing rules — these apply to every phase, always

**Git**
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `build:`.
- Commit after every completed task, not once per phase. Small, reviewable commits.
- Push to `origin main` at the end of every phase, minimum. More often is better.
- **Never** `git push --force`. **Never** rewrite published history. The Sem 6 commits are the
  evidence trail of a real two-semester project and their dates matter for a BTP.
- Never commit `node_modules`, `.env`, keys, tokens, or `.DS_Store`.

**Quality**
- Never mark a phase complete with failing tests, type errors, or lint errors.
- Never fabricate data. No mock arrays, no placeholder metrics, no hardcoded stat values, no
  fake progress. If a value is not available, render an empty state. **This is the single most
  important rule in the project** — Sem 6 failed its own report because of mock data presented as
  results.
- Never silently swallow an error into a fallback that looks like success. Sem 6's test generator
  returned three hardcoded fake test cases when the LLM failed. Do not reproduce that pattern
  anywhere.
- Use the **exact** versions in `docs/02_TRD.md` §2. They were install-tested together. Do not
  "upgrade to latest".
- Every new module gets tests in the same commit.

**Progress tracking**
- Maintain `PROGRESS.md` at the repo root. After each phase append: what was built, files
  touched, decisions made, deviations from the docs and why, and what is verified working.
- This file is how Adarsh catches up without reading every diff. Keep it honest — record what
  is *not* done as well.

**When to STOP and ask the human**
Do not guess on any of these. Stop, explain, wait:
1. Anything requiring a secret, API key, or account (Groq, Gemini, Mongo Atlas, Render, Google
   OAuth). List exactly what you need and where to get it.
2. Deleting anything you are not certain is redundant.
3. Any history rewrite or force push.
4. A dependency conflict that cannot be resolved with the pinned matrix.
5. A phase's definition of done cannot be met, and you are considering shipping it anyway.

**Ask once, batch your questions, and keep working on anything unblocked while you wait.**

---

# PHASE 0 — Orient. Write no code.

**Objective:** understand the terrain and produce a plan before touching anything.

**Tasks**
1. Read all five docs listed above, fully.
2. Inventory the working folder. Expect these subfolders, all containing variants of the same
   project: `agentiq/`, `Autonomous-ASD/`, `backend/`, `BTP/`, `BTP2/`.
3. For each: is it a git repo, what remote, what branch, what commit, and does it contain work
   that exists nowhere else?
4. Clone `github.com/B-TechProject/AGENTIQ` to a scratch location. Enumerate every branch:
   `main`, `feature-backend-service`, `copilot/research-project-architecture-analysis`.
5. **Diff `BTP2/` against `BTP/` and against `origin/main`, ignoring whitespace and line endings.**
   `BTP2` is known to be a divergent variant using `@google/generative-ai` instead of Groq, and it
   has `frontend/src/store/themeStore.ts` which main lacks. Identify anything else unique.
6. Verify the toolchain: `node -v` must be ≥ 22.12.0, `npm -v` ≥ 10, `git --version`.

**Definition of done:** a written report in chat covering — folder inventory, branch inventory,
what unique work exists in `BTP2`, toolchain status, and any question you need answered before
Phase 1. **No files created or deleted yet.**

---

# PHASE 1 — Salvage and organise the working folder

**Objective:** one clean working copy. Nothing valuable lost.

**Tasks**
1. Create `_archive/` at the root. Move `agentiq/`, `Autonomous-ASD/`, `backend/`, `BTP2/` into it
   **unmodified**. Do not delete anything in this phase — moving is reversible, deleting is not.
   > Note: `rm` may be blocked on this filesystem. Move, do not delete.
2. Promote `BTP/` to be the working copy: move its contents to the repo root, so `docs/`,
   `MASTER_PROMPT.md`, `backend/`, `frontend/`, `README.md` and `.git/` all sit at the top level.
3. Salvage from `_archive/BTP2/` anything genuinely unique and worth keeping (the theme store is
   probably not, given the light-only decision in `04_App_UI.md` — assess and record the call in
   `PROGRESS.md`).
4. Delete `.DS_Store` files everywhere and add to `.gitignore`.
5. Verify `docs/` and `MASTER_PROMPT.md` survived at the root.

**Definition of done:** repo root contains `docs/`, `MASTER_PROMPT.md`, one `.git/`, one backend,
one frontend, and `_archive/`. Salvage decisions recorded in `PROGRESS.md`.

---

# PHASE 2 — Repository hygiene

**Objective:** clone-and-run on any OS, no secrets, clean history going forward.

**Tasks**
1. **Secrets — do this first.**
   - `server.js` contains `process.env.JWT_SECRET || '<32-char literal>'`. Remove
     the fallback entirely. (Done in Phase 2; value redacted here and rotated.)
   - Grep the whole tree and full git history for other secrets: `git log -p | grep -iE
     "api[_-]?key|secret|token|password|mongodb\+srv"`. Report everything found.
   - **STOP and tell Adarsh**: the JWT secret is public and must be rotated; any Mongo/Groq/Gemini
     key found in history must be revoked and reissued. Do not proceed past this task until he
     confirms.
2. **Stop tracking `node_modules`** — 2,412 files including Windows `.exe` binaries are currently
   tracked. `git rm -r --cached node_modules` at every level; confirm `.gitignore` covers
   `node_modules/` and `**/node_modules/`. **Do not rewrite history to purge them** — that would
   destroy the Sem 6 evidence trail. Stop tracking going forward; that is sufficient.
3. **Line endings — the actual cause of "won't run on Mac".** Add `.gitattributes`:
   ```
   * text=auto eol=lf
   *.png binary
   *.jpg binary
   *.ico binary
   ```
   Then `git add --renormalize .` and commit as a single `chore: normalise line endings` commit.
4. Add `.nvmrc` containing `22`.
5. Rewrite `.gitignore` properly: node_modules, .env*, dist, build, coverage, .DS_Store, *.log,
   .vscode (except extensions.json), _archive/.
6. Create a complete `.env.example` from `docs/02_TRD.md` §12 — every variable, no values.
7. **Branches:** confirm `copilot/research-project-architecture-analysis` is identical to `main`
   and delete it on the remote. Confirm `feature-backend-service` is an ancestor of `main` and
   delete it. Report before deleting.
8. Commit and push.

**Definition of done:** `git status` clean · no secret anywhere in the working tree · no
`node_modules` tracked · `.gitattributes`, `.nvmrc`, `.env.example` present · one branch (`main`)
on the remote · pushed.

---

# PHASE 3 — Foundation

**Objective:** the new skeleton boots, is testable, and mechanically protects its own architecture.

**Tasks**
1. Restructure to the layout in `docs/02_TRD.md` §4: `server/` and `web/` (renaming from
   `backend/` and `frontend/` — a deliberate clean break). Root `package.json` workspace with
   `concurrently@10` scripts: `dev`, `dev:server`, `dev:web`, `test`, `lint`, `build`, `evaluate`.
2. Install the **exact** dependency sets from `docs/02_TRD.md` §2. Both were verified to install
   together with zero peer conflicts on 17 Aug 2026. Run `npm ls --depth=0` in each and confirm
   clean.
3. `server/src/config/env.js` — validate every environment variable with Zod at boot. Print a
   readable table of set/missing. Exit non-zero if a required var is absent. **`JWT_SECRET` is
   required; there is no default.**
4. Split `app.js` (express app, no `listen`) from `index.js` (boot). Tests import `app.js`.
5. **Fix the boot crash.** Passport's Google strategy must register lazily, only when
   `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are both present. Verified failure today: a fresh
   clone throws `TypeError: OAuth2Strategy requires a clientID option` and dies. The server must
   boot fully without any Google config.
6. Add `helmet`, `express-rate-limit` on `/api/auth/*`, `pino-http` with redaction of
   `authorization`, `*.key`, `*.secret`, `*.token`, `*.password`.
7. `GET /api/health` → `{ status, uptime, mongo, llmProviders[] }`.
8. Unify `mongoUsers` + `googleUsers` into one `User` model with `authProviders[]`. Write a
   migration script; run it against a scratch DB first.
9. Vitest + supertest + mongodb-memory-server configured. One passing test per layer.
10. **Write the architecture guard test now, before the MCP layer exists:**
    ```js
    // server/tests/architecture.test.js
    // Agents must not perform I/O. They may only call MCP tools.
    // Fails if axios | fetch | http.request | https.request appears under server/src/agents/**
    ```
    This is what mechanically protects the project's core claim over 15 weeks of edits.
11. GitHub Actions: install → lint → typecheck → test on push and PR. Node 22.
12. Commit, push.

**Definition of done:** `npm install && npm run dev` works from a fresh clone with only
`MONGO_URI` and `JWT_SECRET` set · `/api/health` returns 200 · all tests green · CI green ·
architecture guard test present and passing.

---

# PHASE 4 — Egress guard (SSRF)

**Objective:** the server cannot be used as an SSRF proxy. Build this **before** any tool can make
a request.

Full specification in `docs/02_TRD.md` §7. Implement `server/src/mcp/egress.js`:

1. Scheme allow-list: `http`, `https`.
2. **Resolve DNS, then validate the resolved IP** — validating the hostname is not enough, since
   an attacker controls DNS.
3. Block: loopback, private (`10/8`, `172.16/12`, `192.168/16`, `fc00::/7`), **link-local
   (`169.254/16`, `fe80::/10`) — this is the cloud metadata range**, `0.0.0.0/8`, multicast,
   `.local`/`.internal`.
4. **Pin the resolved IP for the connection** to defeat DNS rebinding between check and fetch.
5. Max 3 redirects, re-validating every hop.
6. Timeout 10s, response cap 5MB, per-host rate limit 5 req/s.
7. `ALLOW_PRIVATE_TARGETS=true` escape hatch for local fixture testing — default off, refused when
   `NODE_ENV=production`.
8. Blocked attempts return a typed error and are recorded (audit wiring lands in Phase 5).

**Tests — write one per blocked range.** `127.0.0.1`, `10.0.0.1`, `192.168.1.1`, `169.254.169.254`,
`::1`, `fe80::1`, a hostname resolving to a private IP, and a redirect chain ending at
`169.254.169.254`.

**Definition of done:** all SSRF tests green · every outbound path in the codebase goes through
this module · committed and pushed.

> These tests are a slide in the final presentation and a paragraph in the report that no other
> student project will have. Make them good.

---

# PHASE 5 — The MCP layer ★ THE HEADLINE

**Objective:** make the project's central claim true. If you build nothing else after this, the
project is still defensible.

Full specification in `docs/02_TRD.md` §5.

**Tasks**
1. `server/src/mcp/registry.js` — `McpServer` from `@modelcontextprotocol/sdk@1.30.0`, plus a
   `defineTool()` helper that registers via `registerTool` (**not** the deprecated `tool`) and
   pushes to a `TOOLS` mirror used by the HTTP registry endpoint.
2. `permissions.js` — four risk classes: `local.compute` (auto), `network.read` (per host),
   `network.probe` (**explicit grant, per host, per session, never auto**), `deploy.write`
   (explicit + confirmation).
3. `audit.js` — writes `{ userId, runId, tool, riskClass, targetHost, inputHash, outcome,
   errorCode, durationMs, ts }` for **every** invocation including denials and SSRF blocks. Store
   a SHA-256 of canonicalised input, never raw payloads that might contain credentials. No update
   or delete path exists in the API — the collection is append-only.
4. `withGuards()` wrapper, in this exact order:
   `permission → audit(started) → schema validation → egress guard → handler → audit(outcome)`.
   The final audit write happens even when the handler throws.
5. Implement all nine tools in `server/src/mcp/tools/`, each with Zod input and output schemas:
   `http_request`, `run_test_case`, `probe_sqli`, `probe_xss`, `probe_auth`, `probe_cors`,
   `probe_headers`, `parse_openapi`, `deploy_service`.
   The `probe_*` tools may be stubs returning `{ notImplemented: true }` in this phase — Phase 8
   fills them in. The registry, schemas, permissions and audit must be complete and real now.
6. `GET /api/mcp/tools` — live registry with JSON Schemas **generated from the Zod definitions**.
   Never hand-write the schemas; they will drift.
7. `GET /api/mcp/audit` — filterable by run, tool, outcome.
8. `POST /api/mcp/grants` — grant a risk class for a host.
9. Streamable-HTTP transport at `/api/mcp` behind auth, plus a stdio entrypoint at
   `server/src/mcp/stdio.js` so external MCP clients can drive AgentIQ's tools.
10. Tests: schema rejection before I/O · permission denial writes a `denied` audit row · audit
    count equals tool-call count · registry endpoint returns all nine with valid JSON Schema.

**Definition of done:** all nine tools registered · `/api/mcp/tools` returns generated schemas ·
an ungranted `network.probe` call is refused and audited · audit completeness test green · an
external MCP client can connect over stdio and list tools · pushed.

> **This is the phase that retires the biggest risk in the project.** Ship it before anything in
> Phases 6–14. If the semester goes wrong, this is what saves it.

---

# PHASE 6 — Evaluation fixtures

**Objective:** you cannot measure a security scanner without ground truth. Build the ground truth
now, because Phase 8 needs it.

Two small Express services in `fixtures/`, with **identical routes and response contracts**:

**`vulnerable-api`** — deliberately defective:
- SQL injection: string-concatenated query against a seeded SQLite DB, DB errors leaked in the body
- Reflected XSS: query parameter echoed unescaped into an HTML response
- Broken auth: a privileged route (`/admin/users`) with no auth check
- CORS: `Access-Control-Allow-Origin: *` **with** `Allow-Credentials: true`
- No security headers at all
- No rate limiting

**`hardened-api`** — same routes, same contracts, every defect fixed: parameterised queries,
escaped output, auth middleware, strict CORS, helmet, rate limiting.

Both start with `npm run fixtures`. Ship an OpenAPI 3.1 spec for both (Phase 9 needs it).

**Definition of done:** both run on fixed local ports · identical contracts verified by a shared
test suite · specs valid · documented in `fixtures/README.md`.

---

# PHASE 7 — Testing Agent v2

Specification: `docs/01_PRD.md` F2, `docs/02_TRD.md` §6.

1. `server/src/services/llm.js` — provider abstraction. Groq primary
   (`llama-3.1-8b-instant`), Gemini fallback. **Delete Pollinations entirely** — an
   unauthenticated third-party LLM proxy has no place in a security project. One interface:
   `generateJSON({ system, prompt, schema })`.
2. `server/src/agents/testing.agent.js` — **no I/O**; only MCP tool calls.
3. Full assertion set: `status`, `responseTimeUnder`, `jsonPathExists`, `jsonPathEquals`,
   `jsonPathType`, `headerPresent`, `headerEquals`, `bodyMatches`.
4. Deterministic assertion evaluator inside `run_test_case`. **The LLM proposes assertions; it
   never judges whether one passed.** For `bodyMatches`, cap pattern length, reject nested
   quantifiers, and time-box execution (ReDoS).
5. Keep the Sem 6 JSON-repair pipeline — it was good work — but **remove the
   `GET + expected 400 → 200` rewrite**, which inflated pass rates and cannot be defended.
6. One bounded repair retry on invalid JSON, then fail visibly. **No hardcoded fallback test
   cases, ever.**
7. Report `discarded` count in the run summary rather than hiding malformed cases.
8. Run lifecycle per the state machine in `docs/03_App_Flow.md` B7. `explanationUsed` is **run-scoped,
   never a module-level global** — the Sem 6 bug made explanations fire once per server process.
9. Tests against both fixtures.

**Definition of done:** ≥ 95% structural validity over 50 generations (mocked LLM in CI, real once
manually) · per-assertion results · generation failure surfaces as an error · architecture guard
still green · pushed.

---

# PHASE 8 — Security Agent rebuild

Specification: `docs/01_PRD.md` F3. **Rewrite, do not patch.** The Sem 6 version sends no payload
at all when driven from the UI, because it iterates over an empty body object.

1. Six probe families, each mapped to OWASP API Security Top 10 (2023): SQLi, reflected XSS, broken
   auth, CORS misconfiguration, missing security headers, missing rate limiting.
2. **Baseline differential** — every probe first sends a benign request and records status, length,
   content-type and a timing band. A finding requires a *material deviation from baseline*, not an
   absolute condition. This is what kills the Sem 6 "any HTTP 500 = SQL injection" rule.
3. **`intendedPublic` flag** — when the user declares an endpoint is meant to be public, an
   anonymous 200 is correct behaviour and must not be reported. This kills the Sem 6 false
   positive that appears in the report's own Figure 3.7.
4. Real DB error fingerprints: MySQL, PostgreSQL, SQLite, MSSQL, Oracle, SQLSTATE, ODBC — and check
   JSON bodies, not only strings. Sem 6 checked `typeof res.data === "string"`, missing every JSON
   API.
5. Every finding carries: severity, OWASP category, exact payload, observed signal, baseline
   comparison, plain-English explanation, remediation sentence.
6. Safety: read-only, non-destructive, never `DELETE`, rate-limited, SSRF-guarded, explicit
   acknowledgement before first scan of a new host.
7. **Tests are the deliverable here:** every family detected on `vulnerable-api`; **zero findings**
   on `hardened-api`.

**Definition of done:** ≥ 5 of 6 families detected on the vulnerable fixture · **0 findings on the
hardened fixture** · every finding carries payload + signal + baseline · pushed.

---

# PHASE 9 — OpenAPI ingestion

Specification: `docs/01_PRD.md` F4.

1. `parse_openapi` tool using `@apidevtools/swagger-parser@12.1.0` — parse, dereference, validate.
2. Import by URL (through the egress guard) or file upload. `ApiSpec` model.
3. Operation extraction: method, path, parameters, request schema, response schemas, declared
   status codes, security schemes.
4. Spec-grounded prompt construction — assertions reference **declared** response fields.
5. Security schemes pre-populate auth config.
6. Parse errors name the offending path and line. Never a raw stack trace.
7. Test with the Petstore 3.1 spec, one large public spec, and both fixture specs.

**Definition of done:** real specs parse · grounded generation references declared fields ·
malformed spec produces a helpful error · pushed.

---

# PHASE 10 — Frontend foundation

Specification: `docs/04_App_UI.md`. **Scaffold fresh; port components. Do not migrate incrementally.**
The Sem 6 frontend is React 18 / Vite 5 / Tailwind 3 / Zod 3 / Router 6 / Recharts 2 — every one a
major version behind.

1. Fresh Vite 8 + React 19 + TypeScript app in `web/`.
2. **Tailwind v4 — CSS-first.** `@tailwindcss/vite` plugin, `@import "tailwindcss"` in
   `index.css`, tokens in `@theme`. **No `tailwind.config.js`. No `postcss.config.js`. No
   `@tailwind base/components/utilities`.** Read `docs/02_TRD.md` §3 before writing any CSS.
3. Paste the token block from `docs/04_App_UI.md` §2 verbatim into `index.css`.
4. Self-host Inter and JetBrains Mono via `@fontsource` — no CDN dependency during a viva.
5. Build the shell: sidebar with WORK and TRUST groups, topbar, page container. **No decorative
   status badges** — the Sem 6 topbar shipped "MCP Powered", "Simulation Mode" and "Agents Online"
   as static chips asserting things the system did not do.
6. Component library per `docs/04_App_UI.md` §6: Button, Card, KpiCard, Input, Select, Textarea,
   Chip, Table, CodeBlock, AssertionRow, FindingCard, PermissionSheet, ProgressList, EmptyState,
   Toast, Skeleton, Modal.
7. `web/src/services/api.ts` — **read `import.meta.env.VITE_API_URL`.** Sem 6 declared the variable
   and then hardcoded `http://localhost:3001`, which is why it was not deployable.
8. TanStack Query for server state, Zustand for auth. Router 7 with `createBrowserRouter`.
9. Delete every `MOCK_*` constant. There must be no mock data in the tree when this phase ends.

**Definition of done:** shell renders · every component in a `/dev/components` gallery route ·
zero mock constants · builds clean with no type errors · Lighthouse accessibility ≥ 95 · pushed.

---

# PHASE 11 — Screens

Build every screen in `docs/03_App_Flow.md` A1, to the specs in `docs/04_App_UI.md` §7.

Order: Login/Signup → Test Runner → Run detail → Security → **Tool Registry → Audit Log** →
Specs → History → API Client → Dashboard → Settings → About → Landing.

**Every screen ships four states: empty, loading, error, populated.** The table in
`docs/03_App_Flow.md` Part C is the checklist. Skeletons, never full-page spinners.

Non-negotiables:
- The **permission sheet** appears before any packet leaves the server, with `network.probe`
  unchecked by default. This is where the architecture becomes visible to a human.
- The **progress list** streams real per-step state with real elapsed time.
- **Assertion rows** show expected vs actual per assertion, never per case.
- **Finding cards** show payload, signal and baseline. A finding without evidence is not a finding.
- **Tool Registry** fetches live from `/api/mcp/tools` with the header note that nothing on the page
  is hardcoded.
- **Audit Log** renders `denied` and `blocked_ssrf` rows with a danger left rule.
- The **clean security result** is a designed green panel with the honest sentence *"This is not a
  guarantee of security — see About for coverage"*, not an empty list.

**Definition of done:** every route implemented, all four states each, keyboard navigable, no mock
data, pushed.

---

# PHASE 12 — Real dashboard

1. `GET /api/runs/stats` — Mongo aggregation pipelines for total runs, tests executed, pass rate,
   findings by severity, median latency, 14-day pass/fail series.
2. Wire the KPI cards, bar chart and donut to it. Recharts 3 — verify each chart visually; v2 props
   changed.
3. New account renders honest zeros and a "Run your first test" call to action.
4. Delete `MOCK_PULSE_DATA`, `MOCK_AGENTS`, `logRows`, the hardcoded `statCards` array, and every
   remaining literal metric.

**Definition of done:** every number on the dashboard traces to a query you can show an examiner ·
a fresh account shows zeros, not a populated chart · pushed.

---

# PHASE 13 — Deployment Agent

Specification: `docs/01_PRD.md` F5.

1. Render API integration behind the `deploy_service` tool, `deploy.write` risk class.
2. Encrypted key storage. Never logged, never returned to the client.
3. Pre-flight checks: repo reachable, branch exists, build command detected, env vars declared.
4. Trigger, poll, capture the live URL.
5. **On success, automatically re-run the Testing and Security agents against the live URL** and
   attach both runs to the `Deployment` record. This self-verification is the entire point; a
   deploy button on its own is not a contribution.

**If this cannot land by mid-November: cut it.** Make `/deploy` state plainly that it is scoped out
of Sem 7, link to About, and record the decision in `PROGRESS.md` and the report. **Do not ship a
third mock.** A well-argued scoped-out feature costs nothing; a fake one costs credibility.

**Definition of done:** one real end-to-end deployment with post-deploy verification stored and
visible — **or** an honest scoped-out notice and a written justification.

---

# PHASE 14 — Evaluation harness ★ THIS IS CHAPTER 4

Specification: `docs/01_PRD.md` F10. The Sem 6 evaluation was five GETs against jsonplaceholder
with a near-tautological pass rate. Replace it with a real measurement.

1. `npm run evaluate` runs the whole suite headlessly and writes `docs/90_EVALUATION.md`.
2. **Security metrics:** true positives on `vulnerable-api`, false positives on `hardened-api`.
   Precision and recall per probe family.
3. **Test adequacy:** seed `hardened-api` with N deliberate behavioural mutations (wrong status
   code, missing field, off-by-one boundary, wrong content type). Measure the fraction of mutations
   the generated suite kills. This is the mutation-score methodology from RESTestBench
   (arXiv 2604.25862) — **cite it**, and adapt it rather than claiming to have invented it.
4. **Grounding ablation:** same measurement, spec grounding on vs off. This is your strongest
   result — the same generator, measured two ways, on the same benchmark.
5. **Cost and latency:** tokens and wall-clock per run.
6. Deterministic seeding so numbers are reproducible.

**Definition of done:** `npm run evaluate` produces a reproducible table · results committed ·
**whatever the numbers are, report them honestly.** A measured 61% is a far stronger result than an
unmeasured claim of success, and an examiner will trust everything else in the report more because
of it.

---

# PHASE 15 — Hardening and deployment

1. Full test pass, coverage ≥ 70% on `server/src/mcp/**` and `server/src/agents/**`.
2. Architecture guard still green — no I/O has crept into any agent.
3. `npm audit` clean of high/critical.
4. Deploy: server → Render, web → Render static or Vercel, DB → Atlas M0. All free tier.
5. Real production env vars. CORS locked to the deployed origin. OAuth redirect URIs updated.
6. `/api/health` warm ping to mitigate cold starts.
7. Rewrite `README.md`: what it is, a screenshot of a real run, 5-minute quickstart a stranger can
   follow, architecture diagram, API reference, evaluation summary, **known limitations**, licence.
8. **Verify the whole thing from a fresh clone on a clean machine.** This is the acceptance test
   for the entire semester.

**Definition of done:** live URL reachable · fresh clone to running in ≤ 5 minutes with zero code
edits · CI green · pushed.

---

# PHASE 16 — Report and viva pack

1. `docs/90_EVALUATION.md` finalised with real numbers.
2. Architecture diagrams regenerated to match the **built** system, not the Sem 6 drawings.
3. Screenshot set: run detail with a failing assertion expanded, a security finding with payload and
   baseline, the Tool Registry with a live schema, the Audit Log showing a `blocked_ssrf` row, the
   clean-scan panel, the dashboard with real data.
4. Seed the demo account: several runs including at least one failure, one `denied` audit row and
   one `blocked_ssrf` row.
5. **Rehearse the ten-minute demo script in `docs/03_App_Flow.md` Part E.** On a projector.
6. Write `docs/91_VIVA_PREP.md`: for each major component — what it does, why it is built that way,
   what the alternatives were, what its limitations are. Cover at minimum: why MCP rather than
   direct function calls, how false positives are controlled, why the LLM never judges assertions,
   how SSRF is prevented, and what the evaluation numbers do and do not show.
7. Write `docs/92_SCOPE_CHANGES.md`: what was scoped out of Sem 7 and the reasoning. Frame as
   engineering judgement, which is what it is.

**Definition of done:** all artefacts committed · demo rehearsed end to end · viva prep written.

---

## Priority if time runs short

Adarsh is effectively solo and has placements. Ship in this order and stop wherever you must:

| | Phases | Outcome if you stop here |
|---|---|---|
| **Must** | 0–5 | The core claim is true. Defensible project. |
| **Must** | 6–8 | Security agent actually works and is measured. Good project. |
| **Should** | 9–12 | Complete, professional, demonstrable. Strong project. |
| **Nice** | 13–14 | Deployment + real evaluation. Excellent project. |
| **Always** | 15–16 | Never skip. A great build that cannot be run or explained scores badly. |

**Phases 15 and 16 are not optional even if you cut everything else.** A working, explainable,
clone-and-run system with fewer features beats a feature-complete one that crashes on the
examiner's laptop.

---

## Begin

Start at **Phase 0**. Read the five documents. Report your findings and your questions. Write no
code until Phase 0 is done and Adarsh has answered anything you are blocked on.
