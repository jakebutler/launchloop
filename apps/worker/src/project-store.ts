import crypto from 'crypto'
import { Brief, Project } from '@launchloop/shared'
import { getDb } from './db'

const now = () => new Date().toISOString()

export type CreateProjectInput = {
  name: string
  brief: Brief
  funnelArchetype: Project['funnelArchetype']
}

export const createProject = (input: CreateProjectInput): Project => {
  const project: Project = {
    id: crypto.randomUUID(),
    name: input.name,
    brief: input.brief,
    funnelArchetype: input.funnelArchetype,
    mode: 'full-agent',
    status: 'building',
    demoMode: false
  }

  const db = getDb()
  db.prepare(
    `INSERT INTO projects (id, name, brief, funnel_archetype, mode, status, demo_mode, created_at, updated_at)
     VALUES (@id, @name, @brief, @funnel_archetype, @mode, @status, @demo_mode, @created_at, @updated_at)`
  ).run({
    id: project.id,
    name: project.name,
    brief: JSON.stringify(project.brief),
    funnel_archetype: project.funnelArchetype,
    mode: project.mode,
    status: project.status,
    demo_mode: project.demoMode ? 1 : 0,
    created_at: now(),
    updated_at: now()
  })

  return project
}

export const getProject = (id: string): Project | null => {
  const row = getDb()
    .prepare('SELECT * FROM projects WHERE id = ?')
    .get(id) as
    | {
        id: string
        name: string
        brief: string
        funnel_archetype: Project['funnelArchetype']
        mode: Project['mode']
        status: Project['status']
        demo_mode: number
        repo_owner: string | null
        repo_name: string | null
      }
    | undefined

  if (!row) {
    return null
  }

  return {
    id: row.id,
    name: row.name,
    brief: JSON.parse(row.brief) as Brief,
    funnelArchetype: row.funnel_archetype,
    repo: row.repo_owner && row.repo_name ? { owner: row.repo_owner, name: row.repo_name } : undefined,
    mode: row.mode,
    status: row.status,
    demoMode: row.demo_mode === 1
  }
}

export const setProjectRepo = (id: string, repo: { owner: string; name: string }) => {
  getDb()
    .prepare('UPDATE projects SET repo_owner = ?, repo_name = ?, updated_at = ? WHERE id = ?')
    .run(repo.owner, repo.name, now(), id)
}
