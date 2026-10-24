import type { CurrencyData } from './CurrencyModule'

export function CurrencyView({ data }: { data: CurrencyData }) {
  const options = Object.entries(data.currencies ?? {})

  return (
    <>
      <h1>Currency</h1>

      {data.currencies && (
        <form className="inline-form" method="get">
          <label htmlFor="amount">Amount</label>
          <input id="amount" name="amount" defaultValue={data.amount} inputMode="decimal" required />
          <label htmlFor="from">From</label>
          <select id="from" name="from" defaultValue={data.source}>
            {options.map(([code, name]) => (
              <option key={code} value={code}>
                {code} · {name}
              </option>
            ))}
          </select>
          <label htmlFor="to">To</label>
          <select id="to" name="to" defaultValue={data.target}>
            {options.map(([code, name]) => (
              <option key={code} value={code}>
                {code} · {name}
              </option>
            ))}
          </select>
          <button type="submit">Convert</button>
        </form>
      )}

      {data.error ? (
        <p className="notice">{data.error}</p>
      ) : (
        data.conversion && (
          <section className="panel">
            <p className="big">
              {data.conversion.result.toFixed(2)} {data.target}
            </p>
            <p>
              {data.amount} {data.source} at 1 {data.source} = {data.conversion.rate} {data.target}
              {data.conversion.date && ` (rate from ${data.conversion.date})`}
            </p>
          </section>
        )
      )}

      <p className="source">Data: Frankfurter (European Central Bank rates)</p>
    </>
  )
}
