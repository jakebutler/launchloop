import crypto from 'crypto'
import express, { Request, Response } from 'express'
import { appendActivityEvent, listActivityEvents } from './activity-store'
import { listExperiments } from './experiment-store'
import { createProject, getProject } from './project-store'
import { handlers } from './job-handlers'
import { dequeueNextJob, enqueueJob, getJob, updateJobStatus } from './job-store'
import { workerJobSchema } from '@launchloop/shared'
import { config } from './config'

const app = express()
app.use(express.json())

const requireWorkerAuth = (req: Request, res: Response, next: () => void) => {
  const secret = req.header('X-Worker-Secret') || ''
  if (!secret || secret !== config.workerSharedSecret) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/worker/jobs', requireWorkerAuth, (req, res) => {
  const payload = req.body as {
    type: string
    projectId: string
    payload: Record<string, unknown>
  }

  const job = enqueueJob({
    id: crypto.randomUUID(),
    type: payload.type as any,
    projectId: payload.projectId,
    payload: payload.payload || {}
  })

  const validated = workerJobSchema.parse(job)
  appendActivityEvent(job.projectId, {
    level: 'info',
    actor: 'system',
    message: `Job enqueued: ${job.type}`,
    jobId: job.id
  })
  res.status(201).json(validated)
})

app.get('/worker/jobs/:id', requireWorkerAuth, (req, res) => {
  const job = getJob(req.params.id)
  if (!job) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  res.json(workerJobSchema.parse(job))
})

app.post('/worker/projects', requireWorkerAuth, (req, res) => {
  const payload = req.body as {
    name: string
    brief: {
      product: string
      description: string
      icp: string
      primaryCTA: string
      brandVibe: string
      notes?: string
    }
    funnelArchetype: 'single-cta' | 'story' | 'comparison'
  }

  if (!payload?.name || !payload?.brief || !payload?.funnelArchetype) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  const project = createProject({
    name: payload.name,
    brief: payload.brief,
    funnelArchetype: payload.funnelArchetype
  })

  appendActivityEvent(project.id, {
    level: 'info',
    actor: 'system',
    message: 'Project created'
  })

  res.status(201).json(project)
})

app.get('/worker/projects/:id', requireWorkerAuth, (req, res) => {
  const project = getProject(req.params.id)
  if (!project) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json(project)
})

app.get('/worker/projects/:id/activity', requireWorkerAuth, (req, res) => {
  const limit = Number(req.query.limit || '100')
  const events = listActivityEvents(req.params.id, limit)
  res.json({ events })
})

app.get('/worker/projects/:id/experiments', requireWorkerAuth, (req, res) => {
  const experiments = listExperiments(req.params.id)
  res.json({ experiments })
})

let running = false

const runNextJob = async () => {
  if (running) {
    return
  }
  const job = dequeueNextJob()
  if (!job) {
    return
  }
  running = true

  updateJobStatus(job.id, 'running')
  appendActivityEvent(job.projectId, {
    level: 'info',
    actor: 'system',
    message: `Job started: ${job.type}`,
    jobId: job.id
  })
  try {
    const handler = handlers[job.type]
    const result = await handler(job)
    updateJobStatus(job.id, 'succeeded', 'Job completed', {
      handledAt: new Date().toISOString(),
      result
    })
    appendActivityEvent(job.projectId, {
      level: 'info',
      actor: 'system',
      message: `Job succeeded: ${job.type}`,
      jobId: job.id
    })
  } catch (error) {
    updateJobStatus(job.id, 'failed', (error as Error).message)
    appendActivityEvent(job.projectId, {
      level: 'error',
      actor: 'system',
      message: `Job failed: ${job.type}`,
      jobId: job.id,
      meta: { error: (error as Error).message }
    })
  } finally {
    running = false
  }
}

setInterval(runNextJob, config.jobPollIntervalMs)

const port = Number(process.env.PORT || 3002)
app.listen(port, () => {
  console.log(`Worker listening on ${port}`)
})
