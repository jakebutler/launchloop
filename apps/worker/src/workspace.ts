import fs from 'fs'
import path from 'path'
import { config } from './config'
import { cloneRepo } from './git-utils'

export const getWorkspacePath = (projectId: string) =>
  path.join(config.workspaceRoot, projectId)

export const ensureWorkspace = (projectId: string) => {
  const workspacePath = getWorkspacePath(projectId)
  fs.mkdirSync(workspacePath, { recursive: true })
  return workspacePath
}

export const copyTemplateSeed = async (workspacePath: string) => {
  const source = path.resolve(config.templateSeedPath)
  await fs.promises.cp(source, workspacePath, { recursive: true })
}

const hasGitRepo = async (workspacePath: string) => {
  try {
    await fs.promises.access(path.join(workspacePath, '.git'))
    return true
  } catch {
    return false
  }
}

export const ensureRepoCheckout = async (
  workspacePath: string,
  repo: { owner: string; name: string }
) => {
  if (await hasGitRepo(workspacePath)) {
    return
  }

  const entries = await fs.promises.readdir(workspacePath)
  if (entries.length > 0) {
    throw new Error('Workspace is not empty and has no git repo')
  }

  const url = `https://x-access-token:${config.githubToken}@github.com/${repo.owner}/${repo.name}.git`
  await cloneRepo(url, workspacePath)
}
