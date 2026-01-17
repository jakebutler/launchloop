# LaunchLoop Runbooks

## Environment setup

1. Copy `.env.example` to `.env` for each app:
   - `apps/api/.env`
   - `apps/worker/.env`
   - `apps/template-seed/.env`
2. Fill in all required keys before running services.

## Retool Agent workflow

1. Create a Retool Workflow with a Webhook trigger.
2. Add an auth check step that validates `Authorization: Bearer <RETOOL_AGENT_API_KEY>`.
3. Return a JSON response matching the Retool decision schema.
4. Set `RETOOL_AGENT_WEBHOOK_URL` in `apps/api/.env`.

## PostHog trigger emails

1. Configure a PostHog Workflow to send email on trigger events.
2. Include `projectId`, `triggerType`, `metricsSnapshot`, and `timestamp` in the email body.
3. Set up Resend inbound parse to forward to `/api/signals/posthog-email`.
4. Store the Resend inbound signing key in `RESEND_INBOUND_SIGNING_KEY`.

## Fly worker setup

1. Create Fly app: `fly apps create launchloop-worker`.
2. Create volume: `fly volumes create launchloop_data --app launchloop-worker --region <region> --size 10`.
3. Set `WORKER_BASE_URL` to the worker URL (e.g., `https://launchloop-worker.fly.dev`).

## Smoke checks

Run `scripts/smoke-checks.sh` once services are running.
