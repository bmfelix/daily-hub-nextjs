import Link from 'next/link'
import React from 'react'

import { AudioPlayer } from '@/components/AudioPlayer'
import { SiteMenu, type MenuItem } from '@/components/SiteMenu'
import { getMenuPages } from '@/lib/pages'
import { MODULES } from '@/modules'
import './styles.css'

// The menu includes CMS pages, so every request reads the current list.
export const dynamic = 'force-dynamic'

export const metadata = {
  description: 'A personal dashboard built with Next.js and Payload CMS.',
  title: { default: 'Daily Hub', template: '%s · Daily Hub' },
}

const FONTS =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Instrument+Sans:wght@400..700&family=Martian+Mono:wght@400;500&display=swap'

function Note({ id, shape, viewBox }: { id: number; shape: string; viewBox: string }) {
  return (
    <svg className={`note note-${id}`} viewBox={viewBox}>
      <use href={`#${shape}`} />
    </svg>
  )
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const items: MenuItem[] = [
    { href: '/', title: 'Home' },
    ...MODULES.filter((hubModule) => hubModule.inMenu).map((hubModule) => ({ href: `/${hubModule.slug}`, title: hubModule.title })),
    ...(await getMenuPages()).map((page) => ({ href: `/${page.slug}`, title: page.title })),
  ]

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>
        <div className="stage-lights" aria-hidden="true">
          <span className="beam beam-1" />
          <span className="beam beam-2" />
          <span className="beam beam-3" />
          <span className="beam beam-4" />
        </div>
        <div className="note-field" aria-hidden="true">
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <symbol id="eighth-note" viewBox="0 0 44 64">
              <ellipse cx="13" cy="51" rx="12.5" ry="9.5" transform="rotate(-20 13 51)" />
              <rect x="21.5" y="4" width="4" height="46" />
              <path d="M25.5 4c1 10 16 14 15 31-2-9-8-14-15-16z" />
            </symbol>
            <symbol id="beamed-notes" viewBox="0 0 64 64">
              <ellipse cx="12" cy="52" rx="11" ry="8.5" transform="rotate(-20 12 52)" />
              <ellipse cx="50" cy="45" rx="11" ry="8.5" transform="rotate(-20 50 45)" />
              <rect x="19" y="13" width="4" height="39" />
              <rect x="57" y="6" width="4" height="39" />
              <path d="M19 13 61 4v11l-42 9z" />
            </symbol>
          </svg>
          <Note id={1} shape="beamed-notes" viewBox="0 0 64 64" />
          <Note id={2} shape="eighth-note" viewBox="0 0 44 64" />
          <Note id={3} shape="eighth-note" viewBox="0 0 44 64" />
          <Note id={4} shape="beamed-notes" viewBox="0 0 64 64" />
          <Note id={5} shape="eighth-note" viewBox="0 0 44 64" />
        </div>

        <header className="site-header">
          <div className="wrap header-inner">
            <Link className="brand" href="/">
              <span className="brand-disc" aria-hidden="true" />
              Daily Hub
            </Link>
            <SiteMenu items={items} />
          </div>
        </header>

        <main className="wrap">{children}</main>

        <footer className="site-footer wrap">
          Daily Hub · Next.js version · <Link href="/built">How it&apos;s built</Link>
        </footer>
        <AudioPlayer />
      </body>
    </html>
  )
}
