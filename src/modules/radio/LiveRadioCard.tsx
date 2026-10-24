'use client'

import { useEffect, useState } from 'react'

import type { RadioData } from './data'
import { RadioCard } from './RadioCard'

/** The Radio card, kept current by Server-Sent Events from /live/radio. */
export function LiveRadioCard({ data }: { data: RadioData }) {
  const [current, setCurrent] = useState(data)

  useEffect(() => {
    // EventSource reconnects by itself after a dropped connection.
    const source = new EventSource('/live/radio')
    source.addEventListener('message', (event) => setCurrent(JSON.parse(event.data) as RadioData))
    return () => source.close()
  }, [])

  return <RadioCard data={current} />
}
