import Link from 'next/link'
import React from 'react'

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const items: MenuItem[] = [
    { href: '/', title: 'Home' },
    ...MODULES.map((hubModule) => ({ href: `/${hubModule.slug}`, title: hubModule.title })),
    ...(await getMenuPages()).map((page) => ({ href: `/${page.slug}`, title: page.title })),
  ]

  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="wrap header-inner">
            <Link className="brand" href="/">
              Daily Hub
            </Link>
            <SiteMenu items={items} />
          </div>
        </header>

        <main className="wrap">{children}</main>

        <footer className="site-footer wrap">Daily Hub · Next.js version</footer>
      </body>
    </html>
  )
}
