import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const requireEnv = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value
}

const nodeEnv = process.env.NODE_ENV || 'development'
const repoRoot = path.resolve(__dirname, '..', '..', '..')
const defaultWorkspaceRoot =
  nodeEnv === 'development' ? path.join(repoRoot, 'data', 'workspaces') : '/data/workspaces'
const defaultSqlitePath =
  nodeEnv === 'development' ? path.join(repoRoot, 'data', 'launchloop.sqlite') : '/data/launchloop.sqlite'
const defaultTemplateSeedPath = path.join(repoRoot, 'apps', 'template-seed')

export const config = {
  workerSharedSecret: requireEnv('WORKER_SHARED_SECRET'),
  workspaceRoot: process.env.WORKSPACE_ROOT || defaultWorkspaceRoot,
  sqliteDbPath: process.env.SQLITE_DB_PATH || defaultSqlitePath,
  logLevel: process.env.LOG_LEVEL || 'info',
  jobPollIntervalMs: Number(process.env.JOB_POLL_INTERVAL_MS || '5000'),
  githubToken: requireEnv('GITHUB_TOKEN'),
  githubOrg: process.env.GITHUB_ORG || '',
  gitAuthorName: process.env.GIT_AUTHOR_NAME || 'LaunchLoop Bot',
  gitAuthorEmail: process.env.GIT_AUTHOR_EMAIL || 'bot@launchloop.local',
  templateSeedPath: process.env.TEMPLATE_SEED_PATH || defaultTemplateSeedPath,
  vercelToken: requireEnv('VERCEL_TOKEN'),
  vercelTeamId: process.env.VERCEL_TEAM_ID || ''
}
