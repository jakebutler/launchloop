# LaunchLoop — Technical Specification

> This document defines the system architecture, agent design, services, APIs, data flow, and operational model for LaunchLoop. It complements `spec.md` (UX/PRD) and is the implementation backbone for the hackathon build.

---

## 1. Goals & non-goals

### Goals

* End-to-end autonomous flow: brief → build → deploy → measure → experiment → promote → notify.
* Headless coding via **Cline CLI** backed by **Claude Haiku** (code/layout) and **Claude Opus** (brief/copy).
* Deterministic, demo-safe automation (repo-embedded templates, PostHog A/B, Vercel deploys).
* Observable agent behavior with a live activity feed.
* Demo Mode with synthetic traffic/leads and anomaly injection.

### Non-goals (MVP)

* Multi-domain hosting (prod limited to `*.vercel.app`).
* Multi-page websites.
* CRM/marketing automation.

---

## 2. Hard tech-stack decisions (locked)

* **UI/Admin:** Retool (dashboard, setup wizard, activity feed)
* **API/Orchestrator:** Vercel-hosted Node.js (TypeScript) API (serverless functions)
* **Persistent worker:** Fly.io long-running Node service/container

  * **Sizing (MVP):** `shared-cpu-1x` with **2GB RAM**
  * Runs the **Cline** headless worker and manages per-project workspaces
  * Uses a Fly Volume for workspace persistence
  * **Auto-cleanup:** workspaces deleted after a period of inactivity (configurable; default: 7 days)
* **Agent runner (in LaunchLoop runtime):** Cline (CLI/headless)
* **Build tool for LaunchLoop (developer workflow):** Codex CLI (used by the team to build LaunchLoop; not part of the product runtime)
* **Workspace strategy:** One workspace per project (persist between runs)
* **Models (via Anthropic API):**

  * Claude **Haiku** → code/layout generation via Cline
  * Claude **Opus** → brief synthesis + copy (low-thinking)
* **Source control:** GitHub (create-new repo only)
* **Deployment:** Vercel (API/CLI), `*.vercel.app` only
* **Analytics & A/B:** PostHog (events, feature flags/experiments, decide endpoint)
* **Lead storage (MVP):** PostHog events (email as property)
* **Scheduled monitoring:** Yutori Scouting API
* **Synthetic data:** Tonic Fabricate (traffic/leads/anomalies)
* **Assets:** Freepik API (hero + ad creatives)
* **Email:** Resend
* **Secrets:** .env per service + encrypted store

---

## 3. System architecture

### 3.1 Components

1. **Retool App**

   * Setup wizard
   * Project dashboard
   * Experiments page
   * Live activity feed
   * Demo Mode toggle

2. **LaunchLoop Orchestrator (Node/TS)**

   * Auth + project state
   * Service connectors (GitHub, Vercel, PostHog, Yutori, Tonic, Freepik, Resend)
   * Agent scheduler
   * Trigger engine (heuristics)
   * Activity/event stream

3. **Agent Runtime**

   * Task planner
   * State machine (Launch → Measure → Diagnose → Experiment → Promote)
   * Tool adapters
   * Policy engine (Full Agent vs Recommendation-only)

4. **Cline Worker**

   * Workspace manager
   * Repo bootstrap (templates)
   * Headless Cline CLI runner
   * Commit/PR handler
   * Build/test runner

5. **Event Ingestion**

   * PostHog webhooks (experiment results)
   * PostHog polling (metrics snapshots)
   * Demo Mode injector (Tonic)

---

## 4. Data model (MVP)

### 4.1 Project

```ts
Project {
  id: string
  name: string
  brief: Brief
  funnelArchetype: 'single-cta' | 'story' | 'comparison'
  repo: { owner: string; name: string }
  vercel: { projectId: string; prodUrl: string }
  posthog: { projectKey: string }
  mode: 'full-agent' | 'recommend-only'
  status: 'building' | 'live' | 'monitoring' | 'needs-attention'
  demoMode: boolean
}
```

### 4.2 Brief

```ts
Brief {
  product: string
  description: string
  icp: string
  primaryCTA: string
  brandVibe: string
  notes?: string
}
```

### 4.3 Experiment

```ts
Experiment {
  id: string
  type: 'headline-hero'
  variants: { id: 'A'|'B'; headline: string; heroImageUrl: string }[]
  startAt: string
  endAt?: string
  winner?: 'A'|'B'
}
```

### 4.4 Activity Event

```ts
ActivityEvent {
  ts: string
  level: 'info'|'warn'|'error'
  actor: 'agent'|'cline'|'system'
  message: string
  meta?: Record<string, any>
}
```

---

## 5. Repo-embedded templates

A canonical template repo is embedded/bootstrapped into every new project repo:

```
/templates
  /single-cta
  /story
  /comparison
/lib
  analytics.ts      // PostHog events
  experiments.ts    // A/B routing hooks
  leads.ts          // form submit
/pages
  index.tsx
/components
  Hero.tsx
  CTA.tsx
  LeadForm.tsx
  Sections.tsx
```

**Contract:** Cline only edits within allowed files and follows `implementation-plan.md`.

---

## 6. Agent state machine

```
[Init]
  → Launch
  → Measure
  → Diagnose
  → Experiment
  → Promote
  → Notify
  → Measure (loop)
```

### 6.1 Launch

* Generate plan from brief + funnel archetype
* Fetch assets (Freepik)
* Invoke Cline to scaffold from templates
* Deploy via Vercel
* Instrument PostHog

### 6.2 Measure

* Pull PostHog snapshots
* Ingest webhooks
* If Demo Mode: inject Tonic data

### 6.3 Diagnose (heuristics)

* Low conversion rate
* Form abandonment
* Geo-skew

### 6.4 Experiment

* Create PostHog A/B (headline + hero)
* Update routing hooks via Cline
* Start experiment window

### 6.5 Promote

* On winner: auto-merge + deploy to prod

### 6.6 Notify

* In-app activity + email summary (Resend)

---

## 7. Trigger engine (MVP)

```ts
Triggers = {
  lowConversion: (cr < CR_MIN && sessions > SESSIONS_MIN),
  formAbandonment: (abandRate > ABAND_MAX),
  geoSkew: (topCountryShare > GEO_MAX)
}
```

Each trigger produces:

* Diagnosis
* Recommendation
* Experiment plan (headline + hero)

---

## 8. Cline CLI contract

### Inputs

* `implementation-plan.md` (what to build/change)
* `brief.json`
* `assets.json` (hero image URLs)
* `env.sample`

### Actions

* Edit template files
* Add/update analytics hooks
* Add experiment routing
* Run build/test
* Commit changes

### Outputs

* Commit SHA
* Build logs
* Preview URL n

---

## 9. External service adapters

* **GitHubAdapter**: create repo, push commits
* **VercelAdapter**: create project, deploy, promote
* **PostHogAdapter**: events, metrics, experiments
* **YutoriAdapter**: scheduled scouting (monitoring ticks)
* **TonicAdapter**: generate sessions/leads/anomalies
* **FreepikAdapter**: hero/ad creatives
* **ResendAdapter**: emails

---

## 10. Demo Mode

* Toggle in Retool
* Generates:

  * Sessions (10k)
  * Funnel drop-offs
  * Leads (20–200)
  * Anomalies (good/bad/viral/geo)
* Forces a triggered update within 60s

---

## 11. Security & safety

* Encrypted secrets
* Scoped GitHub token (repo create + write)
* Scoped Vercel token (project deploy only)
* Rate limits on agent actions
* Full audit trail (ActivityEvent)

---

## 12. Operational considerations

* Idempotent agent steps
* Retries with backoff
* Timeouts on Cline runs
* Rollback on failed deploy
* Kill-switch for Full Agent
