import { z } from 'zod'

export const briefSchema = z.object({
  product: z.string().min(1),
  description: z.string().min(1),
  icp: z.string().min(1),
  primaryCTA: z.string().min(1),
  brandVibe: z.string().min(1),
  notes: z.string().optional()
})

export const signalPayloadSchema = z.object({
  projectId: z.string().min(1),
  triggerType: z.enum(['low_conversion', 'form_abandonment', 'geo_skew']),
  metricsSnapshot: z.record(z.unknown()),
  siteUrl: z.string().url().optional(),
  timestamp: z.string().min(1)
})

export const retoolDecisionSchema = z.object({
  decision: z.enum(['CREATE_AB_TEST', 'NO_ACTION', 'NEEDS_HUMAN_REVIEW']),
  experimentType: z.literal('headline_hero'),
  hypothesis: z.string().min(1),
  variantB: z.object({
    headline: z.string().min(1),
    heroPrompt: z.string().min(1)
  }),
  confidence: z.number().min(0).max(1),
  explanation: z.string().min(1)
})

export const workerJobSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'BOOTSTRAP_LANDING_REPO',
    'DEPLOY_LANDING_REPO',
    'UPDATE_LANDING_COPY',
    'CREATE_EXPERIMENT_VARIANT',
    'PROMOTE_WINNER'
  ]),
  projectId: z.string().min(1),
  payload: z.record(z.unknown()),
  status: z.enum(['queued', 'running', 'succeeded', 'failed', 'canceled']),
  summary: z.string().optional(),
  output: z.record(z.unknown()).optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
})

export const createProjectSchema = z.object({
  name: z.string().min(1),
  brief: briefSchema,
  funnelArchetype: z.enum(['single-cta', 'story', 'comparison'])
})
