Below is a short, implementation-oriented doc you can drop into /docs/retool-agents.md (or similar). It’s written to be easy for an AI-coding agent to turn into concrete tasks + wiring.

⸻

Retool Agents Integration: A/B Testing & Data Evaluation Agent

Purpose

Add Retool Agents as an optional “decision layer” in LaunchLoop’s autonomy loop. The Retool Agent evaluates PostHog-triggered alerts (low conversion, form abandonment, geo-skew), decides whether to run an A/B test, proposes the variant strategy (headline + hero), and triggers LaunchLoop’s worker to implement and deploy the variation via Cline.

This strengthens:
	•	Autonomy (event-driven decisions)
	•	Tool use (Retool Agents + PostHog workflows + Cline worker)
	•	Retool prize positioning (Retool is not just UI, but an agent participant)

⸻

High-level Flow

1) PostHog detects a trigger

A PostHog Workflow (or any equivalent automation) fires when a metric crosses a threshold:
	•	Low conversion rate
	•	Form abandonment
	•	Geo-skew

PostHog sends an email to a dedicated address (web chat trigger is also supported for manual testing):
	•	signals@launchloop.yourdomain.com

2) Email trigger enters LaunchLoop

LaunchLoop receives the PostHog-trigger email through Resend Inbound Parse (or any inbound email parsing service you choose).
For manual testing, a web chat trigger can send the same normalized payload.

LaunchLoop converts the email into a normalized event:

{
  "projectId": "proj_123",
  "triggerType": "geo_skew",
  "metricsSnapshot": {...},
  "siteUrl": "https://foo.vercel.app",
  "timestamp": "..."
}

3) LaunchLoop calls Retool Agent

LaunchLoop sends the normalized event payload to a Retool Agent endpoint (Retool Workflow or Agent API).

4) Retool Agent makes a decision

The Retool Agent returns a decision object:

{
  "decision": "CREATE_AB_TEST",
  "experimentType": "headline_hero",
  "hypothesis": "Users from Germany convert better with localized language and culturally familiar framing.",
  "variantB": {
    "headline": "…",
    "heroPrompt": "…"
  },
  "confidence": 0.86,
  "explanation": "Geo-skew 62% Germany + conversion 0.9% suggests mismatch in language/tone."
}

5) LaunchLoop executes the decision

If CREATE_AB_TEST:
	•	LaunchLoop enqueues a worker job: CREATE_EXPERIMENT_VARIANT
	•	The Fly worker runs headless Cline to implement the config change (headline + hero)
	•	Deploys to Vercel
	•	Creates/starts PostHog experiment (or ensures flag exists)
	•	Updates activity feed + sends founder update

If NO_ACTION:
	•	Log decision in activity feed and optionally send a “no action needed” update.

⸻

Where Retool Fits

Retool App (UI)

Retool continues to be the founder-facing UI:
	•	Dashboard
	•	Activity feed
	•	Kill switch
	•	Demo Mode controls

Retool Agent (Decision Layer)

Retool Agent is not responsible for deployment or code changes.
It’s responsible for:
	•	Choosing whether to act
	•	Proposing the experiment plan (headline + hero)
	•	Returning structured decisions

LaunchLoop remains the executor.

⸻

Required Components

A) PostHog Workflow (Email Trigger)
	•	Configure a PostHog workflow that sends an email when a threshold is crossed.
	•	Include enough context in the email body/subject to map to projectId and trigger type.

Minimum email content required:
	•	projectId (preferred; stable mapping key like site URL as fallback)
	•	Trigger type
	•	Metrics summary (conversion, abandonment, geo share)
	•	Timestamp
	•	Optional TinyFish context (audience tags, pricing cues)

B) Inbound Email Parsing

Use Resend Inbound to parse PostHog trigger emails into JSON.
Result: webhook handler in LaunchLoop API receives structured inbound email content.

C) LaunchLoop “Signals” Endpoint

Add an endpoint to accept inbound triggers:
	•	POST /api/signals/posthog-email

Responsibilities:
	•	Verify inbound sender (basic allowlist)
	•	Extract projectId, triggerType, metrics
	•	Record ActivityEvent: “Signal received”
	•	Call Retool Agent
	•	Record ActivityEvent: “Retool Agent decision”
	•	Execute decision via worker jobs

D) Retool Agent + Prompt Contract

Create a Retool Agent called: LaunchLoop Growth Decision Agent

Inputs:
	•	triggerType
	•	metricsSnapshot
	•	currentExperimentStatus
	•	siteUrl
	•	optionally current headline/hero prompt

Output JSON schema:
	•	decision: CREATE_AB_TEST | NO_ACTION | NEEDS_HUMAN_REVIEW
	•	experimentType: headline_hero (only type in MVP)
	•	hypothesis: string
	•	variantB.headline: string
	•	variantB.heroPrompt: string (used to generate hero via Freepik, or select an existing asset)
	•	confidence: number 0–1
	•	explanation: string

Rules:
	•	Only recommend headline+hero changes in MVP.
	•	Keep copy concise.
	•	No PII in outputs.

E) Execution Path (Existing)

LaunchLoop already has:
	•	Worker job types for experiment creation
	•	Headless Cline runner
	•	Vercel deploy
	•	PostHog experiment wiring
	•	Notifications + activity feed

Retool Agent only needs to plug into that.

⸻

Demo-Friendly Behaviors

For the hack demo, make the system deterministic:
	•	In Demo Mode, synthetic events cause a known trigger (e.g. geo-skew)
	•	PostHog workflow sends email
	•	Inbound parse triggers Retool Agent
	•	Retool Agent returns a predictable “localize” strategy
	•	Experiment launches within ~60 seconds

This creates a crisp on-stage story:

“PostHog detects geo-skew → Retool Agent decides strategy → Cline ships A/B test.”

⸻

Minimal Implementation Steps (to add to implementation plan)
	1.	Create PostHog Workflow → email on triggers
	2.	Set up Resend Inbound Parse → webhook to LaunchLoop
	3.	Implement /api/signals/posthog-email handler
	4.	Create Retool Agent + prompt + JSON schema
	5.	Implement RetoolAgentAdapter in LaunchLoop API
	6.	Wire decision → enqueue worker job CREATE_EXPERIMENT_VARIANT
	7.	Log all steps into Activity feed for “agent working” proof
	8.	Add Retool UI page/card showing “Decision Agent” status + last decisions

⸻

Safety & Controls
	•	If kill switch is on: always return NO_ACTION (still log the decision request).
	•	If confidence < threshold (e.g. 0.7): return NEEDS_HUMAN_REVIEW (MVP can treat as NO_ACTION but logs it).
	•	Add rate limit: max 1 new experiment per project per X hours.

⸻
