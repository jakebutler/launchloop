# LaunchLoop — Phased Implementation Plan (Agent-ready)

> Purpose: This is the authoritative build plan for LaunchLoop. Each task is written so a single developer/agent can pick it up, implement it end-to-end, validate it, and then update this plan with status + notes.
>
> Rules of engagement:
>
> * Every task produces a **verifiable artifact** (code, config, test, or screenshot) and a **validation step**.
> * Every task ends by updating **this file**: mark status ✅/🟡/❌ and add a short “Notes” line.
> * Prefer small PRs/commits with clear names.
> * Never proceed to a downstream phase until the upstream phase validation passes.

---

## 0. Canonical stack & constraints

**Locked decisions (from spec/tech-spec):**

* Retool UI
* Vercel serverless API (Node/TS)
* Fly.io long-running worker (Node/TS) w/ **2GB RAM**, persistent **Cline headless**
* Repo creation: create-new only (GitHub)
* Deploy: Vercel `*.vercel.app` only
* Analytics & A/B: PostHog (feature flags/experiments + decide endpoint)
* Monitoring ticks: Yutori Scouting API
* Synthetic traffic/leads: Tonic Fabricate
* Assets: Freepik API
* Notifications: Resend
* Models: Haiku for Cline code/layout; Opus for brief/copy (low-thinking)
* A/B unit: **headline + hero**
* Templates: repo-embedded funnel archetypes (single-cta, story, comparison)
* Lead capture: email-only; leads stored in PostHog events (email as property)
* Full Agent default (autopilot), kill-switch in dashboard header
* Workspace retention: auto-cleanup after inactivity (default 7 days)

---

## 1. Repo layout (LaunchLoop core)

### 1.1 Create mono-repo structure

**Owner:** Agent
**Status:** ⬜

**Goal:** Create a repository with two deployable services + shared packages.

**Tasks:**

1. Create repo `launchloop`.
2. Add folders:

   * `/apps/api` (Vercel serverless API)
   * `/apps/worker` (Fly worker)
   * `/apps/template-seed` (the code seeded into new landing repos)
   * `/packages/shared` (types, utils)
   * `/docs` (specs: copy `spec.md`, `tech-spec.md`, this plan)
3. Add workspace tooling (pnpm or npm workspaces). Choose one and document.
4. Add `.env.example` per app.

**Artifacts:**

* Repo with folder structure
* Workspace config

**Validation:**

* `pnpm -r install` (or equivalent)
* `pnpm -r build` succeeds with placeholder code

**Update plan:**

* Mark ✅ and note chosen workspace tool.

---

## 2. Shared contracts (types + job protocol)

### 2.1 Define shared TypeScript types

**Owner:** Agent
**Status:** ⬜

**Goal:** Single source of truth for Project, Brief, Experiment, ActivityEvent, Job payloads.

**Tasks:**

1. In `/packages/shared`, define types:

   * `Project`, `Brief`, `Experiment`, `ActivityEvent`
   * `WorkerJob` union:

     * `BOOTSTRAP_LANDING_REPO`
     * `UPDATE_LANDING_COPY`
     * `CREATE_EXPERIMENT_VARIANT`
     * `PROMOTE_WINNER`
   * `WorkerJobResult`
2. Define `ActivityEvent` schema carefully (includes correlation/jobId).
3. Export runtime validators (zod) for API boundaries.

**Artifacts:**

* `packages/shared/src/types.ts`
* `packages/shared/src/validators.ts`

**Validation:**

* `pnpm -r test` (add minimal tests for validators)

**Update plan:** ✅/🟡 with notes.

---

## 3. Persistence for LaunchLoop state (minimal DB)

> Note: Leads are stored in PostHog, but LaunchLoop still needs a small persistent store for projects, credentials references, jobs, and activity feed.

### 3.1 Choose and implement a minimal state store

**Owner:** Agent
**Status:** ⬜

**Decision needed:** pick one for MVP and document in `tech-spec.md` as an update.

* Option A: SQLite (file) in the Fly worker + API reads via worker
* Option B: Postgres (Neon) shared between API and worker
* Option C: Redis + blob store (overkill)

**Recommended for speed:** Option B (Neon Postgres) or Option A if you want zero external deps.

**Tasks:**

1. Implement `ProjectStore` interface in `/packages/shared`:

   * `createProject`, `getProject`, `listProjects`, `updateProject`
   * `appendActivityEvent`, `listActivityEvents`
   * `enqueueJob`, `dequeueJob`, `setJobStatus`, `getJob`
2. Add migrations (if SQL).

**Artifacts:**

* Store implementation + migrations

**Validation:**

* Local dev: create project, enqueue job, write activity, read back.

**Update plan:** Mark choice + ✅.

---

## 4. Vercel API (Orchestrator)

### 4.1 API skeleton + auth boundary

**Owner:** Agent
**Status:** ⬜

**Goal:** Provide endpoints Retool can call.

**Endpoints (MVP):**

* `POST /api/projects` create project
* `GET /api/projects/:id` get project
* `GET /api/projects/:id/activity` list activity feed
* `POST /api/projects/:id/launch` start launch job
* `POST /api/projects/:id/demo-mode` toggle demo mode + scenario
* `POST /api/projects/:id/kill` pause Full Agent
* `POST /api/projects/:id/resume` resume Full Agent

**Tasks:**

1. Create Vercel API app scaffold.
2. Add simple auth strategy for Retool (shared secret header for MVP).
3. Implement endpoint handlers calling the Store and Worker.

**Artifacts:**

* API routes implemented
* Auth middleware

**Validation:**

* Use `curl` or Postman to create a project and fetch it.

**Update plan:** ✅ with notes.

### 4.2 Worker RPC (API → Worker)

**Owner:** Agent
**Status:** ⬜

**Goal:** API can enqueue jobs and stream status.

**Tasks:**

1. Pick RPC: HTTP JSON to Fly worker.
2. Implement `POST /worker/jobs` and `GET /worker/jobs/:id` on worker.
3. API endpoint `launch` enqueues `BOOTSTRAP_LANDING_REPO`.

**Artifacts:**

* Worker RPC endpoints
* API adapter `WorkerClient`

**Validation:**

* Enqueue job from API; observe worker receives it.

**Update plan:** ✅.

---

## 5. Fly Worker (Persistent Cline runner)

### 5.1 Fly app bootstrap

**Owner:** Agent
**Status:** ⬜

**Goal:** Deploy long-running Node worker with volume.

**Tasks:**

1. Create Fly app `launchloop-worker`.
2. Configure machine size: shared-cpu-1x, 2GB RAM.
3. Attach a volume mounted at `/data`.
4. Add env var setup (Anthropic key, GitHub token, Vercel token, PostHog keys, etc.).

**Artifacts:**

* `fly.toml`
* Deployment instructions in `/docs/runbooks.md`

**Validation:**

* `fly deploy` works.
* Health endpoint `GET /health` returns OK.

**Update plan:** ✅.

### 5.2 Workspace manager

**Owner:** Agent
**Status:** ⬜

**Goal:** One workspace per project, persisted on volume.

**Tasks:**

1. Define workspace paths: `/data/workspaces/{projectId}`.
2. Implement:

   * `ensureWorkspace(projectId)`
   * `getWorkspaceAge(projectId)`
   * `cleanupInactiveWorkspaces(days=7)`
3. Add a daily cleanup cron inside worker (simple timer) + manual endpoint `POST /admin/cleanup`.

**Artifacts:**

* WorkspaceManager module

**Validation:**

* Create fake workspaces; run cleanup; verify deletion.

**Update plan:** ✅.

### 5.3 Job queue + execution loop

**Owner:** Agent
**Status:** ⬜

**Goal:** Worker can run jobs sequentially (single concurrency for MVP).

**Tasks:**

1. Implement queue (DB-backed recommended).
2. Worker loop:

   * `dequeueJob()`
   * mark running
   * execute job handler
   * mark success/fail
   * append activity events throughout
3. Add job cancellation hook for kill-switch.

**Artifacts:**

* `JobRunner` + handlers map

**Validation:**

* Enqueue dummy job; see status transitions + activity events.

**Update plan:** ✅.

---

## 6. Cline headless integration

### 6.1 Install and run Cline headlessly in worker

**Owner:** Agent
**Status:** ⬜

**Goal:** Worker can invoke Cline CLI with task inputs and capture outputs.

**Tasks:**

1. Add Cline installation method inside container (documented).
2. Implement `runCline({workspace, taskFile, env})`:

   * streams stdout/stderr to activity feed
   * enforces timeout
   * captures exit code
3. Establish standardized inputs:

   * `brief.json`
   * `implementation-plan.md` (for landing repo)
   * `assets.json`
   * `policy.json` (allowed edits)

**Artifacts:**

* `ClineRunner` module
* Example task templates in `/apps/worker/tasks/`

**Validation:**

* Run a tiny sample task in a dummy repo and confirm file changes.

**Update plan:** ✅.

### 6.2 Clarify model routing (Haiku vs Opus)

**Owner:** Agent
**Status:** ⬜

**Goal:** Ensure the system uses Haiku for code/layout and Opus only for brief/copy.

**Tasks:**

1. Implement `ModelPolicy`:

   * Opus only callable by `BriefSynthesizer` service
   * Cline runner uses Haiku model config
2. Add guardrails: log model used per operation.

**Artifacts:**

* `ModelPolicy` module

**Validation:**

* Activity feed shows model selection.

**Update plan:** ✅.

---

## 7. Landing template seed (repo-embedded funnel archetypes)

### 7.1 Build the template seed app

**Owner:** Agent
**Status:** ⬜

**Goal:** Create a clean Next.js landing page template with 3 archetypes.

**Tasks:**

1. In `/apps/template-seed`, implement Next.js app with:

   * `templates/single-cta`
   * `templates/story`
   * `templates/comparison`
2. Include components:

   * `Hero`, `Sections`, `CTA`, `LeadForm`
3. Add simple styling system (tailwind) and a config file `site.config.json`.
4. Define event hooks for PostHog:

   * `page_view` (automatic)
   * `cta_click`
   * `lead_form_start`
   * `lead_submit`

**Artifacts:**

* Template seed code
* `site.config.json` contract

**Validation:**

* `pnpm dev` loads each archetype.
* Events fire locally (can log to console for MVP).

**Update plan:** ✅.

---

## 8. GitHub + Vercel automation (new landing repos)

### 8.1 GitHub repo creation + push

**Owner:** Agent
**Status:** ⬜

**Goal:** Create a new repo per project and push template seed.

**Tasks:**

1. Implement GitHub adapter:

   * create repo
   * clone/push
2. On `BOOTSTRAP_LANDING_REPO` job:

   * create repo `launchloop-{slug}`
   * copy template-seed into workspace
   * write `site.config.json` from brief + selected archetype
   * commit + push

**Artifacts:**

* GitHubAdapter
* Bootstrap job handler

**Validation:**

* Repo exists with code; `git log` shows initial commit.

**Update plan:** ✅.

### 8.2 Vercel project creation + deploy

**Owner:** Agent
**Status:** ⬜

**Goal:** Connect repo to Vercel and deploy to prod.

**Tasks:**

1. Implement Vercel adapter:

   * create project
   * deploy
   * fetch prod URL
2. For MVP, deploy to prod immediately and store `prodUrl` in Project.

**Artifacts:**

* VercelAdapter
* Deploy handler

**Validation:**

* `prodUrl` loads successfully.

**Update plan:** ✅.

---

## 9. Brief synthesis + asset generation

### 9.1 AI auto-fill for setup wizard

**Owner:** Agent
**Status:** ⬜

**Goal:** Given product description, generate defaults for ICP, CTA, brand vibe, and archetype recommendation.

**Tasks:**

1. Implement `POST /api/brief/suggest` in Vercel API.
2. Use Opus low-thinking prompt.
3. Return structured JSON matching `Brief`.

**Artifacts:**

* Suggest endpoint + prompt

**Validation:**

* Manual test: input product description → returns plausible defaults.

**Update plan:** ✅.

### 9.2 Freepik hero generation

**Owner:** Agent
**Status:** ⬜

**Goal:** Generate hero image per brief.

**Tasks:**

1. Implement FreepikAdapter call.
2. Save resulting image URL in `assets.json`.

**Artifacts:**

* FreepikAdapter

**Validation:**

* Generated image appears in landing page.

**Update plan:** ✅.

---

## 10. PostHog instrumentation + qualified lead rate

### 10.1 PostHog event schema and capture

**Owner:** Agent
**Status:** ⬜

**Goal:** PostHog captures events and can compute qualified lead rate.

**Tasks:**

1. Implement PostHog initialization in template.
2. Ensure lead submit event includes `email` property.
3. Define “Qualified lead” for MVP as `lead_submit` (since no qualifiers).
4. Implement API endpoint `GET /api/projects/:id/metrics` to compute:

   * sessions
   * cta_clicks
   * lead_submit
   * form abandonment
   * geo distribution
   * qualified lead rate = leads / sessions

**Artifacts:**

* PostHog integration
* Metrics endpoint

**Validation:**

* Generate traffic (real or demo) and confirm metrics populate.

**Update plan:** ✅.

---

## 11. A/B testing (headline + hero)

### 11.1 PostHog feature flag/experiment wiring

**Owner:** Agent
**Status:** ⬜

**Goal:** A/B test headline + hero using PostHog.

**Tasks:**

1. Implement feature flag evaluation on client using PostHog decide.
2. Create “headlineHeroTest” flag mapping A/B.
3. In code, set headline + hero based on variant.
4. Fire `experiment_view` and `experiment_convert` events.

**Artifacts:**

* Flag wiring
* Variant switching code

**Validation:**

* PostHog shows variant distribution and conversions.

**Update plan:** ✅.

### 11.2 Full Agent experiment creation + promotion

**Owner:** Agent
**Status:** ⬜

**Goal:** When triggers fire, agent creates experiment and promotes winner.

**Tasks:**

1. Implement `ExperimentPlanner`:

   * proposes variant B headline + hero
2. Implement job `CREATE_EXPERIMENT_VARIANT`:

   * updates config
   * deploys
3. Implement `PROMOTE_WINNER`:

   * reads PostHog results
   * sets config to winner and redeploys

**Artifacts:**

* Experiment jobs

**Validation:**

* End-to-end: trigger → experiment → winner → promote.

**Update plan:** ✅.

---

## 12. Monitoring (Yutori Scouting)

### 12.1 Scheduled monitoring ticks

**Owner:** Agent
**Status:** ⬜

**Goal:** Yutori Scouting triggers monitoring runs.

**Tasks:**

1. Implement YutoriAdapter to create a schedule for each project.
2. On tick, worker runs `Measure → Diagnose`.
3. If triggers fire, enqueue experiment jobs.

**Artifacts:**

* Yutori schedule setup

**Validation:**

* Manual simulate tick; verify job enqueued.

**Update plan:** ✅.

---

## 13. Demo Mode (Tonic)

### 13.1 Synthetic traffic + anomaly injection

**Owner:** Agent
**Status:** ⬜

**Goal:** Toggle demo mode and inject traffic/leads into PostHog.

**Tasks:**

1. Implement TonicAdapter to generate sessions/leads by scenario:

   * Good week
   * Bad week
   * Viral spike
   * Geo-skew
2. Implement injector that sends events to PostHog (server-side).
3. Ensure demo mode forces a triggered update within 60 seconds.

**Artifacts:**

* Demo mode endpoints
* Injector

**Validation:**

* Toggle scenario; see PostHog populate and trigger fires.

**Update plan:** ✅.

---

## 14. Activity feed + notifications

### 14.1 Live activity feed

**Owner:** Agent
**Status:** ⬜

**Goal:** Show agent “working” logs in Retool.

**Tasks:**

1. Store ActivityEvents in the ProjectStore.
2. Expose `GET /api/projects/:id/activity`.
3. Retool UI renders the feed with filters.

**Artifacts:**

* Activity API
* Retool component

**Validation:**

* Launch job emits events visible in UI.

**Update plan:** ✅.

### 14.2 Email updates (Resend)

**Owner:** Agent
**Status:** ⬜

**Goal:** Send dynamic updates with lead counts and recommendations.

**Tasks:**

1. Implement ResendAdapter.
2. Templates:

   * routine summary
   * triggered alert
3. Email contains lead count only (no PII).

**Artifacts:**

* Email sender
* Templates

**Validation:**

* Triggered update sends email.

**Update plan:** ✅.

---

## 15. Retool UX build

### 15.1 Setup wizard UI

**Owner:** Agent
**Status:** ⬜

**Goal:** Implement spec surfaces in Retool.

**Tasks:**

1. Wizard forms for brief inputs.
2. “Auto-fill with AI” button calls `/api/brief/suggest`.
3. Connection fields for keys (MVP can be entered into env/config; UI can be stubbed).
4. Launch button triggers `/api/projects/:id/launch`.

**Artifacts:**

* Retool app

**Validation:**

* Can create project and start launch.

**Update plan:** ✅.

### 15.2 Dashboard UI

**Owner:** Agent
**Status:** ⬜

**Goal:** Dashboard with status, metrics, kill switch, activity feed, demo mode.

**Tasks:**

1. Header kill switch calls `/api/projects/:id/kill`.
2. Metrics panel calls `/api/projects/:id/metrics`.
3. Demo Mode toggle calls `/api/projects/:id/demo-mode`.

**Artifacts:**

* Dashboard

**Validation:**

* Metrics and events reflect real data.

**Update plan:** ✅.

---

## 16. Safety, testing, and polish

### 16.1 End-to-end smoke tests

**Owner:** Agent
**Status:** ⬜

**Goal:** A script to run the full flow quickly.

**Tasks:**

1. Add `/scripts/smoke.ts`:

   * create project
   * suggest brief
   * launch
   * toggle demo mode geo-skew
   * verify experiment job enqueued
2. Print URLs and key metrics.

**Artifacts:**

* Smoke test script

**Validation:**

* Run script successfully.

**Update plan:** ✅.

### 16.2 Credit burn controls

**Owner:** Agent
**Status:** ⬜

**Goal:** Stay within $50 Anthropic + $50 Fly credits.

**Tasks:**

1. Implement token usage logging per operation.
2. Add caps:

   * Max Cline runs per hour per project
   * Max Opus calls per project per hour
3. Add “budget” warning events into activity feed.

**Artifacts:**

* Budget guardrails

**Validation:**

* Exceed cap and confirm graceful refusal + warning.

**Update plan:** ✅.

---

## 17. Definition of Done (MVP)

LaunchLoop is MVP-done when:

* A user can input a product description, auto-fill a brief, choose funnel archetype, and click Launch.
* A brand-new GitHub repo is created, pushed, connected to Vercel, and deployed to a live `*.vercel.app` URL.
* PostHog events are captured and metrics appear in dashboard.
* Demo Mode can inject synthetic traffic/leads and produce a triggered update.
* A trigger can cause an A/B test to be created (headline+hero), and the winner is auto-promoted to prod.
* Activity feed shows the agent working throughout.
* Kill switch stops automation.

---

## 18. Task status legend

* ⬜ Not started
* 🟡 In progress
* ✅ Done
* ❌ Blocked

---

## 19. Change log

* (Update this section when major plan edits occur.)
