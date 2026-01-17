import fetch from 'node-fetch'
import { config } from './config'

const posthogFetch = async (path: string) => {
  const url = new URL(path, config.posthogHost)
  return fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${config.posthogApiKey}`,
      'Content-Type': 'application/json'
    }
  })
}

const fetchEventCount = async (projectId: string, event: string) => {
  const response = await posthogFetch(`/api/projects/${projectId}/events/?event=${encodeURIComponent(event)}`)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`PostHog events fetch failed: ${response.status} ${text}`)
  }

  const data = (await response.json()) as { count?: number }
  return data.count ?? 0
}

export const getMetricsSnapshot = async (projectId: string) => {
  const [sessions, ctaClicks, leadStarts, leadSubmits] = await Promise.all([
    fetchEventCount(projectId, '$pageview'),
    fetchEventCount(projectId, 'cta_click'),
    fetchEventCount(projectId, 'lead_form_start'),
    fetchEventCount(projectId, 'lead_submit')
  ])

  const qualifiedLeadRate = sessions > 0 ? leadSubmits / sessions : 0
  const formAbandonmentRate = leadStarts > 0 ? (leadStarts - leadSubmits) / leadStarts : 0

  return {
    sessions,
    ctaClicks,
    leadStarts,
    leadSubmits,
    qualifiedLeadRate,
    formAbandonmentRate,
    geo: []
  }
}

export const getExperimentWinner = async (projectId: string) => {
  const response = await posthogFetch(`/api/projects/${projectId}/experiments/`)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`PostHog experiments fetch failed: ${response.status} ${text}`)
  }

  const data = (await response.json()) as { results?: { key: string; winner?: string }[] }
  const experiment = data.results?.[0]
  if (!experiment?.winner) {
    return null
  }

  return experiment.winner === 'variant-B' ? 'B' : 'A'
}
