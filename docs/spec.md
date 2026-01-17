# LaunchLoop — Product Spec (UX-focused)

## 1. Product summary

LaunchLoop is an autonomous “growth loop” product that helps a founder go from **idea → launched landing page → measured performance → continuous optimization**, with minimal manual work.

LaunchLoop creates and deploys a landing page, instruments analytics, collects leads, and then runs a long-running agent that monitors performance and sends dynamic, actionable updates and recommendations. It can also optionally apply changes (copy, layout, creatives, experiment variants) to the landing page.

## 2. Target users

* **Indie founders / early-stage startups** who want a fast, credible launch and ongoing growth guidance.
* **Growth-minded builders** who can connect GitHub/Vercel/PostHog but don’t want to manually build and iterate pages.

## 3. Core user goals

1. Launch a high-quality landing page quickly.
2. Capture qualified leads (email + a few qualifying questions).
3. Measure performance (views → clicks → leads).
4. Receive periodic, data-driven guidance.
5. Run experiments and see results with minimal effort.

## 4. Non-goals

* Not a full marketing automation suite (no full CRM).
* Not a general website builder for multi-page sites.
* Not a full paid ads platform (traffic acquisition can be out of scope or simulated for demo).

## 5. Experience principles

* **Product, not chat:** primary UI is a dashboard + workflows, not a single chat box.
* **Autonomous by default:** the system runs a continuous loop without prompting.
* **Explain decisions:** show *why* recommendations and experiments are chosen.
* **Safe automation:** user controls what can be auto-applied vs. recommended-only.

## 6. Primary UX surfaces

### 6.1 Setup wizard (first run)

**Goal:** connect the minimum required services and create a project.

Steps:

1. **Project basics**

   * Project name
   * One-sentence description
   * Target audience (ICP)
   * Primary CTA (e.g., “Join waitlist”, “Request access”, “Book a demo”)
   * Brand vibe (e.g., “calm”, “bold”, “clinical”, “playful”)
   * Funnel archetype (choose one):

     * Single-CTA hero page
     * Story-driven long-form
     * Comparison/feature-heavy
   * Button: **“Auto-fill with AI”** (generates intelligent defaults for all fields from the product description; user can edit)
   * Auto-fill can include competitor context (TinyFish)
2. **Connections**

   * GitHub connection (create-new repo only; write access)
   * Vercel connection (deploy access; *.vercel.app only for MVP)
   * PostHog connection (project key)
   * Sponsor tools (keys): Anthropic, Freepik, TinyFish, Yutori, Tonic (optional in UX, required for hack submission)
   * Retool Agent connection (decision layer; configured via email/web chat trigger)
3. **Permissions & automation level**

   * Default mode: **Full Agent (Autopilot)**
   * Toggle to downgrade to Recommendation-only (post-MVP; MVP uses kill switch only)
   * Autopilot scope (MVP):

     * Create A/B tests
     * Apply winning variant to prod
4. **Lead capture form settings (MVP)**

   * Required field: email
   * Thank-you message

Output of wizard:

* LaunchLoop Project created
* New GitHub repo created
* First deploy prepared

### 6.2 Project dashboard (home)

**At-a-glance:**

* Current live URL (prod) + preview URL
* Status: Building / Live / Monitoring / Needs attention
* Key metrics: Sessions, CTA clicks, Conversion rate, **Qualified lead rate (north star)**, Leads
* Current experiment: variant A/B, status, winner (if any)
* Next recommended actions (ranked)
* **Live activity feed** (research → build → deploy → experiment → promote)
* Decision agent status (last decision, confidence)

### 6.3 Launch workflow (first deploy)

A guided flow that ends with a live URL.

Screens:

1. **Brief review** (editable; supports AI auto-filled values)
2. **Generated plan** (chosen funnel archetype, sections, copy themes, images, tracking events)
3. **Build progress**

   * “Researching competitors”
   * “Generating assets”
   * “Generating page code”
   * “Deploying to Vercel”
4. **Launch summary**

   * Live URL
   * What’s instrumented (events)
   * Lead form configured
   * Monitoring enabled (Yutori Scouting)

### 6.4 Experiments & iterations

A page showing:

* Experiment history (what changed, when, why)
* Current recommendations and confidence
* Actions:

  * “Create A/B test” (PostHog)
  * “Apply winning variant to prod”
  * “Pause Full Agent”
  * “Decision Agent status” (read-only)

### 6.5 Founder updates (notifications)

A recurring update message that is **dynamic in timing and content**, based on observed performance.

Update types:

* **Routine update** (daily/weekly summary)
* **Triggered update** (e.g., low conversion, form abandonment, geo-skew)

Each update includes:

* What changed
* Likely diagnosis
* Recommended next actions
* A/B experiment status
* Lead count (no PII)

Delivery (MVP):

* In-app feed + email (via Resend)

## 7. Core user flows

### 7.1 Create project → launch

1. User starts setup wizard
2. Connects GitHub/Vercel/PostHog
3. Chooses automation level
4. Submits brief
5. LaunchLoop deploys landing page
6. User sees live URL + dashboard metrics

### 7.2 Monitoring → recommendation

1. PostHog streams page + form events
2. LaunchLoop monitoring evaluates metrics on a schedule
3. Retool Agent evaluates the trigger and recommends action
4. LaunchLoop posts an update with recommendations
5. User approves or ignores

### 7.3 Monitoring → auto-apply

1. Autopilot enabled + scoped
2. Trigger condition met (e.g., low conversion)
3. Retool Agent proposes change (headline + hero) using PostHog + competitor data
4. LaunchLoop creates a change proposal (diff + rationale)
5. If within scope, LaunchLoop auto-applies (or runs A/B)
6. PostHog measures result
7. Update posted

## 8. Data collected & displayed (UX-level)

* Landing page sessions
* CTA clicks
* Scroll depth (optional)
* Form starts / form submits
* Lead records (email + qualifiers)
* Experiment metadata (variant definitions, start/end, winner)

## 9. Constraints & requirements

* Must use **at least 3 sponsor tools** (target: 5+ for differentiation).
* Must support **one-click demo** with simulated traffic/leads when real traffic is unavailable.
* Must be demoable end-to-end in **3 minutes**: idea → live URL → analytics → autonomous update.
* Must support safe automation with explicit opt-in downgrade (Full Agent → Recommendation-only).
* Default automation mode is **Full Agent**.
* Deployment target is **Vercel (*.vercel.app only)**.
* Repo creation is **create-new only** for MVP.
* Lead storage for MVP is **PostHog-only** (email captured as event property).
* Trigger heuristics (locked): **low conversion rate**, **form abandonment**, **geo-skew**.
* Decision layer (MVP): Retool Agent via email/web chat triggers (web chat for manual testing).

## 10. Hard tech-stack decisions (locked)

* Deployment: **Vercel**

* Analytics & A/B: **PostHog**

* Lead storage (MVP): **PostHog events**

* Scheduled monitoring: **Yutori Scouting API**

* Coding agent: **Cline (CLI/headless) + Claude API**

* Models:

  * **Claude Haiku** for code + layout generation via Cline
  * **Claude Opus** for brief synthesis + copy (low-thinking)

* Notifications: **Resend (email) + in-app feed**

* Deployment: **Vercel**

* Analytics & A/B: **PostHog**

* Scheduled monitoring: **Yutori Scouting API**

* Coding agent: **Cline (CLI/headless) + Claude API**

* Notifications: **Resend (email) + in-app feed**

* Deployment: **Vercel**

* Analytics: **PostHog**

* Scheduled monitoring: **Yutori Scouting API**

* Coding agent: **Cline (CLI/headless) + Claude API**

## 11. Open questions (to be resolved)

* Hosting/format of lead storage (DB vs PostHog vs simple JSON/CSV for MVP)
* Notification channel(s) (email vs Slack vs in-app only)
* How “approve” works in demo (button in UI vs link)
* A/B testing mechanism (Vercel split testing vs app-level routing)

---

# Appendix A — MVP scope for hackathon demo

## Demo scenarios (must support both)

1. **New product launch**

   * User enters product description
   * Clicks “Auto-fill with AI”
   * Chooses funnel archetype
   * Reviews brief
   * LaunchLoop researches, generates, deploys
   * User gets live URL and dashboard with live activity feed

2. **Live product optimization (demo mode)**

   * Demo Mode toggle injects synthetic traffic & leads (Tonic)
   * Scenarios: “Good week”, “Bad week”, “Viral spike”, “Geo-skew”
   * Triggered update fires (low conversion, form abandonment, geo-skew)
   * Full Agent creates an A/B test (PostHog)
   * Winning variant auto-promoted to prod

## MVP must-have

* Setup wizard with AI auto-fill + funnel archetype selection
* Generate + deploy a landing page from a brief
* Lead capture form (email-only)
* PostHog event instrumentation + A/B tests
* Demo Mode (Tonic simulated traffic/leads + anomalies)
* Monitoring loop (Yutori) that produces at least 1 triggered update
* Full Agent autopilot path (auto-create experiment → auto-promote winner)
* Live activity feed (agent working logs)

## MVP nice-to-have

* Freepik-generated hero + ad creative
* TinyFish competitor scrape feeding the brief
* Macroscope investigation report for red-flag heuristics

# Appendix B — Glossary

* **Full Agent:** default mode; system can apply changes automatically (opt-in downgrade available)
* **Recommendation-only:** system advises but does not change production
* **Triggered update:** update initiated by an observed metric condition
* **Demo Mode:** synthetic traffic/leads and anomalies injected for demo realism
