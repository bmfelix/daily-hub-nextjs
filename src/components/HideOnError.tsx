'use client'

/**
 * An external image that removes itself if it fails to load, revealing the
 * placeholder behind it. Plain <img>: the photo and cover hosts redirect to
 * many servers, which Next's image optimizer would each need listed.
 */
export function HideOnError(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- alt is passed in by the caller
  return <img {...props} onError={(event) => event.currentTarget.remove()} />
}
