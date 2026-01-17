```bash
# Sends a manual web-chat trigger to the local API to test the Retool Agent decision flow.
curl -X POST "http://localhost:3001/api/signals/web-chat" \
  -H "Authorization: Bearer 36b4a4848e83ccda5e31eb9f85971f7723ac67764df459c44cb17b8afb1dbb8e" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"proj_test_123","triggerType":"geo_skew","metricsSnapshot":{"sessions":1200,"conversionRate":0.009,"topCountry":"DE","topCountryShare":0.62},"siteUrl":"https://example.vercel.app","timestamp":"2025-01-16T12:00:00Z"}'

# Fetch a worker job by id to verify it transitions from queued to succeeded.
curl -H "X-Worker-Secret: 2112d0c824073e7ed1df0769ae1976da32af46ccbfc19b77b90368273b292ab9" \
  "http://localhost:3002/worker/jobs/30e4d3a6-6785-4a6d-9346-15872390be3b"
```

```bash
# Create a test project via the API (returns project id).
curl -X POST "http://localhost:3001/api/projects" -H "Authorization: Bearer 36b4a4848e83ccda5e31eb9f85971f7723ac67764df459c44cb17b8afb1dbb8e" -H "Content-Type: application/json" -d '{"name":"Test Project","brief":{"product":"LaunchLoop","description":"Autonomous landing page growth loop","icp":"Indie founders","primaryCTA":"Join waitlist","brandVibe":"bold"},"funnelArchetype":"single-cta"}'

# Fetch a project by id (replace <PROJECT_ID>).
curl -H "Authorization: Bearer 36b4a4848e83ccda5e31eb9f85971f7723ac67764df459c44cb17b8afb1dbb8e" "http://localhost:3001/api/projects/<PROJECT_ID>"

# Fetch activity events for a project (replace <PROJECT_ID>).
curl -H "Authorization: Bearer 36b4a4848e83ccda5e31eb9f85971f7723ac67764df459c44cb17b8afb1dbb8e" "http://localhost:3001/api/projects/<PROJECT_ID>/activity"

# Enqueue a bootstrap landing repo job (creates a GitHub repo named launchloop-<PROJECT_ID>).
curl -X POST "http://localhost:3002/worker/jobs" -H "X-Worker-Secret: 2112d0c824073e7ed1df0769ae1976da32af46ccbfc19b77b90368273b292ab9" -H "Content-Type: application/json" -d '{"type":"BOOTSTRAP_LANDING_REPO","projectId":"<PROJECT_ID>","payload":{"siteConfig":{"archetype":"single-cta","productName":"LaunchLoop","tagline":"Launch faster with autonomous growth loops","ctaLabel":"Join waitlist","heroDescription":"Generate, deploy, and optimize landing pages with continuous learning.","sections":[{"title":"Autopilot experiments","body":"Run headline and hero tests that improve conversion without manual effort."},{"title":"Live metrics","body":"Track sessions, clicks, and qualified leads in one dashboard."}]}}}'

# Fetch a worker job by id (replace <JOB_ID>).
curl -H "X-Worker-Secret: 2112d0c824073e7ed1df0769ae1976da32af46ccbfc19b77b90368273b292ab9" "http://localhost:3002/worker/jobs/<JOB_ID>"

# Enqueue a deploy job for a GitHub repo (replace <OWNER> and <REPO>).
curl -X POST "http://localhost:3002/worker/jobs" -H "X-Worker-Secret: 2112d0c824073e7ed1df0769ae1976da32af46ccbfc19b77b90368273b292ab9" -H "Content-Type: application/json" -d '{"type":"DEPLOY_LANDING_REPO","projectId":"proj_test_123","payload":{"repo":{"owner":"<OWNER>","name":"<REPO>"}}}'

# Enqueue a deploy job for the latest repo.
curl -X POST "http://localhost:3002/worker/jobs" -H "X-Worker-Secret: 2112d0c824073e7ed1df0769ae1976da32af46ccbfc19b77b90368273b292ab9" -H "Content-Type: application/json" -d '{"type":"DEPLOY_LANDING_REPO","projectId":"proj_test_123","payload":{"repo":{"owner":"jakebutler","name":"launchloop-proj_test_123-hiikm0"}}}'

# Fetch metrics snapshot (PostHog) for the current project.
curl -H "Authorization: Bearer 36b4a4848e83ccda5e31eb9f85971f7723ac67764df459c44cb17b8afb1dbb8e" "http://localhost:3001/api/projects/proj_test_123/metrics"

# Enqueue an experiment variant job that updates site.config.json and redeploys.
curl -X POST "http://localhost:3002/worker/jobs" -H "X-Worker-Secret: 2112d0c824073e7ed1df0769ae1976da32af46ccbfc19b77b90368273b292ab9" -H "Content-Type: application/json" -d '{"type":"CREATE_EXPERIMENT_VARIANT","projectId":"proj_test_123","payload":{"repo":{"owner":"jakebutler","name":"launchloop-proj_test_123-hiikm0"},"decision":{"variantB":{"headline":"Launch faster for global teams","heroPrompt":"Localized, minimal SaaS hero with German copy emphasis"}}}}'

# Create a fresh project for end-to-end repo metadata wiring (returns project id).
curl -X POST "http://localhost:3001/api/projects" -H "Authorization: Bearer 36b4a4848e83ccda5e31eb9f85971f7723ac67764df459c44cb17b8afb1dbb8e" -H "Content-Type: application/json" -d '{"name":"Repo Wiring Test","brief":{"product":"LaunchLoop","description":"Autonomous landing page growth loop","icp":"Indie founders","primaryCTA":"Join waitlist","brandVibe":"bold"},"funnelArchetype":"single-cta"}'

# Bootstrap repo for the new project (replace <PROJECT_ID>).
curl -X POST "http://localhost:3002/worker/jobs" -H "X-Worker-Secret: 2112d0c824073e7ed1df0769ae1976da32af46ccbfc19b77b90368273b292ab9" -H "Content-Type: application/json" -d '{"type":"BOOTSTRAP_LANDING_REPO","projectId":"<PROJECT_ID>","payload":{"siteConfig":{"archetype":"single-cta","productName":"LaunchLoop","tagline":"Launch faster with autonomous growth loops","ctaLabel":"Join waitlist","heroDescription":"Generate, deploy, and optimize landing pages with continuous learning.","sections":[{"title":"Autopilot experiments","body":"Run headline and hero tests that improve conversion without manual effort."},{"title":"Live metrics","body":"Track sessions, clicks, and qualified leads in one dashboard."}]}}}'

# Trigger a web-chat signal to enqueue CREATE_EXPERIMENT_VARIANT using stored repo metadata (replace <PROJECT_ID>).
curl -X POST "http://localhost:3001/api/signals/web-chat" -H "Authorization: Bearer 36b4a4848e83ccda5e31eb9f85971f7723ac67764df459c44cb17b8afb1dbb8e" -H "Content-Type: application/json" -d '{"projectId":"<PROJECT_ID>","triggerType":"geo_skew","metricsSnapshot":{"sessions":1200,"conversionRate":0.009,"topCountry":"DE","topCountryShare":0.62},"siteUrl":"https://example.vercel.app","timestamp":"2026-01-16T12:00:00Z"}'

# Fetch experiments for a project (replace <PROJECT_ID>).
curl -H "Authorization: Bearer 36b4a4848e83ccda5e31eb9f85971f7723ac67764df459c44cb17b8afb1dbb8e" "http://localhost:3001/api/projects/<PROJECT_ID>/experiments"

# Test commands for proj_test_123
# Enqueue a bootstrap landing repo job (creates a GitHub repo named launchloop-<PROJECT_ID>).
curl -X POST "http://localhost:3002/worker/jobs" -H "X-Worker-Secret: 2112d0c824073e7ed1df0769ae1976da32af46ccbfc19b77b90368273b292ab9" -H "Content-Type: application/json" -d '{"type":"BOOTSTRAP_LANDING_REPO","projectId":"proj_test_123","payload":{"siteConfig":{"archetype":"single-cta","productName":"LaunchLoop","tagline":"Launch faster with autonomous growth loops","ctaLabel":"Join waitlist","heroDescription":"Generate, deploy, and optimize landing pages with continuous learning.","sections":[{"title":"Autopilot experiments","body":"Run headline and hero tests that improve conversion without manual effort."},{"title":"Live metrics","body":"Track sessions, clicks, and qualified leads in one dashboard."}]}}}'

curl -H "X-Worker-Secret: 2112d0c824073e7ed1df0769ae1976da32af46ccbfc19b77b90368273b292ab9" "http://localhost:3002/worker/jobs/58453966-5f13-40e4-878c-7b6398c7ae41"

curl -H "X-Worker-Secret: 2112d0c824073e7ed1df0769ae1976da32af46ccbfc19b77b90368273b292ab9" "http://localhost:3002/worker/jobs/dbeea3d1-8ba2-49d4-b3f4-b55fbb968feb"
```
