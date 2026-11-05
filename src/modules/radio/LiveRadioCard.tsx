'use client'

import { useEffect, useState } from 'react'

import type { RadioData } from './data'
import { RadioCard } from './RadioCard'

/** The station cards, kept current by Server-Sent Events from /live/radio. */
export function LiveRadioCard({ data }: { data: RadioData }) {
  const [current, setCurrent] = useState(data)

  useEffect(() => {
    // EventSource reconnects by itself after a dropped connection.
    const source = new EventSource('/live/radio')
    // The message only says something changed: saved artwork and previews come from the server.
    source.addEventListener('message', () => {
      fetch('/live/card')
        .then((response) => response.json())
        .then(setCurrent)
        .catch(() => {})
    })
    return () => source.close()
  }, [])

  useEffect(() => {
    document.dispatchEvent(new Event('cards-updated')) // the player re-marks the new buttons
  }, [current])

  return <RadioCard data={current} />
}
