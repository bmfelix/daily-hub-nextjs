import { AboutModule } from './about/AboutModule'
import { AgendaModule } from './agenda/AgendaModule'
import { BratModule } from './brat/BratModule'
import { BuiltModule } from './built/BuiltModule'
import { ChartsModule } from './charts/ChartsModule'
import { ConcertsModule } from './concerts/ConcertsModule'
import type { HubModule } from './HubModule'
import { ListeningModule } from './listening/ListeningModule'
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
  new NotesModule(),
  new AgendaModule(),
  new RadioModule(),
  new ChartsModule(),
  new ConcertsModule(),
  new ListeningModule(),
  new BratModule(),
  new AboutModule(),
  new BuiltModule(),
]

export function findModule(slug: string) {
  return MODULES.find((hubModule) => hubModule.slug === slug)
}
