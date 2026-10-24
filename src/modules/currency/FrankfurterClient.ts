const API_URL = 'https://api.frankfurter.dev/v1'

/** Talks to Frankfurter, a free exchange-rate API that needs no key. */
export class FrankfurterClient {
  timeout = 8000

  currencies(): Promise<Record<string, string>> {
    return this.getJson(`${API_URL}/currencies`)
  }

  async convert(amount: number, source: string, target: string) {
    const data = await this.getJson<{ date: string; rates: Record<string, number> }>(
      `${API_URL}/latest?${new URLSearchParams({ base: source, symbols: target })}`,
    )
    const rate = data.rates[target]
    return { rate, result: amount * rate, date: data.date }
  }

  private async getJson<T>(url: string): Promise<T> {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(this.timeout) })
    if (!response.ok) throw new Error(`Frankfurter returned ${response.status}`)
    return response.json() as Promise<T>
  }
}
