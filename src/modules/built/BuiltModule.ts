import { HubModule } from '../HubModule'
import { BuiltView } from './BuiltView'

export type BuiltData = { sites: Record<string, string> }

export class BuiltModule extends HubModule<BuiltData> {
  readonly slug = 'built'
  readonly title = "How it's built"
  readonly summary = 'One app, built three times to compare the frameworks.'
  readonly View = BuiltView
  readonly inMenu = false
  readonly onHome = false

  /** Where each build runs. An empty address leaves its heading as plain text. */
  async load(): Promise<BuiltData> {
    return {
      sites: {
        Django: process.env.DJANGO_SITE_URL ?? '',
        'Next.js': process.env.NEXTJS_SITE_URL ?? '',
        Laravel: process.env.LARAVEL_SITE_URL ?? '',
      },
    }
  }
}
