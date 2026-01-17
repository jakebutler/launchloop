import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export const runGit = async (args: string[], cwd: string) => {
  await execFileAsync('git', args, { cwd })
}

export const initRepo = async (cwd: string, authorName: string, authorEmail: string) => {
  await runGit(['init'], cwd)
  await runGit(['config', 'user.name', authorName], cwd)
  await runGit(['config', 'user.email', authorEmail], cwd)
}

export const ensureGitIdentity = async (
  cwd: string,
  authorName: string,
  authorEmail: string
) => {
  await runGit(['config', 'user.name', authorName], cwd)
  await runGit(['config', 'user.email', authorEmail], cwd)
}

const hasChanges = async (cwd: string) => {
  const { stdout } = await execFileAsync('git', ['status', '--porcelain'], { cwd })
  return stdout.trim().length > 0
}

export const commitAll = async (cwd: string, message: string) => {
  if (!(await hasChanges(cwd))) {
    return false
  }
  await runGit(['add', '.'], cwd)
  await runGit(['commit', '-m', message], cwd)
  return true
}

export const addRemote = async (cwd: string, remote: string, url: string) => {
  await runGit(['remote', 'add', remote, url], cwd)
}

export const pushMain = async (cwd: string, remote: string) => {
  await runGit(['branch', '-M', 'main'], cwd)
  await runGit(['push', '-u', remote, 'main'], cwd)
}

export const cloneRepo = async (url: string, cwd: string) => {
  await runGit(['clone', url, '.'], cwd)
}
