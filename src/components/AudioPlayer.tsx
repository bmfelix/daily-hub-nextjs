'use client'

import { useEffect } from 'react'

/**
 * Song previews and live stations share one audio element, so only one thing
 * plays at a time. What is playing is tracked by address, because the live
 * cards replace their buttons. Buttons only need a data-src attribute.
 */
export function AudioPlayer() {
  useEffect(() => {
    const audio = new Audio()
    let currentSrc = ''

    const buttons = () => document.querySelectorAll<HTMLButtonElement>('[data-src]')

    function show() {
      buttons().forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.src === currentSrc && !audio.paused))
        if (button.dataset.src !== currentSrc) button.style.setProperty('--progress', '0')
      })
    }

    function stop() {
      audio.removeAttribute('src')
      audio.load()
      currentSrc = ''
      show()
    }

    function onClick(event: MouseEvent) {
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-src]')
      if (!button) return
      const src = button.dataset.src ?? ''
      if (src === currentSrc && !audio.paused) {
        // A live station cannot be resumed from where it paused, so it stops instead.
        if ('live' in button.dataset) stop()
        else audio.pause()
        return
      }
      if (src !== currentSrc) {
        currentSrc = src
        audio.src = src
      }
      audio.play().catch(() => {
        stop()
        button.disabled = true
        button.title = 'This could not be played.'
      })
    }

    function onTime() {
      if (!Number.isFinite(audio.duration)) return // live stations have no end
      buttons().forEach((button) => {
        if (button.dataset.src === currentSrc) button.style.setProperty('--progress', String((audio.currentTime / audio.duration) * 100))
      })
    }

    document.addEventListener('click', onClick)
    document.addEventListener('cards-updated', show)
    audio.addEventListener('play', show)
    audio.addEventListener('pause', show)
    audio.addEventListener('ended', stop)
    audio.addEventListener('timeupdate', onTime)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('cards-updated', show)
      audio.pause()
    }
  }, [])

  return null
}
