import { HubModule } from '../HubModule'
import { BuiltView } from './BuiltView'

export class BuiltModule extends HubModule<null> {
  readonly slug = 'built'
  readonly title = "How it's built"
  readonly summary = 'One app, built three times to compare the frameworks.'
  readonly View = BuiltView
  readonly inMenu = false
  readonly onHome = false

  async load() {
    return null
  }
}
