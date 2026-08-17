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
