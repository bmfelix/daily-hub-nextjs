'use client'

import { useEffect } from 'react'

/**
 * With no city chosen, asks the browser where the visitor is. Coordinates are
 * rounded to about 1 km. If they say no, the page stays on the default city.
 */
export function LocateVisitor() {
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const url = new URL(window.location.href)
        url.searchParams.set('lat', position.coords.latitude.toFixed(2))
        url.searchParams.set('lon', position.coords.longitude.toFixed(2))
        window.location.replace(url)
      },
      () => {},
      { maximumAge: 600000, timeout: 10000 },
    )
  }, [])

  return null
}
