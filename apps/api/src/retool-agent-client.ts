import fetch from 'node-fetch'
import { RetoolDecision, SignalPayload } from '@launchloop/shared'
import { retoolDecisionSchema } from '@launchloop/shared'
import { config } from './config'

type RetoolAgentRequest = {
  signal: SignalPayload
  currentExperimentStatus?: Record<string, unknown>
}

export const callRetoolAgent = async (
  payload: RetoolAgentRequest
): Promise<RetoolDecision> => {
  const response = await fetch(config.retoolAgentWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Workflow-Api-Key': config.retoolAgentApiKey,
      'X-API-Key': config.retoolAgentApiKey
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Retool agent request failed: ${response.status} ${text}`)
  }

  const data = (await response.json()) as unknown
  const parsed = retoolDecisionSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Retool agent returned invalid payload: ${parsed.error.message}`)
  }

  return parsed.data
}
