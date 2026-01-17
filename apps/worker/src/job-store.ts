import { WorkerJob } from '@launchloop/shared'
import { getDb } from './db'

const now = () => new Date().toISOString()

export const enqueueJob = (job: Omit<WorkerJob, 'status' | 'createdAt' | 'updatedAt'>): WorkerJob => {
  const record: WorkerJob = {
    ...job,
    status: 'queued',
    createdAt: now(),
    updatedAt: now()
  }

  const db = getDb()
  db.prepare(
    `INSERT INTO jobs (id, type, project_id, payload, status, summary, output, created_at, updated_at)
     VALUES (@id, @type, @project_id, @payload, @status, @summary, @output, @created_at, @updated_at)`
  ).run({
    id: record.id,
    type: record.type,
    project_id: record.projectId,
    payload: JSON.stringify(record.payload),
    status: record.status,
    summary: null,
    output: null,
    created_at: record.createdAt,
    updated_at: record.updatedAt
  })

  return record
}

export const getJob = (id: string): WorkerJob | null => {
  const row = getDb()
    .prepare('SELECT * FROM jobs WHERE id = ?')
    .get(id) as {
      id: string
      type: WorkerJob['type']
      project_id: string
      payload: string
      status: WorkerJob['status']
      summary?: string | null
      output?: string | null
      created_at: string
      updated_at: string
    } | undefined

  if (!row) {
    return null
  }

  return {
    id: row.id,
    type: row.type,
    projectId: row.project_id,
    payload: JSON.parse(row.payload),
    status: row.status,
    summary: row.summary || undefined,
    output: row.output ? JSON.parse(row.output) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const dequeueNextJob = (): WorkerJob | null => {
  const row = getDb()
    .prepare(
      `SELECT * FROM jobs WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1`
    )
    .get() as {
      id: string
      type: WorkerJob['type']
      project_id: string
      payload: string
      status: WorkerJob['status']
      created_at: string
      updated_at: string
    } | undefined

  if (!row) {
    return null
  }

  return {
    id: row.id,
    type: row.type,
    projectId: row.project_id,
    payload: JSON.parse(row.payload),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const updateJobStatus = (
  id: string,
  status: WorkerJob['status'],
  summary?: string,
  output?: Record<string, unknown>
): WorkerJob | null => {
  const updatedAt = now()
  getDb()
    .prepare(
      `UPDATE jobs SET status = ?, summary = ?, output = ?, updated_at = ? WHERE id = ?`
    )
    .run(status, summary || null, output ? JSON.stringify(output) : null, updatedAt, id)

  return getJob(id)
}

export const updateJobOutput = (id: string, output: Record<string, unknown>) => {
  getDb()
    .prepare(`UPDATE jobs SET output = ?, updated_at = ? WHERE id = ?`)
    .run(JSON.stringify(output), now(), id)
}
