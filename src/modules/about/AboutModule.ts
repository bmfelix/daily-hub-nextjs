import { remember } from '@/lib/cache'

import { HubModule } from '../HubModule'
import { AboutView } from './AboutView'

const CACHE_SECONDS = 60 * 60
const REPOS_SHOWN = 6

export type Repository = { name: string; url: string; description: string; language: string }
export type AboutData = { repositories: Repository[]; username: string }

type RawRepo = { name: string; html_url: string; description?: string | null; language?: string | null; fork?: boolean }

export async function fetchRepositories(username: string): Promise<Repository[]> {
  const query = new URLSearchParams({ sort: 'pushed', per_page: '30', type: 'owner' })
  const response = await fetch(`https://api.github.com/users/${username}/repos?${query}`, {
    cache: 'no-store',
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(6000),
  })
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`)
  const repos = (await response.json()) as RawRepo[]
  return repos
    .filter((repo) => !repo.fork)
    .slice(0, REPOS_SHOWN)
    .map((repo) => ({ name: repo.name, url: repo.html_url, description: repo.description ?? '', language: repo.language ?? '' }))
}

export class AboutModule extends HubModule<AboutData> {
  readonly slug = 'about'
  readonly title = 'About'
  readonly summary = 'Who made this, and what else they have built.'
  readonly View = AboutView
  readonly onHome = false

  async load(): Promise<AboutData> {
    const username = process.env.GITHUB_USERNAME || 'bmfelix'
    try {
      return { username, repositories: await remember('github-repos', CACHE_SECONDS, () => fetchRepositories(username)) }
    } catch {
      return { username, repositories: [] } // GitHub being down only hides this section
    }
  }
}
