import { HubModule } from '../HubModule'
import { defaultStations, type RadioData, stationData } from './data'
import { LiveRadioCard } from './LiveRadioCard'
import { RadioView } from './RadioView'
import { withSavedSongs } from './songs'
import type { Station } from './stations'

export type { RadioData, StationData } from './data'

export class RadioModule extends HubModule<RadioData, RadioData> {
  readonly slug = 'radio'
  readonly title = 'Radio'
  readonly summary = 'What is playing on Cincinnati radio.'
  readonly View = RadioView
  readonly Card = LiveRadioCard

  constructor(private stations: Station[] = defaultStations()) {
    super()
  }

  async load() {
    return withSavedSongs(await stationData(this.stations, 10))
  }

  async card() {
    return withSavedSongs(await stationData(this.stations, 1))
  }
}
