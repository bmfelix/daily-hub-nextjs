'use client'

type Props = React.ImgHTMLAttributes<HTMLImageElement> & { fallback?: string }

/**
 * An external image that tries a fallback if it fails to load, then removes
 * itself, revealing the placeholder behind it. Plain <img>: the photo and cover
 * hosts redirect to many servers, which Next's image optimizer would each need listed.
 */
export function HideOnError({ fallback, ...props }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- alt is passed in by the caller
    <img
      {...props}
      data-fallback={fallback || undefined}
      onError={({ currentTarget }) => {
        if (currentTarget.dataset.fallback) {
          currentTarget.src = currentTarget.dataset.fallback
          delete currentTarget.dataset.fallback
        } else {
          currentTarget.remove()
        }
      }}
    />
  )
}
