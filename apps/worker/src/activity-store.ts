import crypto from 'crypto'
import { ActivityEvent } from '@launchloop/shared'
import { getDb } from './db'

export const appendActivityEvent = (projectId: string, event: Omit<ActivityEvent, 'ts'>): ActivityEvent => {
  const record: ActivityEvent = {
    ...event,
    ts: new Date().toISOString()
  }

  getDb()
    .prepare(
      `INSERT INTO activity_events (id, project_id, ts, level, actor, message, meta, correlation_id, job_id)
       VALUES (@id, @project_id, @ts, @level, @actor, @message, @meta, @correlation_id, @job_id)`
    )
    .run({
      id: crypto.randomUUID(),
      project_id: projectId,
      ts: record.ts,
      level: record.level,
      actor: record.actor,
      message: record.message,
      meta: record.meta ? JSON.stringify(record.meta) : null,
      correlation_id: record.correlationId || null,
      job_id: record.jobId || null
    })

  return record
}

export const listActivityEvents = (projectId: string, limit = 100): ActivityEvent[] => {
  const rows = getDb()
    .prepare(
      `SELECT ts, level, actor, message, meta, correlation_id, job_id
       FROM activity_events
       WHERE project_id = ?
       ORDER BY ts DESC
       LIMIT ?`
    )
    .all(projectId, limit) as {
    ts: string
    level: ActivityEvent['level']
    actor: ActivityEvent['actor']
    message: string
    meta: string | null
    correlation_id: string | null
    job_id: string | null
  }[]

  return rows.map((row) => ({
    ts: row.ts,
    level: row.level,
    actor: row.actor,
    message: row.message,
    meta: row.meta ? JSON.parse(row.meta) : undefined,
    correlationId: row.correlation_id || undefined,
    jobId: row.job_id || undefined
  }))
}
