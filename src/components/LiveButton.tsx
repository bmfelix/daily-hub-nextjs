export function LiveButton({ name, streamUrl }: { name: string; streamUrl: string }) {
  return (
    <button className="live-button" type="button" aria-pressed="false" aria-label={`Listen live to ${name}`} data-live="" data-src={streamUrl}>
      <span className="when-stopped">Listen live</span>
      <span className="when-playing">Stop</span>
    </button>
  )
}
