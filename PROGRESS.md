# PROGRESS

Running record of the Sem 7 build. Append one section per phase. Records what was built, what was
decided, what deviated from the docs and why, and **what is not done**.

Build order and phase definitions: [MASTER_PROMPT.md](MASTER_PROMPT.md).

---

## Phase 0 — Orient · 17 Aug 2026 · ✅ complete

Read-only audit. No files created, moved or deleted.

### Verified state

**Toolchain**

| Tool | Required | Found | Status |
|---|---|---|---|
| Node | 22.x LTS (≥ 22.12.0) | v25.6.1 | ⚠️ mismatch — unresolved, see Open Questions |
| npm | ≥ 10 | 11.9.0 | ✅ |
| git | — | 2.53.0 | ✅ |
| nvm / fnm / volta | — | none | ⚠️ no way to switch Node |
| gh | — | not installed | ⚠️ blocks push auth when we get there |

**Folder inventory** — five copies of the project existed at the working-folder root.

| Folder | Git | HEAD | Size | Unique work | Disposition |
|---|---|---|---|---|---|
| `agentiq/` | no | — | 186M | none | archived |
| `Autonomous-ASD/` | yes | `543f96c` (1 commit) | 664K | none | archived |
| `backend/` | no | — | 25M | none | archived |
| `BTP/` | yes | `9f6a72e` (7 commits) | 265M | == origin/main | **promoted to working copy** |
| `BTP2/` | yes | `9f6a72e` (7 commits) | 277M | uncommitted only | archived |

Each "none unique" verdict was proven, not assumed:

- `agentiq/` is byte-identical to `BTP/frontend/` under `diff -w --strip-trailing-cr`, except the
  `package.json` `name` field and `LandingPage.tsx` — where `agentiq` holds the **older** copy
  (`'AI Failure Analysis'` / `'GPT-4o'`; BTP has `'Test Runner Agent'` / `'Groq'`). It also carried a
  literal `{src` directory from a broken Windows brace-expansion, containing only `.DS_Store` files.
- `Autonomous-ASD/` HEAD `543f96c821388c18494d919cdfbdfe9ca625d675` **is the root commit of AGENTIQ
  `main`**. Its entire tree is preserved in canonical history.
- `backend/` differs from `BTP/backend/` in exactly one line: `"dev": "nodemon src/server.js"` vs
  `"node src/server.js"`.

**Branch inventory** — `github.com/B-TechProject/AGENTIQ`, 7 commits, Mar–Apr 2026.

| Branch | Tip | Finding |
|---|---|---|
| `main` | `9f6a72e` | canonical |
| `copilot/research-project-architecture-analysis` | `9f6a72e` | **same commit object as main** — safe to delete |
| `feature-backend-service` | `b5c0bdd` | ancestor of main (merged via `912eda5`, PR #1) — safe to delete |

**Line endings** — `BTP` vs `origin/main` is 33 files, **1,689 insertions / 1,689 deletions**
(exactly equal — the CRLF signature). Under `--ignore-all-space` the whole diff collapses to **two
lines** in `LandingPage.tsx`. Confirms the audit's diagnosis of "won't run on Mac". No
`.gitattributes` and no `.nvmrc` existed anywhere in the tree.

**`BTP2` divergence** — identical HEAD to `BTP`; 100% uncommitted working tree. Under
`--ignore-all-space` every backend file drops out (also pure CRLF churn). Genuinely different:
`frontend/src/store/themeStore.ts` (new, 676 B) · `index.css` +118/−29 dark+light CSS custom
properties · `Topbar.tsx` sun/moon toggle · 10 pages mechanically re-pointed at theme variables ·
`ai.service.js` + `aiExplain.service.js` rewired onto the `@google/generative-ai` SDK
(`gemini-2.5-flash`, `responseMimeType: "application/json"`) · `.claude/settings.local.json` with
paths under `/Users/adityagupta`, identifying this as Aditya's machine.

> **Correction to `docs/00_SEM6_AUDIT.md`:** it states BTP2 "uses `@google/generative-ai` instead of
> Groq + axios". `@google/generative-ai@^0.24.1` is a declared dependency in **all three**
> `package.json` files including `origin/main`'s. The real divergence is narrower — BTP2 actually
> *imports and uses* the SDK, where main declares the dep but calls Groq via axios and reaches Gemini
> through a raw REST URL. `frontend/package.json` is byte-identical between BTP and BTP2, so the
> theme work introduced no new dependency.

**Secrets** — full-history scan across all branches and all commits.

- 🔴 **Public:** `JWT_SECRET` literal (32 chars) at `backend/src/server.js:116`, introduced in
  `b5c0bdd`, re-added in `477c822`, live at HEAD. The only real secret that ever reached GitHub.
- 🟢 **Clean:** zero matches for `AIza…`, `gsk_…`, `sk-…`, `GOCSPX-…`, or any real `mongodb+srv://`
  credential in any commit on any branch. `.env` was **never committed**
  (`--diff-filter=A` over all history: no hits). The `mongodb://` strings present are library test
  fixtures inside `node_modules`.
- 🟡 **Local disk only, untracked, three identical copies** (`backend/.env`, `BTP/backend/.env`,
  `BTP2/backend/.env`): `MONGO_URI`, `MONGO_PASSWORD`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `NEW_GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `JWT_SECRET`, `GROQ_API_KEY`. `.gitignore` covered them,
  which is why they never leaked.

**Audit bug claims** — all seven confirmed by reading source. `BUG-1` `security.service.js:22,25` ·
`BUG-2` `testAuth` · `BUG-3` `server.js:116` · `BUG-4` `server.js:58` top-level `GoogleStrategy` ·
`BUG-5` `testRunner.service.js:5` module-scoped `explanationUsed` · `BUG-6` `ai.service.js:191` ·
`BUG-7` `security.service.js:37,48`. Hygiene claims also confirmed: `api.ts:5` hardcodes
`http://localhost:3001/api` while `VITE_API_URL` is declared and never read · **2,412 of 2,504
tracked files are `node_modules`** (92 real source files) · `Topbar.tsx:38-40` ships all three
decorative badges · Pollinations at `ai.service.js:97`.

**Two findings worse than the audit records:**

1. `ai.service.js:221` — a comment reading `// 🛑 SAFE FALLBACK` above three hardcoded cases named
   `"Fallback Valid Request"`, `"Fallback Invalid Request"`, `"Fallback Edge Case"`. The exact
   pattern the master prompt forbids, labelled in the source.
2. `frontend/src/hooks/useAI.ts:3` posts to `https://api.anthropic.com/v1/messages` **from the
   browser**, with prompts beginning `"Simulate realistic API test results for: …"` and
   `"Simulate a realistic security scan for API: …"`. Dead code, but the single most damaging file in
   the repo if an examiner greps for `simulate`. **Must not survive the Phase 3 restructure.**

---

## Phase 1 — Salvage and organise · 17 Aug 2026 · ✅ complete

### What was done

1. **Created `_archive/`** and moved `agentiq/`, `Autonomous-ASD/`, `backend/`, `BTP2/` into it
   **unmodified**. Nothing deleted. Both archived git repos verified still readable at their original
   HEADs (`543f96c`, `9f6a72e`).
2. **Promoted `BTP/` to the working copy.** Moved `.git`, `.gitignore`, `README.md`, `backend/`,
   `frontend/`, `node_modules/`, `package.json`, `package-lock.json` to the repo root, then removed
   the empty `BTP/` shell.
   - `BTP/docs/` was **empty** and was deliberately not moved — the root `docs/` holds the five real
     specification documents, and letting an empty directory collide with them was the one
     destructive move available here.
3. **Salvage from `_archive/BTP2/`: nothing carried over.** Reasoning below.
4. **Deleted all 11 `.DS_Store` files.** None were tracked. `.gitignore` already covered `.DS_Store`;
   added `**/.DS_Store` for nested cases.
5. **Verified** `docs/` (all five files) and `MASTER_PROMPT.md` survived at the root.

### Verification

- Root HEAD is `9f6a72e8c47a6fa58c88f493309ef29ea7bb2d75` — **exact match** to `origin/main`.
- 7 commits, remote intact, branch `main`. The Sem 6 evidence trail is untouched.
- Exactly one `.git` directory in the tree.
- Zero `.DS_Store` files.
- Working-tree diff unchanged by the move: still the same CRLF churn, still exactly two real lines in
  `LandingPage.tsx` under `--ignore-all-space`.
- 14 tracked files report missing on disk: all Windows `.cmd`/`.ps1` shims under
  `backend/node_modules/.bin/`. They were never on this Mac. **Phase 2 untracks `node_modules`
  entirely, which resolves all 14** — nothing is lost.

### Decisions

**D1 · Discard the BTP2 theme system.** `frontend/src/store/themeStore.ts`, the `index.css` dark/light
custom-property layer, and the `Topbar.tsx` toggle are **not** salvaged.
*Why:* `docs/04_App_UI.md` §1 mandates *"Light only. No dark theme."* and §10 lists dark theme and
neon accents as explicitly forbidden. The code is also **Tailwind v3** syntax
(`@tailwind base/components/utilities`) against a Phase 10 scaffold that is Tailwind v4 CSS-first.
Carry-over value is zero. Preserved unmodified at `_archive/BTP2/frontend/src/store/themeStore.ts`
if this is ever revisited.

**D2 · Discard the BTP2 Gemini SDK rewrite, keep one idea.** `@google/generative-ai` is **not** in the
`docs/02_TRD.md` §2 dependency matrix, and Phase 7 specifies a single provider abstraction
(`generateJSON({ system, prompt, schema })`), not a second provider-shaped service. The BTP2 prompt
also carries the "EXACTLY 4 test cases" contradiction and the hardcoded-fallback pattern.
**One detail carries forward to Phase 7:** `generationConfig: { responseMimeType: "application/json" }`
is the correct Gemini JSON-mode knob and should be used in the Gemini adapter.

**D3 · Discard `_archive/BTP2/.claude/settings.local.json`.** Machine-local tool config from a
teammate's laptop. No project value.

### Deviations from the docs

**V1 · Pulled `_archive/` into `.gitignore` one phase early.** `MASTER_PROMPT.md` schedules the
`.gitignore` rewrite in Phase 2 task 5. Added the `_archive/` rule now because the archive is ~488 MB
and a single careless `git add -A` before Phase 2 would commit all of it. The full rewrite still
happens in Phase 2.

### Not done / carried forward

- **The three `.env` files still contain the leaked `JWT_SECRET`.** Rotation is Phase 2 task 1.
- **`git remote` still points at `https://github.com/B-TechProject/Autonomous-ASD.git`**, the
  pre-rename URL. It works only because GitHub redirects renamed repositories. Should be repointed to
  the canonical `AGENTIQ.git` in Phase 2 — relying on a redirect is fragile.
- Node is still v25.6.1, not the 22.x the dependency matrix was install-tested against.
- Nothing has been pushed. Adarsh instructed local-only work for now.

### Open questions blocking later work

| # | Question | Blocks |
|---|---|---|
| Q2 | Rotate the never-committed Groq / Gemini / Mongo / Google-OAuth credentials too? Which are still live? | Phase 2 `.env.example` → `.env` |
| Q3 | Install Node 22 LTS (`brew install fnm && fnm install 22`), or knowingly run on 25 and record the deviation? | Phase 3 |
| Q4 | Confirm deletion of the two redundant remote branches (both proven safe) | Phase 2 task 7 |
| Q5 | Push authentication — no `gh`, no verified credential helper for `B-TechProject` | first push |

Q1 (JWT rotation) answered 17 Aug 2026: rotate to the value Adarsh supplied; the *secret* must not be
pushed (the code fix must). Q6 (BTP2 salvage) resolved by D1–D3 above under the master prompt's
delegation to assess and record.

---

## Phase 2 — Repository hygiene · 17 Aug 2026 · ✅ complete

Nine commits, pushed to `origin/main`.

### Task 1 · Secrets

- **`JWT_SECRET` rotated.** The public literal was removed from `backend/src/server.js:116` and the
  new value written to `backend/.env` only — gitignored, never committed, never pushed.
  No fallback replaces it: `jwt.sign` now throws if the variable is unset, which is correct
  behaviour. Phase 3 upgrades this to a Zod boot-time check that fails fast with a readable message
  rather than at the first OAuth callback.
- The other two call sites (`auth.middleware.js:22`, `utils/token.js:4`) already read
  `process.env.JWT_SECRET` with no default — unchanged.
- **Doc redaction.** `MASTER_PROMPT.md` and `docs/00_SEM6_AUDIT.md` quoted the literal verbatim to
  describe BUG-3. Both redacted to `'<32-char literal>'`; Phase 2's definition of done requires no
  secret anywhere in the working tree.
- **History deliberately not rewritten.** The old value remains at `b5c0bdd` and is unreachable from
  HEAD. Rotation, not redaction, is what makes it harmless. The Sem 6 commit dates are the evidence
  trail for a two-semester BTP.
- Full-history scan re-run: no `AIza…`, `gsk_…`, `sk-…`, `GOCSPX-…` or credentialed
  `mongodb+srv://…` anywhere on any branch.

### Tasks 2–6 · Hygiene

| Task | Result |
|---|---|
| Untrack `node_modules` | 2,412 files removed from the index; **2,504 → 102 tracked files**. Only `backend/node_modules` was ever tracked; the root and `frontend/` copies never were. Files untouched on disk. |
| Line endings | `.gitattributes` (`* text=auto eol=lf`) + `git add --renormalize .` across 32 CRLF source files. Verified pure: `git diff --cached --ignore-all-space` reported only `.gitattributes`. |
| `.nvmrc` | `22`. fnm now supplies 22.23.2 (npm 10.9.8). |
| `.gitignore` | Rewritten and grouped. `.env`/`.env.*` ignored with an explicit `!.env.example` negation. |
| `.env.example` | Every variable from `docs/02_TRD.md` §12. All secret-bearing keys empty; only non-sensitive defaults pre-filled. |

### Task 7 · Remote

- **Remote URL repointed** from `Autonomous-ASD.git` (pre-rename, working only via GitHub's redirect)
  to the canonical `AGENTIQ.git`.
- **Both redundant branches deleted**, each re-verified against the live remote immediately before
  deletion: `copilot/research-project-architecture-analysis` was the *same commit object* as `main`;
  `feature-backend-service` was an ancestor with **0** commits not in `main`.
- `origin` now has exactly one branch.

### Verification — fresh clone from GitHub

| Check | Result |
|---|---|
| Clone size | 13 MB |
| Files checked out | 102 |
| `node_modules` directories | 0 |
| Files containing CR | 0 — pure LF |
| Branches | `origin/main` only |
| `.env.example` present / `.env` absent | ✅ / ✅ |
| JWT fallback present | ✅ gone |
| Sem 6 root commit `543f96c` reachable | ✅ still an ancestor of HEAD |

### Deviations

**V2 · Repointing the remote URL was not a listed Phase 2 task.** Added because the remote still used
the pre-rename `Autonomous-ASD.git` URL and worked only through a GitHub redirect — fragile, and it
would break if the redirect is ever dropped.

**V3 · Redacting the secret from two docs was not a listed task.** Required by Phase 2's own
definition of done ("no secret anywhere in the working tree").

**V4 · Set a repo-local git identity.** `user.email` was `adarshdwivedi256@gmail.com` globally while
all 7 existing commits use `23ucs509@lnmiit.ac.in`. Set repo-locally to match so the BTP commit trail
shows one contributor. Global config untouched.

**V5 · Added fnm shell integration to `~/.zshrc`.** `fnm install 22 && fnm use 22` had been run, but
without `eval "$(fnm env --use-on-cd --shell zsh)"` in the profile every new shell still resolved
Homebrew's Node 25.6.1. One line appended; `node -v` now reports v22.23.2 in a fresh shell. This is
the only change made outside the repository.

### Not done / carried forward

- **The boot crash (BUG-4) is still present.** `passport.use(new GoogleStrategy(…))` still runs at
  `server.js:58` module top level. A fresh clone still cannot boot without Google credentials. This
  is Phase 3 task 5, by design — Phase 2 is hygiene only.
- **`node_modules` blobs remain in git history.** Deliberate: purging them means a history rewrite.
  A fresh clone is 13 MB, which is acceptable.
- **`api.ts:5` still hardcodes `http://localhost:3001/api`**, and `server.js:63,122` still hardcode
  localhost callback/redirect URLs. Phase 3 / Phase 10.
- **`frontend/src/hooks/useAI.ts` still calls Anthropic's API from the browser** with "Simulate…"
  prompts. Dead code; must not survive the Phase 3 restructure.
- Dependencies are still the Sem 6 versions, not the `docs/02_TRD.md` §2 matrix. Phase 3.

### Open questions

| # | Question | Blocks |
|---|---|---|
| Q2 | Rotate the never-committed Groq / Gemini / Mongo / Google-OAuth credentials too? Which are still live? | populating `.env` fully |

Q3 (Node 22) ✅ resolved — fnm 22.23.2 active.
Q4 (branch deletion) ✅ resolved — both deleted.
Q5 (push access) ✅ resolved — `credential.helper=osxkeychain` with a stored GitHub credential; push
works. Code is pushed at phase boundaries; secret *values* never are.

---

## Housekeeping — naming and archive isolation · 17 Aug 2026

Triggered by the IDE displaying the workspace as `Autonomous-ASD` after Phase 2.

### Cause

Two things, neither of them the working folder (which was always `AgenticIQ`):

1. **Stale IDE cache.** The workspace name was resolved from the remote URL at session start, ~20
   minutes before the Phase 2 repoint to `AGENTIQ.git`. Fixed by reloading the IDE window.
2. **Two live nested git repos inside `_archive/`** — `_archive/Autonomous-ASD/` and `_archive/BTP2/`
   both still had `origin = Autonomous-ASD.git`. Beyond the cosmetic label this was a real hazard: a
   `git push` run from inside either directory would have targeted the old repository.

### Action

**Archived repos neutralised.** `_archive/Autonomous-ASD/.git` and `_archive/BTP2/.git` renamed to
`.git.disabled`. Nothing deleted; fully reversible with
`mv _archive/BTP2/.git.disabled _archive/BTP2/.git`. Verified: zero live `.git` directories remain
under `_archive/`, and git commands run inside those folders now resolve to the parent repo.

**Canonical name decided: `AGENTIQ`** (Adarsh, 17 Aug 2026). The project had been spelled four ways —
`AgentIQ` in the docs, `AGENTIQ` on GitHub, `AgenticIQ` as the local folder, `agentiq-workspace` in
`package.json`.

| Target | Change |
|---|---|
| `package.json` names | `backend` → `agentiq-backend`, `frontend` → `agentiq-frontend`; description on root. `private: true` added to backend, which lacked it. |
| Local folder | `AgenticIQ` → `AGENTIQ` |
| GitHub repo | already `AGENTIQ` — no change needed |
| Spec-doc prose | **unchanged** — the docs say "AgentIQ" as the product name in prose, which reads naturally. Only identifiers were aligned. |

> **npm constraint:** package `name` fields cannot contain uppercase letters, so they use the
> lowercase `agentiq-*` form. `AGENTIQ` is the display name and repository name only.

Phase 3 renames these directories to `server/` and `web/` per `docs/02_TRD.md` §4; the package names
move with them then.

---

## Phase 3 — Foundation · 17 Aug 2026 · ✅ complete

Five commits, pushed. **62 → 65 tests, all green. Lint, typecheck and CI pipeline all pass.**

### Structure (`docs/02_TRD.md` §4)

`backend/` → `server/`, `frontend/` → `web/`, preserved as git renames (76 detected), so history
survives. New server layout:

```
server/src/index.js        boot only — validate env, connect, listen
server/src/app.js          express app, NO listen, so tests can import it
server/src/config/         env.js (Zod), passport.js (lazy registration)
server/src/lib/            db.js, logger.js
server/src/middleware/     auth.js, error.js, validateRequest.js
server/src/models/         User.js (unified)
server/src/utils/          http.js (response envelope), token.js
server/scripts/            migrate-users.js
server/tests/              5 suites
```

### Dependencies

**Every version in `docs/02_TRD.md` §2 resolved exactly as documented** — the matrix is real, not
aspirational. `npm ls --depth=0` exits 0 with no `ERESOLVE` and no peer warnings. The only correction
was mine: the TRD says `eslint@9` without a patch and I invented `9.42.0`, which does not exist;
latest 9.x is `9.39.5`.

Removed: native `bcrypt` (unused, per TRD), `@google/generative-ai` and `form-data` (never imported),
`express-session` (Google OAuth now uses `session: false` since a JWT is minted immediately).
Added beyond the TRD list: `@vitest/coverage-v8@4.1.10` (Phase 15 needs the coverage gate) and
`@eslint/js@9.39.5` (required by ESLint 9 flat config).

### Bugs closed

| | Fix | Proof |
|---|---|---|
| **BUG-4** boot crash | Passport Google strategy registers only when both credentials are present | `tests/boot.test.js` — the whole suite runs with Google deliberately unconfigured |
| **BUG-3** JWT secret | Required, 32-char minimum, no default; boot exits non-zero without it | `tests/env.test.js` |
| Hash leak | `registerUser` returned the whole mongoose document. `toJSON` now strips `passwordHash` | `tests/auth.test.js` asserts no `$2b$` anywhere in the response |
| JWT in logs | Two `console.log` calls printed raw tokens; removed, plus central pino redaction | verified on a live run — no JWT, hash or password in the log |
| Two user collections | `mongoUsers` + `googleUsers` → one `User` with `authProviders[]` | `tests/migration.test.js` |
| Inconsistent expiry | 3d in `token.js` vs 7d in `server.js` → 7d everywhere, HS256 pinned | `utils/token.js` |
| Email enumeration | Login returned distinguishable responses for unknown email vs wrong password | `tests/auth.test.js` asserts the two responses are byte-identical |
| Hardcoded callback | OAuth callback was pinned to `localhost:3001`; now from `API_BASE_URL` | `config/passport.js` |
| Cookie flags | `secure:true`/`sameSite:none` unconditionally, so cookies were dropped over plain http locally | `utils/token.js` |

### The architecture guard

`server/tests/architecture.test.js` fails the build if `axios`, `fetch`, `http.request`, `node:net`,
`child_process` or any HTTP client library appears under `server/src/agents/**`. Written now, before
`agents/` has content, exactly as `docs/02_TRD.md` §11 instructs. It passes vacuously today and
becomes load-bearing in Phases 7–8. Two companion tests prove the patterns actually match real
violations and correctly ignore mentions inside comments — **a guard that can never fail is not a
guard.**

### Definition of done — verified from a fresh clone

Cloned from GitHub into a scratch directory, `npm install`, then a `.env` containing **only**
`MONGO_URI` and `JWT_SECRET`:

| Check | Result |
|---|---|
| `npm install` from fresh clone | ✅ 721 packages, 4s |
| Boot with **no** `.env` at all | ✅ prints the table, names the 2 missing vars, exits 1 |
| Boot with only the 2 required vars | ✅ connects and listens |
| `GET /api/health` | ✅ **200**, `mongo: connected`, providers reported as unconfigured |
| `POST /api/auth/register` | ✅ 201, no hash in the response |
| `POST /api/auth/login` correct / wrong | ✅ 200 / 401 |
| `GET /api/auth/me` with / without token | ✅ 200 / 401 |
| `GET /api/auth/google` unconfigured | ✅ **503 with an explanation, not a crash** |
| Secrets in the server log | ✅ none |
| `npm run lint` / `typecheck` / `test` | ✅ all pass |
| `npm ci` from the lockfile | ✅ clean |

### Deviations

**V6 · `web/` keeps its Sem 6 dependencies for now.** Phase 3 task 2 says to install both dependency
sets, but Phase 10 says *"Scaffold fresh; port components. Do not migrate incrementally"* and the web
tree is React 18 / Vite 5 / Tailwind v3. Installing React 19 / Vite 8 / Tailwind v4 into a v3-configured
app would leave the repo broken for seven phases and the work would be thrown away at Phase 10.
`web/` was renamed and wired into the workspace; its dependency upgrade happens as part of the Phase 10
fresh scaffold. It currently builds and typechecks clean, so CI is meaningful today.

**V7 · Sem 6 feature routes kept wired.** `ai`, `analyze`, `request`, `security`, `tests`, `runs` are
mounted on the new foundation rather than dropped, so the app does not regress in capability while the
foundation is rebuilt underneath it. Their handlers still contain the defects in
`docs/00_SEM6_AUDIT.md` and are rewritten in Phases 5–9. Coupling was shallow — each imported only
`protectRoute` — and they use `req.user.id`, which the new model provides as a mongoose virtual.

**V8 · `npm run evaluate` is wired but exits non-zero.** The harness is Phase 14 and depends on the
Phase 6 fixtures. It prints what is missing rather than a plausible-looking table.

### Not done / carried forward

- **The MongoDB Atlas cluster no longer exists.** `cluster0.t0xwwwe.mongodb.net` returns `NXDOMAIN`
  while `github.com` resolves normally, so this is not a local DNS problem — the free-tier M0 cluster
  was reclaimed after inactivity. The DoD was therefore verified against a local `mongod`. **A new
  Atlas cluster and `MONGO_URI` are needed before anything can run against real data**, and the user
  migration cannot be run until then. This resolves part of Q2: the Mongo credentials in `.env` are dead.
- `GEMINI_API_KEY` reads as unset because `.env` carries the legacy names `NEW_GEMINI_API_KEY` and
  `GEMINI_API_KEY_2`. Rename when the LLM abstraction lands in Phase 7.
- `web/src/services/api.ts` still hardcodes `http://localhost:3001/api`; `VITE_API_URL` still unread.
  Phase 10.
- `web/src/hooks/useAI.ts` still calls Anthropic's API from the browser with "Simulate…" prompts.
  Dead code. **Must not survive Phase 10.**
- Mock constants (`MOCK_PULSE_DATA`, `MOCK_AGENTS`, `logRows`, `statCards`) still in `web/`. Phases 10–12.
- Coverage gate (70% on `mcp/**` and `agents/**`) not enabled — neither tree exists yet. Phase 15.
- CI has not yet run on GitHub; the pipeline was verified locally step by step.

### Open questions

| # | Question | Blocks |
|---|---|---|
| Q2a | **New MongoDB Atlas cluster needed** — the old one is gone. Create an M0 and supply `MONGO_URI`. | running against real data; the user migration |
| Q2b | Is the Groq key in `.env` still valid? Gemini keys are under legacy names — which should be canonical? | Phase 7 |

---

## Phase 4 — Egress guard (SSRF) · 17 Aug 2026 · ✅ complete

`server/src/mcp/ipRules.js` (pure classification) + `server/src/mcp/egress.js` (the guarded
request path). **90 tests.**

Order of operations per `docs/02_TRD.md` §7: scheme allow-list → hostname block → resolve DNS →
validate **every** resolved address → pin the IP → per-host rate limit → manual redirects (max 3,
re-validated each hop) → streamed response with a byte cap.

### Why resolve-then-validate, and why pin

Validating the hostname proves nothing — an attacker controls DNS and can point `evil.com` at
`169.254.169.254`. So we resolve first and judge the **address**. Pinning then closes the TOCTOU
window: Node's agent accepts a `lookup` override, so the socket connects to the address already
validated rather than re-querying DNS. Host header and TLS SNI still carry the real hostname, so
virtual hosting and certificate validation are unaffected.

Since `docs/05_AWS_ARCHITECTURE.md` moved deployment to AWS this stopped being theoretical:
`169.254.169.254` is the instance metadata endpoint, so an unguarded SSRF is a direct path to the
task role's credentials.

### Two bugs the tests caught

- **`::1` reported as "unspecified" rather than "loopback".** It matched the IPv4-compatible pattern
  as `::0.0.0.1` and was unwrapped into the `0.0.0.0/8` rule. Still blocked, but for the wrong
  reason — logic that is coincidentally right breaks under the next small change. Singleton
  addresses are now judged before any IPv4 unwrapping.
- **Bracketed IPv6 skipped IP classification entirely.** `new URL('http://[::1]/')` yields hostname
  `'[::1]'` *with* brackets, so `isIP()` rejected it and the request fell through to a DNS lookup —
  a security decision taking the wrong code path. Brackets are stripped before classification.

Both were found only because there is one test **per range** rather than a single "blocks private
IPs" test.

Verified live: the real AWS and GCP metadata endpoints are refused, in both IPv4 and
IPv4-mapped-IPv6 form. Boundary addresses just outside each private range (`172.15.255.255`,
`172.32.0.1`, `169.253.255.255`, `169.255.0.0`) are asserted to remain **allowed** — a guard that
blocks everything is useless.

---

## Phase 5 — The MCP layer ★ · 17 Aug 2026 · ✅ complete

**The headline.** `docs/00_SEM6_AUDIT.md` §5 named this the single largest threat to the grade: the
Sem 6 report described MCP as implemented while the only occurrence of "MCP" in the codebase was a
UI badge reading "MCP Powered". **196 tests green.**

| File | Role |
|---|---|
| `mcp/registry.js` | `McpServer`, `defineTool`, `withGuards`, `TOOLS` mirror |
| `mcp/permissions.js` | four risk classes, session-scoped grants |
| `mcp/audit.js` | canonical hashing, append-only writer |
| `models/AuditEvent.js` | the immutable collection |
| `mcp/tools/*.js` | all nine tools |
| `routes/mcp.routes.js` | `/tools`, `/audit`, `/grants`, `/status` |
| `mcp/stdio.js`, `mcp/transport.js` | external MCP clients |

### withGuards — the ordering is the architecture

```
permission → audit(started) → schema validation → egress guard → handler
           → audit(ok | denied | error | blocked_ssrf)   [ALWAYS, even on throw]
```

Permission precedes validation deliberately: a caller who may not touch a host is refused without
us parsing their payload, and the denial is audited even when the payload was garbage. The final
write sits in a `finally`, which is what makes **audit-count == tool-call-count** a tested fact.

### Risk classes

| Class | Default |
|---|---|
| `local.compute` | auto-granted — no network to consent to |
| `network.read` | per host |
| `network.probe` | per host, per session, **never auto-granted** |
| `deploy.write` | explicit grant **and** per-action confirmation |

Grants are per risk class and per host, not per tool: approving nine tools individually is theatre,
approving "this app may send attack-indicator payloads to api.example.com" is a real decision. They
live in memory and expire — a grant outliving its session is the "unaccountable automation" problem
in `docs/01_PRD.md` §2.

### Schemas are generated, never hand-written

`/api/mcp/tools` runs `z.toJSONSchema()` on every request with `io: 'input'`, so a defaulted field
is not reported as required and the published schema cannot drift from the validator that runs.

### Two bugs the tests caught

- **`GrantStore.check` used `.find()`**, taking the *first* matching grant. A later confirmation
  therefore never took effect — and worse, a later **downgrade** never did either, so a confirmed
  `deploy.write` outlived the decision to withdraw it. Latest grant now wins, in both directions.
- **Append-only hooks used a `next`-style callback.** Mongoose 7+ treats `updateOne`/`deleteOne` as
  both document *and* query middleware with different signatures, so some threw "next is not a
  function" instead of blocking — an append-only guard that blocked three of eight mutation paths.
  Registered explicitly as query middleware with an async throw.

### Honest stubs

The five `probe_*` tools and `deploy_service` return `{ notImplemented: true }`. Their registry
entry, risk class, schemas, permission gate and audit behaviour are real now; only detection logic
is outstanding (Phases 8 and 13). `docs/01_PRD.md` F5: *"Do not ship a third mock."*

### Deviations

**V9 · Auth rate limiter disabled under `NODE_ENV=test`.** A suite legitimately registers dozens of
users and a shared 20-per-15-minutes budget made results depend on how many tests ran before. The
limiter is unchanged in every other environment.

**V10 · CI uses a MongoDB service container.** `mongodb-memory-server` downloads a mongod binary on
first use; that caches on a developer machine but is a network download on the critical path of
every CI build, and it made the first three runs fail while the identical suite passed locally.
`tests/helpers/mongo.js` uses `MONGO_TEST_URI` when set and falls back to `mongodb-memory-server`
otherwise — deterministic in CI, zero setup locally.

### Not done / carried forward

- **CI has not been confirmed green on a runner.** The fix was verified locally on both database
  paths (154 tests each), but the GitHub API rate limit blocked confirmation. **Check the Actions
  tab.**
- Phases 0–5 complete means the master prompt's "Must" tier is cleared: *"The core claim is true.
  Defensible project."*

---

## Phase 6 — Evaluation fixtures · 17 Aug 2026 · ✅ complete

`fixtures/vulnerable-api` (:4001, measures **recall**) and `fixtures/hardened-api` (:4002, measures
**precision**). `npm run fixtures` starts both. **24 contract tests.**

### The contract identity is the deliverable, not the vulnerabilities

Precision is "findings on hardened" and recall is "findings on vulnerable". That comparison only
means something if the apps differ **solely** in their defects — otherwise a finding on one and not
the other could be explained by an incidental difference. So identity is enforced, not assumed:
both import the same seed data and the same HTML page builder with **the escape function as the only
injected difference**; `contract.test.js` sends every benign request to both and asserts equality;
one builder generates both OpenAPI specs.

Six defects, each mapped to a probe family. Defects 1 and 3 are reachable through two shapes each,
so a probe that tests only one location is still detectable as incomplete.

**`node:sqlite` ships with Node 22**, so the vulnerable app gets a real SQL engine — a genuinely
concatenated query that genuinely injects — with no native dependency and nothing to compile.

Verified live over HTTP: the injection **executes** on the vulnerable app (`/users/1 OR 1=1--`
returns a record) and is rejected with a generic 400 on the hardened one; the XSS payload reflects
verbatim vs escaped; `/admin/users` is 200 vs 401; ACAO is `*` vs absent; 0 vs 4 security headers.

Both specs validate through `@apidevtools/swagger-parser` — the same parser Phase 9 uses — and their
paths and components are byte-identical.

---

## Phase 7 — Testing Agent v2 · 17 Aug 2026 · ✅ complete

`services/llm.js`, `services/jsonRepair.js`, `agents/testing.agent.js`, plus the run lifecycle:
`models/TestRun.js`, `services/run.service.js`, `services/explain.service.js`, `routes/runs.routes.js`.

### The architecture guard became load-bearing

`server/src/agents/` gained a real inhabitant, so `tests/architecture.test.js` stopped passing
vacuously. Verified by temporarily adding `import axios` to the agent: the guard failed and named the
file, then went green on revert.

### Repair the SHAPE, never the MEANING

Sem 6 rewrote `GET` + `expected 400` into `expected 200`, labelled `// ✅ FIX`. That is editing the
test until it passes, and combined with status-only assertions it is why "100% first-time pass" was
tautological. Repair now handles fences, prose, trailing commas, smart quotes and unquoted keys —
and a test asserts a wrong expectation still **fails**. JSON extraction walks the string tracking
bracket depth *and* string state, because `lastIndexOf(']')` breaks on `{"pattern":"a}b"}`.

### No fabricated fallback, ever

One bounded repair retry that shows the model its own output and the specific problem, then a visible
failure. An all-discarded generation throws rather than returning an empty "successful" run.

### BUG-5 fixed structurally

Sem 6 had `let explanationUsed = false` at **module** scope — set true on the first explained failure
and never reset, so explanations fired **once per server process**. The fix is not a `= false`
somewhere: the budget is an object created **per run**, so no module-level variable exists that *can*
leak. A test asserts run **two** still gets explanations.

`EXPLAINING` is time-boxed at 5s and capped at 3 per run; a hanging or throwing provider yields zero
explanations rather than a failed run.

### Every terminal state persists a run

`CANCELLED`, `GEN_FAILED`, `EXEC_FAILED`, `COMPLETE` are all written. A failed run is data, not a
void. Transitions are declared and enforced — `DRAFT → COMPLETE` throws.

### Two security fixes beyond the phase spec

**IDOR closed.** Sem 6's `getRunById` called `findById` with no ownership check, so any authenticated
user could read any run by guessing an id. Reads are scoped by `userId`, and someone else's run
returns **404 not 403** — 403 would confirm the id exists.

**The Sem 6 testing pipeline was retired, not merely superseded.** `/api/ai`, `/api/analyze` and
`/api/tests` are removed along with `ai.service.js`, `analyze.service.js`, `testRunner.service.js`,
`aiRunner.service.js` and `aiExplain.service.js`. Leaving them mounted would have kept Pollinations,
the `GET+400→200` rewrite and the module-scoped flag **reachable in the running app** — one `curl`
away from an examiner.

### Deviation

**V11 · Gemini dropped as a provider.** Bedrock covers the fallback role and reaches many model
families through one Converse interface, so a second bespoke provider key earned nothing.
`LLM_FALLBACK` now defaults to `bedrock`.

### Not measured yet

**≥95% structural validity over 50 real generations** needs a live provider. The *repair pipeline*
measures 100% over 50 realistic wrappings, but the model's own validity is a Phase 14 measurement and
is deliberately not faked.

---

## Phase 8 — Security Agent rebuild · 17 Aug 2026 · ✅ complete

`mcp/probes/fingerprints.js`, `mcp/probes/baseline.js`, five implemented `probe_*` tools,
`agents/security.agent.js`. **315 tests green** across the workspace.

### Acceptance

| | Target | Result |
|---|---|---|
| Families detected on `vulnerable-api` | ≥ 5 of 6 | **6 of 6** |
| Findings on `hardened-api` | 0 | **0** |
| Every finding carries payload + signal + baseline | required | asserted per finding |

### BUG-2 — the auth probe needed THREE requests, not two

Sem 6 reported any anonymous 200 as "Accessible without authentication", which flags every public API
and is what Figure 3.7 shows firing.

**Two requests cannot fix it, and I proved that by getting it wrong first.** Comparing "with
credentials" against "stripped" produced a **CRITICAL false positive on the hardened fixture**:
scanning `/users/1` with an `authorization` header it never reads, removing an ignored header changes
nothing, so the probe concluded auth was bypassed. The Sem 6 mistake in a different costume.

The probe now sends a third request with a deliberately **invalid** credential:

- forged token answered like a real one → the route does not check credentials → public, no finding
- forged token **rejected** but anonymous still succeeds → genuine bypass → **CRITICAL**
- no check at all, on a route not declared public → **HIGH**

From outside, "public endpoint working correctly" and "privileged route with no auth check" are
**indistinguishable** — both serve everyone. That is exactly why intent is a user declaration rather
than a heuristic.

### BUG-7 — fingerprints that work

Sem 6 used `typeof res.data === "string" && res.data.includes("sql")`: it missed every JSON API
(an axios JSON response is an object) and fired on prose containing the word. Bodies are now
serialised before matching, patterns are real driver errors naming the engine, and a test asserts
*"No SQL knowledge required"* is **not** a finding. Sem 6 also `return`ed after the first payload, so
the second payload its own report documented never ran.

### The baseline differential

An endpoint already returning 500 to benign input yields **no claim at all** — broken, not
injectable. That is Sem 6's "any 500 = SQL injection" removed at the root. A length change alone is
never material either, because reflection naturally lengthens a body.

### Notes

Rate limiting is the sixth family, orchestrated from repeated `http_request` calls rather than a
tenth tool, because `docs/01_PRD.md` F1 fixes the registry at nine and every request is audited
anyway. Severity MEDIUM: 8 successes do not prove there is no limiter.

Payloads are read-only — a test asserts none contains a destructive keyword. Severity is calibrated
rather than uniform: four missing headers reported as HIGH would drown a real SQL injection.

### Still outstanding

- **CI has never been confirmed green on a runner.** The service-container fix was verified locally
  on both database paths, but the GitHub API rate limit blocked confirmation. **Unverified.**

---

## Phases 9–12 — Ingestion, UI, run lifecycle, dashboard · 18 Aug 2026 · ✅ complete

**Phase 9 — OpenAPI ingestion.** YAML and JSON, import by URL (through the egress guard) or upload.
`ApiSpec` stores the parsed operations; a grounded run cites the operation it was generated from, so
"the model invented this endpoint" stops being a possible explanation for a failure.

**Phase 10 — fresh `web/`.** Vite 8 + React 19 + Tailwind v4, scaffolded from scratch rather than
salvaged. Tailwind v4 is CSS-first: no `tailwind.config.js`, no `postcss.config.js`, tokens live in
an `@theme` block taken verbatim from `docs/04_App_UI.md` §2. Fonts are self-hosted via
`@fontsource` so the app has no third-party runtime dependency.

**Phase 11 — every screen, four states each.** Loading, empty, error and populated are all designed;
the empty states carry the honest sentence rather than a shrug. `PermissionSheet` is the load-bearing
component: `network.probe` starts unchecked every time, Esc cancels but Enter does **not** allow, and
there is deliberately no click-outside handler. A consent dialog you can dismiss by reflex is not
consent.

**Phase 12 — the dashboard is real.** Every figure is a Mongo aggregation. Sem 6 rendered `2,847`,
`142ms`, `98` and `14` as string literals in the component tree. A new account now shows honest zeros
and a call to action, and `passRate` is `null` rather than `0` when nothing has run — "no data" and
"0% pass" are different claims.

### Two defects found and fixed while wiring the UI

- **Stale `web/.env`** set `VITE_API_URL` without the `/api` suffix, so login 404'd while typecheck
  and build were both clean. A dev-time warning now fires when the value does not end in `/api`.
- **TypeScript 7 removed `baseUrl`**; paths are mapped relative to `tsconfig.json` instead.

---

## Phase 13 — Deployment Agent ★ · 18 Aug 2026 · ✅ complete

`docs/01_PRD.md` F5 is blunt about the bar: *"a deployment that verifies itself is a genuine
contribution; a deploy button is not."*

### Where things run — the distinction a viva will find

|                                            |            |
| ------------------------------------------ | ---------- |
| Where **AGENTIQ itself** is hosted         | AWS        |
| Where the Deployment Agent deploys **the user's API** | Render |

These got conflated early on. Render is the deploy target because F5 requires post-deploy
verification: Render exposes a synchronous deploy-status endpoint and a stable URL within a minute
or two, whereas App Runner takes 5–10 minutes to reach RUNNING — which turns the verify step into a
background job rather than something demonstrable in a ten-minute viva.

### Three phases, three escalating risk classes

| Phase     | Risk class     | What it may do                                       |
| --------- | -------------- | ---------------------------------------------------- |
| Preflight | `network.read` | Read `api.github.com`. Changes nothing.              |
| Deploy    | `deploy.write` | Grant **and** explicit per-action confirmation.      |
| Verify    | `network.read` | Testing + read-only security families on the live URL |

Preflight is confined to `network.read` on purpose: a user can ask *"would this deploy?"* without
consenting to a deployment. If preflight needed `deploy.write`, checking would require consenting
first, which defeats the point of having risk classes.

### The check that earns its keep

`start-command` reads `package.json` through the GitHub contents API and fails when there is no
`start` script. A build that succeeds and a service that never binds a port is the commonest Render
failure. Catching it costs one request; catching it on Render costs a full build. Run against this
repository's own root it correctly refuses — the monorepo root has no `start` script.

### A bug in my own first cut

Preflight originally reported a permission refusal as a `warn` and still returned `ok: true`. So it
would bless a repository it had never actually read. *"We were not allowed to look"* and *"we looked
and it is fine"* must not produce the same verdict. Denials are now `fail`, `needsGrant` is
surfaced, and there is a regression test.

### The credential

`RENDER_API_KEY` is read from the environment **inside** the handler and is deliberately absent from
`inputSchema`. If it were an input field it would flow into `hashInput()`, into any validation error
that echoes the input, and into every future debug log someone adds. `redact()` scrubs both the
configured value and the `rnd_` shape from anything the provider hands back. A test asserts no audit
row contains it.

### Post-deploy verification, and what it honestly does not cover

The live URL cannot have been consented to in advance — it did not exist when the sheet was
answered. So `network.read` is granted for **exactly that one host**, through the normal grant store,
so it appears in `/api/mcp/grants` and the audit trail like any other grant.

`network.probe` is **not** granted. `sqli`, `xss` and `auth` send attack-indicator payloads, and
`permissions.js` is explicit that `network.probe` is never auto-granted under any configuration. The
automatic verification therefore covers four of six families, and the UI says which three were
skipped and why. A partial scan that looks complete would be worse than no scan.

### Testing

41 tests against faked Render and GitHub control planes — no credential, no real infrastructure, no
outbound request on CI. What is real: the agent, the tool, the permission gate, the egress guard, the
audit writer and the database. The fakes record every request, which is what lets a test assert the
thing that matters most: **a dry run sends no mutating request at all.**

---

## Defect found in Phase 13 — the SSRF guard could not reach any hostname

Verifying preflight against the real GitHub API surfaced a bug in `egress.js`, not in the new code.

Node ≥ 20 enables `autoSelectFamily` by default. That path calls a custom `lookup` with
`{ all: true }` and expects an **array** of `{ address, family }`; the override answered with the
older positional `cb(null, address, family)` form. Node read `addresses[0]` as `undefined`, and every
request to a **hostname** failed with `Invalid IP address: undefined`.

IP pinning is what defeats DNS rebinding, so this is the central mechanism of the whole guard. It
failed **closed** rather than open — requests errored rather than skipping validation — so it was
never a security hole. But AGENTIQ could not reach any real API by hostname.

**Why 373 green tests missed it.** Every fixture is reached at `127.0.0.1`, and Node skips the
`lookup` callback entirely for an IP literal. The pinning path had never once been executed by the
suite. The tell was not in any assertion; it was that every target shared one shape.

The new tests use a hostname against a **dual-stack** server, because `localhost` resolves to `::1`
first on macOS and `127.0.0.1` first elsewhere — binding one family would make the result depend on
the machine. Both calling conventions are asserted directly, and reverting the fix fails them.

Worth stating plainly in the report: a suite can be comprehensive by count and still leave the most
important line unexercised, when the fixtures are all the same shape.
