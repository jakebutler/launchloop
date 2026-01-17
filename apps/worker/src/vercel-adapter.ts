import fetch, { RequestInit } from 'node-fetch'
import { config } from './config'

type CreateProjectResponse = {
  id: string
  name: string
}

type CreateDeploymentResponse = {
  id: string
  url: string
}

const vercelFetch = async (path: string, init: RequestInit) => {
  const url = new URL(`https://api.vercel.com${path}`)
  if (config.vercelTeamId) {
    url.searchParams.set('teamId', config.vercelTeamId)
  }

  const headers = {
    Authorization: `Bearer ${config.vercelToken}`,
    'Content-Type': 'application/json',
    ...(init.headers || {})
  }

  return fetch(url.toString(), {
    ...init,
    headers
  })
}

export const createProject = async (name: string, repo: { owner: string; name: string }) => {
  const response = await vercelFetch('/v9/projects', {
    method: 'POST',
    body: JSON.stringify({
      name,
      gitRepository: {
        type: 'github',
        repo: `${repo.owner}/${repo.name}`
      }
    })
  })

  if (!response.ok) {
    const text = await response.text()
    if (response.status === 409) {
      return { id: name, name }
    }
    throw new Error(`Vercel project creation failed: ${response.status} ${text}`)
  }

  const data = (await response.json()) as CreateProjectResponse
  return {
    id: data.id,
    name: data.name
  }
}

export const createDeployment = async (repo: { owner: string; name: string }) => {
  const repoId = await fetchGitHubRepoId(repo)
  const response = await vercelFetch('/v13/deployments', {
    method: 'POST',
    body: JSON.stringify({
      name: repo.name,
      gitSource: {
        type: 'github',
        repo: `${repo.owner}/${repo.name}`,
        repoId,
        ref: 'main'
      }
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Vercel deployment failed: ${response.status} ${text}`)
  }

  const data = (await response.json()) as CreateDeploymentResponse
  return {
    id: data.id,
    url: data.url
  }
}

const fetchGitHubRepoId = async (repo: { owner: string; name: string }) => {
  const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}`, {
    headers: {
      Authorization: `Bearer ${config.githubToken}`,
      'User-Agent': 'launchloop-worker'
    }
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GitHub repo lookup failed: ${response.status} ${text}`)
  }

  const data = (await response.json()) as { id: number }
  return data.id
}
