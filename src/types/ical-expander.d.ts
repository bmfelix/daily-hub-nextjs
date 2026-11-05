declare module 'ical-expander' {
  type Time = { isDate: boolean; toJSDate(): Date }
  type Event = { summary?: string; location?: string; startDate: Time }
  export default class IcalExpander {
    constructor(options: { ics: string; maxIterations?: number })
    between(after: Date, before: Date): {
      events: Event[]
      occurrences: { startDate: Time; item: Event }[]
    }
  }
}
