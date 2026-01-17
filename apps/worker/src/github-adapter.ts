import fetch, { Response } from 'node-fetch'
import { config } from './config'

type CreateRepoResponse = {
  name: string
  owner: { login: string }
  clone_url: string
}

const requestRepo = async (url: string, name: string) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.githubToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'launchloop-worker'
    },
    body: JSON.stringify({
      name,
      private: true
    })
  })

  return response
}

const isNameConflict = async (response: Response) => {
  if (response.status !== 422) {
    return false
  }
  const text = await response.text()
  return text.includes('name already exists')
}

const buildUniqueName = (base: string) => `${base}-${Date.now().toString(36).slice(-6)}`

export const createRepo = async (name: string) => {
  const orgUrl = config.githubOrg
    ? `https://api.github.com/orgs/${config.githubOrg}/repos`
    : null
  const userUrl = 'https://api.github.com/user/repos'

  let response = orgUrl ? await requestRepo(orgUrl, name) : await requestRepo(userUrl, name)

  if (!response.ok && orgUrl && response.status === 404) {
    response = await requestRepo(userUrl, name)
  }

  if (!response.ok && (await isNameConflict(response))) {
    const fallbackName = buildUniqueName(name)
    response = orgUrl ? await requestRepo(orgUrl, fallbackName) : await requestRepo(userUrl, fallbackName)
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GitHub repo creation failed: ${response.status} ${text}`)
  }

  const data = (await response.json()) as CreateRepoResponse
  return {
    name: data.name,
    owner: data.owner.login,
    cloneUrl: data.clone_url
  }
}
