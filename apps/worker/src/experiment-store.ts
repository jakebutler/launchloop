import crypto from 'crypto'
import { Experiment } from '@launchloop/shared'
import { getDb } from './db'

const now = () => new Date().toISOString()

export const createExperiment = (
  projectId: string,
  input: Omit<Experiment, 'id' | 'startAt'>
) => {
  const experiment: Experiment = {
    ...input,
    id: crypto.randomUUID(),
    startAt: now()
  }

  getDb()
    .prepare(
      `INSERT INTO experiments (id, project_id, type, variants, start_at, end_at, winner)
       VALUES (@id, @project_id, @type, @variants, @start_at, @end_at, @winner)`
    )
    .run({
      id: experiment.id,
      project_id: projectId,
      type: experiment.type,
      variants: JSON.stringify(experiment.variants),
      start_at: experiment.startAt,
      end_at: experiment.endAt || null,
      winner: experiment.winner || null
    })

  return experiment
}

export const listExperiments = (projectId: string): Experiment[] => {
  const rows = getDb()
    .prepare(
      `SELECT id, type, variants, start_at, end_at, winner
       FROM experiments
       WHERE project_id = ?
       ORDER BY start_at DESC`
    )
    .all(projectId) as {
    id: string
    type: Experiment['type']
    variants: string
    start_at: string
    end_at: string | null
    winner: Experiment['winner']
  }[]

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    variants: JSON.parse(row.variants),
    startAt: row.start_at,
    endAt: row.end_at || undefined,
    winner: row.winner || undefined
  }))
}

export const setExperimentWinner = (id: string, winner: 'A' | 'B') => {
  getDb()
    .prepare(`UPDATE experiments SET winner = ?, end_at = ? WHERE id = ?`)
    .run(winner, now(), id)
}
