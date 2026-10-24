import { HubModule, param, type SearchParams } from '../HubModule'
import { CurrencyView } from './CurrencyView'
import { FrankfurterClient } from './FrankfurterClient'

export type Conversion = { rate: number; result: number; date: string | null }

export type CurrencyData = {
  amount: string
  source: string
  target: string
  currencies?: Record<string, string>
  conversion?: Conversion
  error?: string
}

const SERVICE_DOWN = 'The exchange-rate service did not respond. Try again shortly.'

export class CurrencyModule extends HubModule<CurrencyData> {
  readonly slug = 'currency'
  readonly title = 'Currency'
  readonly summary = "Convert between currencies with today's exchange rates."
  readonly View = CurrencyView

  constructor(private client = new FrankfurterClient()) {
    super()
  }

  async load(params: SearchParams): Promise<CurrencyData> {
    const data: CurrencyData = {
      amount: param(params, 'amount') || '100',
      source: param(params, 'from') || 'USD',
      target: param(params, 'to') || 'EUR',
    }

    try {
      data.currencies = await this.client.currencies()
    } catch {
      return { ...data, error: SERVICE_DOWN }
    }

    const amount = Number(data.amount)
    if (data.amount === '' || !Number.isFinite(amount)) return { ...data, error: 'Enter a number for the amount.' }
    if (!(data.source in data.currencies) || !(data.target in data.currencies)) {
      return { ...data, error: 'Choose currencies from the list.' }
    }
    if (data.source === data.target) return { ...data, conversion: { rate: 1, result: amount, date: null } }

    try {
      data.conversion = await this.client.convert(amount, data.source, data.target)
    } catch {
      data.error = SERVICE_DOWN
    }
    return data
  }
}
