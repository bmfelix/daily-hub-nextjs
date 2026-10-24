import { HubModule } from '../HubModule'
import { defaultStations, type RadioData, stationData } from './data'
import { LiveRadioCard } from './LiveRadioCard'
import { RadioView } from './RadioView'
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

  load() {
    return stationData(this.stations, 10)
  }

  card() {
    return stationData(this.stations, 1)
  }
}
