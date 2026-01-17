import dotenv from 'dotenv'

dotenv.config()

const requireEnv = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value
}

const nodeEnv = process.env.NODE_ENV || 'development'

export const config = {
  apiAuthSecret: requireEnv('API_AUTH_SECRET'),
  workerBaseUrl:
    process.env.WORKER_BASE_URL ||
    (nodeEnv === 'development' ? 'http://localhost:3002' : ''),
  workerSharedSecret: requireEnv('WORKER_SHARED_SECRET'),
  posthogApiKey: process.env.POSTHOG_API_KEY || '',
  posthogProjectId: process.env.POSTHOG_PROJECT_ID || '',
  posthogHost: process.env.POSTHOG_HOST || 'https://app.posthog.com',
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendInboundSigningKey: process.env.RESEND_INBOUND_SIGNING_KEY || '',
  signalsHmacSecret: requireEnv('SIGNALS_HMAC_SECRET'),
  retoolAgentWebhookUrl: requireEnv('RETOOL_AGENT_WEBHOOK_URL'),
  retoolAgentApiKey: requireEnv('RETOOL_AGENT_API_KEY'),
  experimentRateLimitHours: Number(process.env.EXPERIMENT_RATE_LIMIT_HOURS || '6')
}
