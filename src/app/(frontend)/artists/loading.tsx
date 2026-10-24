/**
 * Shown while an artist page loads. A first-time visit fetches everything from
 * MusicBrainz; the overlay fades in after a moment, so saved artists open without a flash.
 */
export default function ArtistLoading() {
  return (
    <div className="loading-overlay is-delayed" role="status" aria-live="polite">
      <div className="loading-box">
        <span className="spinner" aria-hidden="true" />
        <strong>Loading artist details…</strong>
        <span className="meta">
          The first visit fetches everything from MusicBrainz, which can take up to 30 seconds for big artists. After
          that it is instant.
        </span>
      </div>
    </div>
  )
}
