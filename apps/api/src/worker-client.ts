import fetch from 'node-fetch'
import { WorkerJob } from '@launchloop/shared'
import { config } from './config'

type EnqueueJobRequest = {
  type: WorkerJob['type']
  projectId: string
  payload: Record<string, unknown>
}

type CreateProjectRequest = {
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

export const enqueueJob = async (job: EnqueueJobRequest): Promise<WorkerJob> => {
  if (!config.workerBaseUrl) {
    throw new Error('WORKER_BASE_URL is not configured')
  }

  const response = await fetch(`${config.workerBaseUrl}/worker/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Worker-Secret': config.workerSharedSecret
    },
    body: JSON.stringify(job)
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Worker enqueue failed: ${response.status} ${text}`)
  }

  return (await response.json()) as WorkerJob
}

export const createProject = async (payload: CreateProjectRequest) => {
  if (!config.workerBaseUrl) {
    throw new Error('WORKER_BASE_URL is not configured')
  }

  const response = await fetch(`${config.workerBaseUrl}/worker/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Worker-Secret': config.workerSharedSecret
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Worker create project failed: ${response.status} ${text}`)
  }

  return response.json()
}

export const getProject = async (projectId: string) => {
  if (!config.workerBaseUrl) {
    throw new Error('WORKER_BASE_URL is not configured')
  }

  const response = await fetch(`${config.workerBaseUrl}/worker/projects/${projectId}`, {
    headers: {
      'X-Worker-Secret': config.workerSharedSecret
    }
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Worker get project failed: ${response.status} ${text}`)
  }

  return response.json() as Promise<{
    id: string
    repo?: { owner: string; name: string }
  }>
}

export const getActivity = async (projectId: string, limit = 100) => {
  if (!config.workerBaseUrl) {
    throw new Error('WORKER_BASE_URL is not configured')
  }

  const response = await fetch(
    `${config.workerBaseUrl}/worker/projects/${projectId}/activity?limit=${limit}`,
    {
      headers: {
        'X-Worker-Secret': config.workerSharedSecret
      }
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Worker activity failed: ${response.status} ${text}`)
  }

  return response.json()
}

export const getExperiments = async (projectId: string) => {
  if (!config.workerBaseUrl) {
    throw new Error('WORKER_BASE_URL is not configured')
  }

  const response = await fetch(`${config.workerBaseUrl}/worker/projects/${projectId}/experiments`, {
    headers: {
      'X-Worker-Secret': config.workerSharedSecret
    }
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Worker experiments failed: ${response.status} ${text}`)
  }

  return response.json() as Promise<{ experiments: { id: string }[] }>
}
