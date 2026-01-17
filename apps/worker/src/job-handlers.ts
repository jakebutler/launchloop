import fs from 'fs'
import path from 'path'
import { WorkerJob } from '@launchloop/shared'
import { createRepo } from './github-adapter'
import { updateJobOutput } from './job-store'
import { config } from './config'
import { copyTemplateSeed, ensureRepoCheckout, ensureWorkspace } from './workspace'
import { addRemote, commitAll, initRepo, pushMain } from './git-utils'
import { createDeployment, createProject } from './vercel-adapter'
import { createExperiment } from './experiment-store'
import { setProjectRepo } from './project-store'

const writeSiteConfig = async (
  workspacePath: string,
  payload: Record<string, unknown>
) => {
  const configPath = path.join(workspacePath, 'site.config.json')
  await fs.promises.writeFile(configPath, JSON.stringify(payload, null, 2))
}

export const handleBootstrapLandingRepo = async (job: WorkerJob) => {
  const { projectId, payload } = job
  const repoName = `launchloop-${projectId}`

  const repo = await createRepo(repoName)
  updateJobOutput(job.id, { repo })

  const workspacePath = ensureWorkspace(projectId)
  await copyTemplateSeed(workspacePath)

  if (payload.siteConfig && typeof payload.siteConfig === 'object') {
    await writeSiteConfig(workspacePath, payload.siteConfig as Record<string, unknown>)
  }

  await initRepo(workspacePath, config.gitAuthorName, config.gitAuthorEmail)
  await commitAll(workspacePath, 'chore: bootstrap landing repo')
  await addRemote(workspacePath, 'origin', repo.cloneUrl)
  await pushMain(workspacePath, 'origin')

  setProjectRepo(projectId, { owner: repo.owner, name: repo.name })

  return { repo }
}

export const handleDeployLandingRepo = async (job: WorkerJob) => {
  const payload = job.payload as {
    repo: { owner: string; name: string }
  }

  if (!payload?.repo?.owner || !payload?.repo?.name) {
    throw new Error('Missing repo info for deployment')
  }

  const project = await createProject(payload.repo.name, payload.repo)
  const deployment = await createDeployment(payload.repo)

  updateJobOutput(job.id, {
    project,
    deployment
  })

  return { project, deployment }
}

export const handleCreateExperimentVariant = async (job: WorkerJob) => {
  const payload = job.payload as {
    repo?: { owner: string; name: string }
    decision: {
      variantB: { headline: string; heroPrompt: string }
    }
  }

  const repo = payload.repo
  if (!repo?.owner || !repo?.name) {
    throw new Error('Missing repo info for experiment update')
  }

  const workspacePath = ensureWorkspace(job.projectId)
  await ensureRepoCheckout(workspacePath, repo)

  const configPath = path.join(workspacePath, 'site.config.json')
  const raw = await fs.promises.readFile(configPath, 'utf-8')
  const siteConfig = JSON.parse(raw) as Record<string, unknown>

  const variantAHeadline = typeof siteConfig.tagline === 'string' ? siteConfig.tagline : ''
  const variantBHeadline = payload.decision.variantB.headline

  if (payload.decision?.variantB?.headline) {
    siteConfig.tagline = payload.decision.variantB.headline
  }

  await fs.promises.writeFile(configPath, JSON.stringify(siteConfig, null, 2))

  await commitAll(workspacePath, 'feat: add experiment variant')
  await pushMain(workspacePath, 'origin')

  createExperiment(job.projectId, {
    type: 'headline-hero',
    variants: [
      { id: 'A', headline: variantAHeadline, heroImageUrl: '' },
      { id: 'B', headline: variantBHeadline, heroImageUrl: '' }
    ]
  })

  const project = await createProject(repo.name, repo)
  const deployment = await createDeployment(repo)

  updateJobOutput(job.id, { project, deployment })

  return { project, deployment }
}

export const handlers: Record<WorkerJob['type'], (job: WorkerJob) => Promise<any>> = {
  BOOTSTRAP_LANDING_REPO: handleBootstrapLandingRepo,
  DEPLOY_LANDING_REPO: handleDeployLandingRepo,
  UPDATE_LANDING_COPY: async () => ({ skipped: true }),
  CREATE_EXPERIMENT_VARIANT: handleCreateExperimentVariant,
  PROMOTE_WINNER: async () => ({ skipped: true })
}
