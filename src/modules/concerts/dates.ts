// Dates like "2026-12-01" have no time zone, so they are read and shown in UTC to stay on the same day.
const noon = (date: string) => new Date(`${date}T12:00:00Z`)
const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options })

const short = format({ month: 'short', day: 'numeric' })
const long = format({ weekday: 'long', month: 'long', day: 'numeric' })
const monthName = format({ month: 'short' })
const dayNumber = format({ day: 'numeric' })

export const shortDate = (date: string) => short.format(noon(date))
export const longDate = (date: string) => long.format(noon(date))
export const monthOf = (date: string) => monthName.format(noon(date))
export const dayOf = (date: string) => dayNumber.format(noon(date))
