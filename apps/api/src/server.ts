import crypto from 'crypto'
import express, { Request, Response } from 'express'
import { createProjectSchema, signalPayloadSchema } from '@launchloop/shared'
import { callRetoolAgent } from './retool-agent-client'
import { getMetricsSnapshot } from './posthog-adapter'
import { createProject, enqueueJob, getActivity, getExperiments, getProject } from './worker-client'
import { config } from './config'

type RawBodyRequest = Request & { rawBody?: Buffer }

const app = express()

app.use(
  express.json({
    verify: (req: RawBodyRequest, _res, buf) => {
      req.rawBody = buf
    }
  })
)

const requireApiAuth = (req: Request, res: Response, next: () => void) => {
  const authHeader = req.header('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token || token !== config.apiAuthSecret) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

const verifyHmac = (req: RawBodyRequest): boolean => {
  const signature = req.header('X-LaunchLoop-Signature') || ''
  if (!signature || !req.rawBody) {
    return false
  }

  const digest = crypto
    .createHmac('sha256', config.signalsHmacSecret)
    .update(req.rawBody)
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/projects', requireApiAuth, async (req, res) => {
  const parsed = createProjectSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  try {
    const project = await createProject(parsed.data)
    res.status(201).json(project)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

app.get('/api/projects/:id', requireApiAuth, async (req, res) => {
  try {
    const project = await getProject(req.params.id)
    res.json(project)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

app.get('/api/projects/:id/activity', requireApiAuth, async (req, res) => {
  try {
    const limit = Number(req.query.limit || '100')
    const events = await getActivity(req.params.id, limit)
    res.json(events)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

app.get('/api/projects/:id/metrics', requireApiAuth, async (req, res) => {
  if (!config.posthogProjectId || !config.posthogApiKey) {
    res.status(400).json({ error: 'PostHog credentials not configured' })
    return
  }

  try {
    const metrics = await getMetricsSnapshot(config.posthogProjectId)
    res.json(metrics)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

app.get('/api/projects/:id/experiments', requireApiAuth, async (req, res) => {
  try {
    const experiments = await getExperiments(req.params.id)
    res.json(experiments)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

const handleSignal = async (req: Request, res: Response) => {
  const candidate = (req.body?.signal || req.body?.payload || req.body) as unknown
  const parsed = signalPayloadSchema.safeParse(candidate)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const decision = await callRetoolAgent({ signal: parsed.data })

  if (decision.decision === 'CREATE_AB_TEST') {
    const project = await getProject(parsed.data.projectId)
    if (!project?.repo) {
      res.status(400).json({ error: 'Project repo is not set yet' })
      return
    }
    const job = await enqueueJob({
      type: 'CREATE_EXPERIMENT_VARIANT',
      projectId: parsed.data.projectId,
      payload: {
        triggerType: parsed.data.triggerType,
        decision,
        repo: project.repo
      }
    })

    res.json({ decision, job })
    return
  }

  res.json({ decision })
}

app.post('/api/signals/posthog-email', async (req: RawBodyRequest, res) => {
  if (!verifyHmac(req)) {
    res.status(401).json({ error: 'Invalid signature' })
    return
  }

  try {
    await handleSignal(req, res)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

app.post('/api/signals/web-chat', requireApiAuth, async (req, res) => {
  try {
    await handleSignal(req, res)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

const port = Number(process.env.PORT || 3001)
app.listen(port, () => {
  console.log(`API listening on ${port}`)
})
