import type { ComponentType } from 'react'

export type SearchParams = Record<string, string | string[] | undefined>

/** Read one query-string value, ignoring repeats. */
export function param(params: SearchParams, name: string): string {
  const value = params[name]
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? ''
}

/** One Daily Hub page. Each subclass is one menu link and owns its API calls. */
export abstract class HubModule<Data = unknown, CardData = undefined> {
  abstract readonly slug: string
  abstract readonly title: string
  abstract readonly summary: string
  abstract readonly View: ComponentType<{ data: Data }>

  /** Optional homepage card. Without one, the card shows the summary. */
  readonly Card?: ComponentType<{ data: CardData }>

  /** Return the data the page needs. Subclasses call their API here. */
  abstract load(params: SearchParams): Promise<Data>

  /** Return the data the homepage card needs. Modules with a Card override this. */
  async card(): Promise<CardData | undefined> {
    return undefined
  }
}
