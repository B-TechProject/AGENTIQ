# 00 — Ground truth: what actually exists

### Sem 6 audit, conducted 17 Aug 2026

**Repo:** `github.com/B-TechProject/AGENTIQ` (renamed from `Autonomous-ASD`)
**Author:** Adarsh Dwivedi (23UCS509), Aditya Gupta (23UCS513), Hiitesh Gour (23UCS590) · LNMIIT CSE

> **Read this before anything else.** The Sem 6 report, the repository README, and the original
> proposal all describe systems that are **not in the codebase**. Where they disagree with this
> document, this document is correct — every claim below was verified by reading the source,
> cloning the repo, and running the code.
>
> This is an internal engineering document. The outward framing for Sem 7 is *refinement and
> hardening*, and that framing is honest: the Sem 6 report described an architecture, and Sem 7
> implements it. Nothing here needs to be shown to anyone.

---

## 1. Repo inventory

| Location | What it is | Status |
|---|---|---|
| `B-TechProject/AGENTIQ` | The only real repo. 7 commits. Branches: `main`, `feature-backend-service`, `copilot/research-project-architecture-analysis` (identical to main) | Canonical |
| `B-TechProject/BTP` | **Empty repo.** No commits. | Ignore |
| local `BTP/` | Clone of AGENTIQ @ main. Every "modification" is CRLF→LF noise (1,689 insertions / 1,689 deletions — exactly equal, the signature of line-ending churn) | Same as origin → promote to working copy |
| local `BTP2/` | **Divergent variant.** Uses `@google/generative-ai` (Gemini SDK) instead of Groq + axios. Has `frontend/src/store/themeStore.ts` which main lacks. Unpushed. | Salvage, then archive |
| local `agentiq/` | Frontend-only copy. Contains a literal `{src` directory from a broken Windows brace-expansion. | Junk → archive |
| local `Autonomous-ASD/` | Separate **Electron** prototype (`agentic-api-frontend`), pure mock data in `src/data/sampleData.js`. The original "First commit with Tentative frontend". | Dead end → archive |
| local `backend/` | Loose duplicate of the backend. | Junk → archive |

**Total real source: ~5,000 LOC** — backend ~1,300, frontend ~3,700.

---

## 2. Claim vs. reality

| Report / proposal claim | Code reality |
|---|---|
| Testing Agent | **Real.** One LLM call → JSON normalisation → axios runner → status-code assertion. |
| Security Agent, OWASP-informed | **Broken when driven from the UI.** See BUG-1, BUG-2. |
| Deployment Agent (`deploy.service.js`, Fig 3.1) | **File does not exist.** No `/api/deploy` route. `apiService.deploy()` POSTs to a 404. The frontend is a mock form with a "Coming Soon" badge. |
| **MCP as communication backbone** (§3.2.5; proposal §4.1: *"a core architectural component, not a future enhancement"*) | **Does not exist.** No SDK dependency, no tool registry, no schema validation, no permission check, no audit log. The only occurrence of "MCP" in the entire codebase is `Topbar.tsx:38` → `<Badge variant="teal" dot>MCP Powered</Badge>` |
| RAG (abstract, §1.2) | **Does not exist.** No retrieval, embeddings, or vector store. |
| ReAct-style agents (§2.2) | **Does not exist.** No planning loop, no tool-calling, no observation step. |
| Dashboard | **Hardcoded literals.** `DashboardPage.tsx:14-26` — `'2,847'`, `'14'`, `'98'`, `'142ms'`, plus `MOCK_PULSE_DATA`, `MOCK_AGENTS`, `logRows`. The topbar ships a `Simulation Mode` badge. |
| Frontend hosted on AWS S3 (§3.4) | **Not deployable.** `api.ts:5` hardcodes `http://localhost:3001/api`. `VITE_API_URL` is declared in `vite-env.d.ts` and never read. CORS origin and the OAuth callback are hardcoded to localhost. |
| JWT + Google OAuth dual auth | **Real and working.** The strongest part of the codebase. |
| Mongo persistence + run history | **Real and wired to the UI.** |

**Honest completion: ~25–30% of the proposal.** That is a normal first-semester outcome. The
Sem 7 job is to close the gap, not to relitigate it.

---

## 3. Bugs, ranked

**BUG-1 · The security scan sends zero attack payloads when driven from the UI.**
`SecurityPage.tsx:23` calls `apiService.securityScan({ url })` — no `method`, no `body`. In
`security.service.js`, `testSQLi` and `testXSS` do `const modifiedBody = { ...config.body }` then
`for (let key in modifiedBody)`. With `config.body === undefined` that object is `{}`, so the loop
runs **zero times** and the payload is never inserted. Three plain GET requests are sent instead.

*Self-evidencing:* report Figure 3.7 shows SQLi `false`, XSS `false`, Auth `true` when scanning
`jsonplaceholder.typicode.com/posts` — the exact signature of this bug. Table 4.2's results must
therefore have been produced by hand-crafted requests, not by the product.

**BUG-2 · `testAuth` flags every public endpoint as vulnerable.**
Any 200 response without credentials returns `"Accessible without authentication"`. This makes
§4.3's claim of *"no false positives on well-built endpoints"* impossible to defend for any public
API — and Figure 3.7 shows it firing.

**BUG-3 · A live JWT secret is committed to a public repository.**
`server.js:117` → `process.env.JWT_SECRET || '<32-char literal>'`. (Value redacted here in Sem 7;
it remains in git history at `b5c0bdd`, which is why it had to be rotated rather than merely deleted.)
Anyone can forge tokens against any deployment where the env var is unset. **Rotate it and delete
the fallback before anything else.**

**BUG-4 · A fresh clone cannot boot.**
`passport.use(new GoogleStrategy(...))` runs at module top level (`server.js:59`). Verified on a
clean install: `TypeError: OAuth2Strategy requires a clientID option`, process exits. An examiner
who clones the repo hits this within thirty seconds.

**BUG-5 · The AI explanation fires once per *process*, not per run.**
`testRunner.service.js:6` — `let explanationUsed = false` is module-scoped, set to `true`, and never
reset. Report §3.2.4 claims once-per-run behaviour.

**BUG-6 · Pass rates are inflated by normalisation.**
`ai.service.js` rewrites `GET + expected 400` → `expected 200`. Combined with status-code-only
assertions against live public GET endpoints, Table 4.1's "100% first-time pass" is close to
tautological.

**BUG-7 · SQLi detection is far weaker than described.**
The code checks `typeof res.data === "string" && res.data.toLowerCase().includes("sql")`, which
misses every JSON API. §3.2.3 claims MySQL / PostgreSQL / SQLSTATE / ODBC fingerprinting. It also
treats *any* HTTP 500 as SQL injection (a large false-positive source), and `return`s on the first
payload so the second one documented in the report never runs.

**Hygiene:** `node_modules` committed (2,412 files, 12 native binaries including Windows `.exe`) ·
CRLF line endings throughout — *this is the actual cause of "it won't run on Mac"*, not anything
mysterious · unused native `bcrypt` dependency (only `bcryptjs` is imported) · `ai.service.js:9`
console-logs an API key prefix on every call · dead `hooks/useAI.ts` calls Anthropic's API from the
browser with no key and prompts the model to *simulate* results.

**Internal contradictions in the report:** §4.1 says Pollinations is primary and Groq the fallback;
§3.2.1, the abstract, and the code all say the opposite. `ai.service.js` demands "EXACTLY 4 test
cases" in its prompt while its own system message demands "exactly 3".

---

## 4. Sem 7 decisions — locked 17 Aug 2026

- **Direction:** build it for real. The Sem 6 claims become the Sem 7 specification. The final
  report must be honest *and* the claims must be true.
- **Supervisor context:** Dr. Rukhsar Sultana believes the Sem 6 system is fully built. Every
  document frames Sem 7 as refinement and hardening — which is accurate, since Sem 6 described the
  architecture and Sem 7 implements it.
- **Capacity:** Adarsh is effectively solo, teammates inactive, placements are the priority.
  Implementation runs through Claude Code end-to-end; Adarsh runs, verifies, and demos.

**Scope:** see [01_PRD.md](01_PRD.md) §6 for the feature set and §4 for the binding non-goals.
**Build order:** see [MASTER_PROMPT.md](../MASTER_PROMPT.md).

### Cost ceiling: ₹0/month
Groq free tier (30 RPM / 6K TPM / 14.4K RPD on `llama-3.1-8b-instant`) · MongoDB Atlas M0 ·
Render free tier. The only real spend is an evaluation sweep on a small model, in single-digit
dollars. **Drop Pollinations entirely** — an unauthenticated third-party LLM proxy has no place in
a security project.

### Prior work — for Chapter 2 and for framing novelty
- **RESTestBench** (arXiv 2604.25862) — a benchmark for LLM-generated REST API test cases from
  natural-language requirements. 3 services, 106 human-validated requirements, 228
  requirement-linked mutations, 10 models. Mutation scores 13–92% on precise requirements, dropping
  26–40 points on vague ones. GPT-5 Nano reached 70% at $0.41/run against Sonnet 4.5's 65% at
  $10.13. **Adapt this methodology for Chapter 4 and cite it.**
- **Multi-Agent LLM-based Metamorphic Testing for REST APIs** (arXiv 2605.28321)
- **LlamaRestTest** (IBM Research) — small language models for REST API testing

---

## 5. The standing risk

The Sem 6 report describes MCP, RAG, and a Deployment Agent as implemented. An examiner who greps
the repository for "MCP" finds a decorative UI badge and nothing else.

**Until Phase 5 of the master prompt lands, this is the single largest threat to the grade.**
Everything else in the build order is negotiable. That is not.
