import Link from 'next/link'

export function ArtistMissing({ message }: { message: string }) {
  return (
    <>
      <h1>No artist details</h1>
      <p className="notice">{message}</p>
      <p>
        <Link href="/radio">Back to Radio</Link>
      </p>
    </>
  )
}
