import { HubModule } from '../HubModule'
import { BratView } from './BratView'

export class BratModule extends HubModule<null> {
  readonly slug = 'brat'
  readonly title = 'BRAT'
  readonly summary = 'A World of Warcraft add-on that shows the spell to press now and next.'
  readonly View = BratView
  readonly onHome = false

  /** Everything on the page is written by hand. */
  async load(): Promise<null> {
    return null
  }
}
