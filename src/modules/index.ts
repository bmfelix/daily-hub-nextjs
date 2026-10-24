import { CurrencyModule } from './currency/CurrencyModule'
import type { HubModule } from './HubModule'
import { NewsModule } from './news/NewsModule'
import { NotesModule } from './notes/NotesModule'
import { RadioModule } from './radio/RadioModule'
import { TodoModule } from './todo/TodoModule'
import { WeatherModule } from './weather/WeatherModule'

// Menu order. Add a new module instance here (and its slug to slugs.ts) to give it a page and a menu link.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each module has its own data type
export const MODULES: HubModule<any, any>[] = [
  new WeatherModule(),
  new NewsModule(),
  new TodoModule(),
  new CurrencyModule(),
  new NotesModule(),
  new RadioModule(),
]

export function findModule(slug: string) {
  return MODULES.find((hubModule) => hubModule.slug === slug)
}
