export type ProjectMode = 'full-agent' | 'recommend-only'
export type ProjectStatus = 'building' | 'live' | 'monitoring' | 'needs-attention'

export type Project = {
  id: string
  name: string
  brief: Brief
  funnelArchetype: 'single-cta' | 'story' | 'comparison'
  repo?: { owner: string; name: string }
  vercel?: { projectId: string; prodUrl: string }
  posthog?: { projectKey: string }
  mode: ProjectMode
  status: ProjectStatus
  demoMode: boolean
}

export type Brief = {
  product: string
  description: string
  icp: string
  primaryCTA: string
  brandVibe: string
  notes?: string
}

export type ExperimentVariant = {
  id: 'A' | 'B'
  headline: string
  heroImageUrl: string
}

export type Experiment = {
  id: string
  type: 'headline-hero'
  variants: ExperimentVariant[]
  startAt: string
  endAt?: string
  winner?: 'A' | 'B'
}

export type ActivityEvent = {
  ts: string
  level: 'info' | 'warn' | 'error'
  actor: 'agent' | 'cline' | 'system'
  message: string
  meta?: Record<string, unknown>
  correlationId?: string
  jobId?: string
}

export type WorkerJobType =
  | 'BOOTSTRAP_LANDING_REPO'
  | 'DEPLOY_LANDING_REPO'
  | 'UPDATE_LANDING_COPY'
  | 'CREATE_EXPERIMENT_VARIANT'
  | 'PROMOTE_WINNER'

export type WorkerJob = {
  id: string
  type: WorkerJobType
  projectId: string
  payload: Record<string, unknown>
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'
  summary?: string
  output?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type WorkerJobResult = {
  jobId: string
  status: WorkerJob['status']
  summary?: string
  output?: Record<string, unknown>
}

export type RetoolDecision = {
  decision: 'CREATE_AB_TEST' | 'NO_ACTION' | 'NEEDS_HUMAN_REVIEW'
  experimentType: 'headline_hero'
  hypothesis: string
  variantB: {
    headline: string
    heroPrompt: string
  }
  confidence: number
  explanation: string
}

export type SignalPayload = {
  projectId: string
  triggerType: 'low_conversion' | 'form_abandonment' | 'geo_skew'
  metricsSnapshot: Record<string, unknown>
  siteUrl?: string
  timestamp: string
}
